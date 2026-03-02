import type { SessionUser } from "@/lib/auth/types";

export function getMockSession(): SessionUser {
  return {
    id: "usr_admin_001",
    merchantId: "mrc_001",
    fullName: "Merchant Admin",
    role: "merchant_admin",
  };
}
