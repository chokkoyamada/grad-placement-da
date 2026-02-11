import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="space-y-6">
      <header className="surface-card rounded-3xl p-6">
        <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">How To Read</p>
        <h1 className="mt-3 text-2xl font-black text-slate-900">指標と概念の対応</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          同じ seed の同一データに対して、Baseline と新卒提案型 DA を比較します。
          方式だけを変えたとき、何がどう変わるかを短時間で把握できます。
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="surface-card rounded-2xl p-5">
          <h2 className="text-base font-bold text-slate-800">第1希望率 / 上位3希望率</h2>
          <p className="mt-2 text-sm text-slate-600">希望に近い配属を得られた割合。高いほど納得感が高い傾向。</p>
        </article>
        <article className="surface-card rounded-2xl p-5">
          <h2 className="text-base font-bold text-slate-800">平均希望順位</h2>
          <p className="mt-2 text-sm text-slate-600">配属先が希望表の何番目だったかの平均。低いほど望ましい配属。</p>
        </article>
        <article className="surface-card rounded-2xl p-5">
          <h2 className="text-base font-bold text-slate-800">ブロッキングペア</h2>
          <p className="mt-2 text-sm text-slate-600">
            候補者・部署の双方が今より好む組合せ。少ないほど再調整圧力が小さい。
          </p>
        </article>
        <article className="surface-card rounded-2xl p-5">
          <h2 className="text-base font-bold text-slate-800">個人カード（配属理由）</h2>
          <p className="mt-2 text-sm text-slate-600">方式ごとに希望順位と配属理由を並べ、差の背景を追跡できます。</p>
        </article>
      </section>

      <section className="surface-card rounded-2xl p-5">
        <h2 className="text-base font-bold text-slate-800">方式の違い（MVP）</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Baseline: 部署ごとにスコア上位から埋める貪欲割当。</li>
          <li>DA: 候補者が希望順に提案し、部署が定員内で優先順位上位を保持。</li>
          <li>制約: 応募不可な組合せは候補から除外するハード制約。</li>
        </ul>
      </section>

      <p className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-800">
        本アプリは意思決定支援デモです。実運用では評価軸・制約定義・説明責任プロセスの設計が必要です。
      </p>

      <div>
        <Link
          href="/sim?preset=standard"
          className="inline-flex rounded-2xl border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
        >
          シミュレーターで確認する
        </Link>
      </div>
    </section>
  );
}
