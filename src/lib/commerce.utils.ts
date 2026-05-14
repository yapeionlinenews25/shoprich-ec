// lib/commerce.utils.ts
// Utilities for provider routing, currency validation and locked-down commission math

export type Provider = "paystack" | "stripe" | "none";

const PAYSTACK_COUNTRIES = [
  "NG","GH","KE","UG","TZ","RW","ZM","ZW","CM","SN","CI","ML","BF","NE","TG","BJ","LR","GM","SL","GW","MR","SD","SS","SO","DJ","ER","TD",
];

const PAYSTACK_CURRENCIES = ["NGN","GHS","KES","UGX","TZS","XAF"];
const STRIPE_CURRENCIES = ["USD","EUR","GBP","AUD","CAD","JPY","NGN","GHS"];

export function chooseProviderByCountry(countryCode?: string): Provider {
  if (!countryCode) return "stripe"; // default to stripe if unknown
  const code = countryCode.toUpperCase();
  if (PAYSTACK_COUNTRIES.includes(code)) return "paystack";
  return "stripe";
}

export function validateCurrencyForProvider(currency?: string, provider?: Provider) {
  if (!currency || !provider) return false;
  const cur = currency.toUpperCase();
  if (provider === "paystack") return PAYSTACK_CURRENCIES.includes(cur);
  if (provider === "stripe") return STRIPE_CURRENCIES.includes(cur);
  return false;
}

export function calculateCommissions(lineTotal: number, platformFeePct: number, resellerPct = 0) {
  // Ensure values are numbers
  const line = Number(lineTotal) || 0;
  const pf = Number(platformFeePct) || 0;
  const rp = Number(resellerPct) || 0;

  // Compute locked math with cents precision
  const cents = Math.round(line * 100);
  const platformFeeCents = Math.round((pf / 100) * cents);
  const resellerCents = Math.round((rp / 100) * cents);
  const vendorPayoutCents = cents - platformFeeCents - resellerCents;

  // Defensive check: vendor payout must not be negative
  if (vendorPayoutCents < 0) {
    throw new Error("Invalid commission configuration: vendor payout negative");
  }

  // Return dollar amounts with two decimals
  const platform_fee = platformFeeCents / 100;
  const reseller_commission = resellerCents / 100;
  const vendor_payout = vendorPayoutCents / 100;

  // Final assertion
  const reconstructed = +(platform_fee + reseller_commission + vendor_payout).toFixed(2);
  const roundedLine = +line.toFixed(2);
  if (reconstructed !== roundedLine) {
    // Accept small cent difference, re-balance vendor payout
    const diff = Math.round((roundedLine - reconstructed) * 100);
    // adjust vendor_payout cents
    const adjustedVendorCents = vendorPayoutCents + diff;
    if (adjustedVendorCents < 0) throw new Error("Commission rounding produced negative vendor payout");
    return {
      platform_fee,
      reseller_commission,
      vendor_payout: adjustedVendorCents / 100,
    };
  }

  return { platform_fee, reseller_commission, vendor_payout };
}
