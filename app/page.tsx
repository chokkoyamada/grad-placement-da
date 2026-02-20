import Link from "next/link";

export default function Home() {
  return (
    <section className="grid gap-8 py-8 md:py-12">
      <div className="surface-card relative overflow-hidden rounded-[2rem] p-8 md:p-10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-200/45 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 left-8 h-40 w-40 rounded-full bg-blue-100/70 blur-2xl" />

        <p className="mb-4 inline-flex items-center rounded-full border border-white/80 bg-white/85 px-4 py-1 text-xs font-semibold tracking-wide text-slate-700">
          新卒配属 × マッチング理論
        </p>
        <h1 className="max-w-4xl text-3xl font-black leading-tight text-slate-900 md:text-5xl">
          配属の納得感は、
          <span className="brand-gradient bg-clip-text text-transparent">
            {" "}
            方式で変わる
          </span>
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          このアプリは、
          <span className="font-semibold">現在方式（Baseline）</span>と
          <span className="font-semibold"> DA</span>
          の2つを同じ条件で比べる体験デモです。
          まずは満足度分布を見るだけで、配属の違いを直感的に確認できます。
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/sim?preset=standard"
            className="inline-flex items-center justify-center rounded-2xl border border-blue-600 bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:translate-y-px"
          >
            1分で比較を始める
          </Link>
          <Link
            href="/about"
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            指標の見方
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-800">納得感の可視化</h2>
          <p className="mt-2 text-sm text-slate-600">
            希望に近い配属がどれだけ増えるかを比較。
          </p>
        </article>
        <article className="surface-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-800">揉めにくさ</h2>
          <p className="mt-2 text-sm text-slate-600">
            再調整が必要になりそうな組合せの少なさを比較。
          </p>
        </article>
        <article className="surface-card rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-800">理由の透明性</h2>
          <p className="mt-2 text-sm text-slate-600">
            方式で配属が変わる候補者を個人カードで確認。
          </p>
        </article>
      </div>
    </section>
  );
}
