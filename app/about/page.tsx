import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">指標と概念の対応</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          このアプリは、同じ seed で生成した同一データに対して Baseline と新卒提案型 DA を比較します。
          方式だけを変えたときに、結果がどう変わるかを体験できる構成です。
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-800">第1希望率 / 上位3希望率</h2>
          <p className="mt-2 text-sm text-slate-600">
            候補者が希望に近い配属を得られた割合です。値が高いほど納得感が高い傾向を示します。
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-800">平均希望順位</h2>
          <p className="mt-2 text-sm text-slate-600">
            配属先が希望表の何番目だったかの平均です。値が低いほど、希望に近い配属が多いことを示します。
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-800">ブロッキングペア</h2>
          <p className="mt-2 text-sm text-slate-600">
            「候補者が今より好み、かつ部署側も現配属より優先したい」組の数です。少ないほど再調整圧力が小さい配属です。
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-800">個人カード（配属理由）</h2>
          <p className="mt-2 text-sm text-slate-600">
            各候補者について、方式ごとにどの希望順位で配属されたかを短文で表示し、差の理由を追跡できます。
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-800">方式の違い（MVP）</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Baseline: 部署ごとにスコア上位から埋める貪欲割当。</li>
          <li>DA: 候補者が希望順に提案し、部署が定員内で優先順位上位を保持。</li>
          <li>制約: 応募不可な組合せは候補から除外するハード制約を採用。</li>
        </ul>
      </section>

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        本アプリは意思決定支援のデモであり、実運用では評価軸や制約の設計、説明責任のプロセスを別途定義する必要があります。
      </p>

      <div>
        <Link
          href="/sim?run=sample"
          className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          シミュレーターで確認する
        </Link>
      </div>
    </section>
  );
}
