import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listBanks, verifyAndSaveAccount, listMyPayoutAccounts, deletePayoutAccount } from "@/lib/paystack.functions";
import { toast } from "sonner";
import { CheckCircle2, Trash2, Loader2 } from "lucide-react";

const COUNTRIES: Array<{ code: string; name: string; currency: string; mm: boolean }> = [
  { code: "nigeria", name: "Nigeria", currency: "NGN", mm: false },
  { code: "ghana", name: "Ghana", currency: "GHS", mm: true },
  { code: "south africa", name: "South Africa", currency: "ZAR", mm: false },
  { code: "kenya", name: "Kenya", currency: "KES", mm: true },
  { code: "côte d'ivoire", name: "Côte d'Ivoire", currency: "XOF", mm: true },
  { code: "egypt", name: "Egypt", currency: "EGP", mm: false },
];

export function PayoutSetup() {
  const banksFn = useServerFn(listBanks);
  const saveFn = useServerFn(verifyAndSaveAccount);
  const listFn = useServerFn(listMyPayoutAccounts);
  const delFn = useServerFn(deletePayoutAccount);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [country, setCountry] = useState("nigeria");
  const [type, setType] = useState<"bank" | "mobile_money">("bank");
  const [banks, setBanks] = useState<any[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const refresh = () => listFn({}).then((r) => setAccounts(r.accounts));

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    setBanks([]);
    setBankCode("");
    setLoadingBanks(true);
    const c = COUNTRIES.find((x) => x.code === country)!;
    banksFn({
      data: {
        country,
        type: type === "mobile_money" ? "mobile_money" : undefined,
        currency: c.currency,
      },
    })
      .then((r) => { if (r.ok) setBanks(r.banks); else toast.error(r.error || "Could not load banks"); })
      .finally(() => setLoadingBanks(false));
  }, [country, type]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bank = banks.find((b) => b.code === bankCode);
    if (!bank) return toast.error("Select your bank / provider");
    const c = COUNTRIES.find((x) => x.code === country)!;
    setVerifying(true);
    try {
      const r = await saveFn({
        data: {
          country, type, bankCode, bankName: bank.name,
          accountNumber, currency: c.currency,
        },
      });
      if (!r.ok) toast.error(r.error || "Verification failed");
      else { toast.success(`Verified: ${r.accountName}`); setAccountNumber(""); refresh(); }
    } catch (e: any) {
      toast.error(e?.message ?? "Verification failed");
    } finally { setVerifying(false); }
  };

  const remove = async (id: string) => {
    await delFn({ data: { id } });
    refresh();
  };

  const c = COUNTRIES.find((x) => x.code === country)!;

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-4">
      <div>
        <h2 className="font-semibold">Payout account (Paystack)</h2>
        <p className="text-xs text-muted-foreground">Add your bank or mobile money. We auto-pull and verify the account name.</p>
      </div>

      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map((a) => (
            <div key={a.id} className="glass flex items-center justify-between rounded-xl p-3 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-semibold">
                  {a.verified && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  <span className="truncate">{a.account_name}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {a.bank_name} · {a.account_number} · {a.currency}
                  {a.is_default && <span className="ml-1 rounded bg-accent/20 px-1.5 py-0.5">default</span>}
                </div>
              </div>
              <button onClick={() => remove(a.id)} className="glass glass-hover rounded-lg p-2"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select className="glass rounded-xl px-3 py-2.5 text-sm" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>)}
          </select>
          <select className="glass rounded-xl px-3 py-2.5 text-sm" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="bank">Bank account</option>
            {c.mm && <option value="mobile_money">Mobile money</option>}
          </select>
        </div>
        <select className="glass w-full rounded-xl px-3 py-2.5 text-sm" value={bankCode} onChange={(e) => setBankCode(e.target.value)} disabled={loadingBanks}>
          <option value="">{loadingBanks ? "Loading…" : type === "mobile_money" ? "Select provider" : "Select bank"}</option>
          {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={20}
          required
          className="glass w-full rounded-xl px-4 py-2.5 text-sm"
          placeholder={type === "mobile_money" ? "Mobile number" : "Account number"}
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
        />
        <button disabled={verifying || !bankCode || !accountNumber} className="rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glass-hover inline-flex items-center gap-2 disabled:opacity-50">
          {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
          {verifying ? "Verifying with Paystack…" : "Verify & save"}
        </button>
      </form>
    </div>
  );
}
