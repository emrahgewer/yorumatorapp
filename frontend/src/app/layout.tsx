import "../styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yorumator",
  description: "Elektronik ürün karar destek platformu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
