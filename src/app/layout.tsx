import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Inbox Phase 1",
  description: "Facebook Messenger and Comment operations dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
