export type AppRole = "merchant_admin" | "support_member";

export interface SessionUser {
  id: string;
  merchantId: string;
  fullName: string;
  role: AppRole;
}
