import Link from "next/link";

export default function Home() {
  return (
    <section className="grid gap-8 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wide text-slate-700">
          新卒配属 × マッチング理論
        </p>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
          現状配属と DA を同条件で比較し、
          <br className="hidden md:block" />
          納得感と安定性の差を30秒で体感する
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          seed 固定の同一サンプルを使って、満足度・希望順位・ブロッキングペアを方式間で比較します。
          まずは 1 クリックでシミュレーターを起動してください。
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/sim?run=sample"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            サンプルで試す
          </Link>
          <Link
            href="/about"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            指標の見方
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">納得感の可視化</h2>
          <p className="mt-2 text-sm text-slate-600">第1希望率、上位希望率、平均希望順位を方式ごとに比較。</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">揉めにくさ</h2>
          <p className="mt-2 text-sm text-slate-600">ブロッキングペア数で、配属の安定性を評価。</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">正直申告の得</h2>
          <p className="mt-2 text-sm text-slate-600">方式ごとのインセンティブ差を体験ベースで確認。</p>
        </article>
      </div>
    </section>
  );
}
