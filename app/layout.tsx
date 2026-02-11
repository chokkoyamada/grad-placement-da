import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "マッチング理論で配属改善 | 新卒配属シミュレーター",
  description: "新卒配属を Baseline と Deferred Acceptance で比較体験できるWebアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-sm font-semibold tracking-wide text-slate-800">
                マッチング理論で配属改善
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/" className="text-slate-600 hover:text-slate-900">
                  Top
                </Link>
                <Link href="/sim" className="text-slate-600 hover:text-slate-900">
                  Simulator
                </Link>
                <Link href="/about" className="text-slate-600 hover:text-slate-900">
                  About
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
