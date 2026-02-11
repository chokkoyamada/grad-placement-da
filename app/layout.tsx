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
        <div className="relative min-h-screen overflow-hidden text-slate-900">
          <div className="pointer-events-none absolute -left-8 top-20 h-36 w-36 rounded-full brand-gradient-soft blur-xl" />
          <div className="pointer-events-none absolute right-4 top-40 h-40 w-40 rounded-full bg-blue-200/35 blur-2xl" />

          <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <Link
                href="/"
                className="text-sm font-semibold tracking-wide text-slate-800"
              >
                マッチング理論で配属改善
              </Link>
              <nav className="flex items-center gap-2 text-sm">
                <Link href="/" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-blue-50 hover:text-slate-900">
                  Top
                </Link>
                <Link href="/sim" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-blue-50 hover:text-slate-900">
                  Simulator
                </Link>
                <Link href="/about" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-blue-50 hover:text-slate-900">
                  About
                </Link>
              </nav>
            </div>
          </header>
          <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
