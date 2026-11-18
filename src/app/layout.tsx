import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Deal Stress Test",
  description: "Find the surprises in a film deal before it is locked into a smart contract.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
