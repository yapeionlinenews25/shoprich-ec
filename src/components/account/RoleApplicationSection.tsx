import { PayoutSetup } from "@/components/app/PayoutSetup";
import { RoleApplication } from "@/components/app/RoleApplication";

interface RoleApplicationSectionProps {
  roles: string[];
}

export function RoleApplicationSection({ roles }: RoleApplicationSectionProps) {
  return (
    <>
      {!roles.includes("vendor") && (
        <div className="mt-6">
          <RoleApplication role="vendor" />
        </div>
      )}
      {!roles.includes("reseller") && (
        <div className="mt-6">
          <RoleApplication role="reseller" />
        </div>
      )}
      {(roles.includes("vendor") || roles.includes("reseller")) && (
        <div className="mt-6">
          <PayoutSetup />
        </div>
      )}
    </>
  );
}
