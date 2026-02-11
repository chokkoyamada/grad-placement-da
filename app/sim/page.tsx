import Link from "next/link";
import { kpiLabels } from "@/lib/mock-data";
import { defaultSimulationConfig } from "@/lib/simulation/config";
import { normalizeSimulationConfig } from "@/lib/simulation/normalize";
import { runSimulation } from "@/lib/simulation/run-simulation";
import type { SimulationConfig } from "@/lib/types";

type RankBucketKey = "rank1" | "rank2" | "rank3" | "rank4" | "rank5plus";

const RANK_BUCKETS: Array<{ key: RankBucketKey; label: string; color: string }> = [
  { key: "rank1", label: "第1希望", color: "bg-blue-900" },
  { key: "rank2", label: "第2希望", color: "bg-blue-700" },
  { key: "rank3", label: "第3希望", color: "bg-blue-500" },
  { key: "rank4", label: "第4希望", color: "bg-blue-300" },
  { key: "rank5plus", label: "第5希望以下", color: "bg-blue-100" },
];

const SIM_PRESETS: Record<
  string,
  { label: string; description: string; config: Partial<SimulationConfig> }
> = {
  standard: {
    label: "標準シナリオ",
    description: "まずはこれ。差が最も分かりやすい設定。",
    config: {
      seed: 20260211,
      candidateCount: 120,
      departmentCount: 8,
      preferenceLength: 5,
      minCapacity: 10,
      maxCapacity: 18,
      popularitySkew: 0.65,
      aptitudeWeight: 0.6,
      constraintRate: 0.12,
    },
  },
  crowded: {
    label: "競争激化",
    description: "人気集中を強め、競争が激しい状態を再現。",
    config: {
      seed: 20260211,
      candidateCount: 150,
      departmentCount: 8,
      preferenceLength: 5,
      minCapacity: 10,
      maxCapacity: 18,
      popularitySkew: 0.85,
      aptitudeWeight: 0.65,
      constraintRate: 0.1,
    },
  },
  constrained: {
    label: "制約多め",
    description: "応募制約+定員ひっ迫で、差が見えやすいストレス条件。",
    config: {
      seed: 20260211,
      candidateCount: 120,
      departmentCount: 8,
      preferenceLength: 5,
      minCapacity: 10,
      maxCapacity: 18,
      popularitySkew: 0.65,
      aptitudeWeight: 0.6,
      constraintRate: 0.25,
    },
  },
};

function formatMetricValue(value: number, unit: string): string {
  if (unit === "%") {
    return `${(value * 100).toFixed(1)}${unit}`;
  }

  if (unit === "位") {
    return `${value.toFixed(2)}${unit}`;
  }

  return `${value}${unit}`;
}

function metricDeltaText(baselineValue: number, daValue: number, unit: string): string {
  const diff = daValue - baselineValue;
  if (unit === "%") {
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${(diff * 100).toFixed(1)}pt`;
  }

  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(2)}${unit}`;
}

function isDaBetter(metricKey: string, baselineValue: number, daValue: number): boolean {
  if (metricKey === "averageRank" || metricKey === "blockingPairs") {
    return daValue < baselineValue;
  }

  return daValue > baselineValue;
}

function parseNumber(raw: string | string[] | undefined): number | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildEmptyBucketCounts(): Record<RankBucketKey, number> {
  return { rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5plus: 0 };
}

function rankToBucket(rank: number | null): RankBucketKey {
  if (rank === 1) return "rank1";
  if (rank === 2) return "rank2";
  if (rank === 3) return "rank3";
  if (rank === 4) return "rank4";
  return "rank5plus";
}

function parseConfigFromParams(
  params: Record<string, string | string[] | undefined>,
): { config: SimulationConfig; presetKey: string } {
  const preset = Array.isArray(params.preset) ? params.preset[0] : params.preset;
  const presetKey = preset && SIM_PRESETS[preset] ? preset : "standard";

  const seed = parseNumber(params.seed);
  const candidateCount = parseNumber(params.candidateCount);
  const departmentCount = parseNumber(params.departmentCount);
  const minCapacity = parseNumber(params.minCapacity);
  const maxCapacity = parseNumber(params.maxCapacity);
  const preferenceLength = parseNumber(params.preferenceLength);
  const popularitySkew = parseNumber(params.popularitySkew);
  const aptitudeWeight = parseNumber(params.aptitudeWeight);
  const constraintRate = parseNumber(params.constraintRate);

  const config = normalizeSimulationConfig({
    ...defaultSimulationConfig,
    ...SIM_PRESETS[presetKey].config,
    ...(seed !== undefined ? { seed } : {}),
    ...(candidateCount !== undefined ? { candidateCount } : {}),
    ...(departmentCount !== undefined ? { departmentCount } : {}),
    ...(minCapacity !== undefined ? { minCapacity } : {}),
    ...(maxCapacity !== undefined ? { maxCapacity } : {}),
    ...(preferenceLength !== undefined ? { preferenceLength } : {}),
    ...(popularitySkew !== undefined ? { popularitySkew } : {}),
    ...(aptitudeWeight !== undefined ? { aptitudeWeight } : {}),
    ...(constraintRate !== undefined ? { constraintRate } : {}),
  });

  return { config, presetKey };
}

interface SimulatorPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SimulatorPage({ searchParams }: SimulatorPageProps) {
  const params = (await searchParams) ?? {};
  const { config, presetKey } = parseConfigFromParams(params);
  const { input, baseline, da } = runSimulation(config);

  const departmentNameMap = new Map(input.departments.map((department) => [department.id, department.name]));
  const baselineMap = new Map(baseline.reasons.map((item) => [item.candidateId, item]));
  const daMap = new Map(da.reasons.map((item) => [item.candidateId, item]));

  const histogramPairs = baseline.satisfactionHistogram.map((bin) => {
    const daBin = da.satisfactionHistogram.find((entry) => entry.label === bin.label);
    return {
      label: bin.label,
      baseline: bin.value,
      da: daBin?.value ?? 0,
    };
  });

  const departmentRows = input.departments.map((department) => {
    const baselineBuckets = buildEmptyBucketCounts();
    const daBuckets = buildEmptyBucketCounts();

    for (const candidate of input.candidates) {
      const baselineAssignedDepartment = baseline.assignments[candidate.id];
      const daAssignedDepartment = da.assignments[candidate.id];

      if (baselineAssignedDepartment === department.id) {
        const rank =
          candidate.preferences.findIndex((deptId) => deptId === department.id) + 1 || null;
        baselineBuckets[rankToBucket(rank)] += 1;
      }

      if (daAssignedDepartment === department.id) {
        const rank =
          candidate.preferences.findIndex((deptId) => deptId === department.id) + 1 || null;
        daBuckets[rankToBucket(rank)] += 1;
      }
    }

    const baselineTotal = Object.values(baselineBuckets).reduce((sum, value) => sum + value, 0);
    const daTotal = Object.values(daBuckets).reduce((sum, value) => sum + value, 0);

    return {
      id: department.id,
      name: department.name,
      capacity: department.capacity,
      baselineBuckets,
      daBuckets,
      baselineTotal,
      daTotal,
    };
  });

  const changedCandidates = input.candidates
    .map((candidate) => {
      const baselineAssignment = baseline.assignments[candidate.id];
      const daAssignment = da.assignments[candidate.id];
      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        changed: baselineAssignment !== daAssignment,
        baselineAssignmentName: baselineAssignment
          ? (departmentNameMap.get(baselineAssignment) ?? baselineAssignment)
          : "未配属",
        daAssignmentName: daAssignment ? (departmentNameMap.get(daAssignment) ?? daAssignment) : "未配属",
        baselineReason: baselineMap.get(candidate.id)?.summary ?? "理由データなし",
        daReason: daMap.get(candidate.id)?.summary ?? "理由データなし",
      };
    })
    .filter((row) => row.changed)
    .slice(0, 8);

  const top1Diff = (da.metrics.firstChoiceRate - baseline.metrics.firstChoiceRate) * 100;
  const blockingDiff = da.metrics.blockingPairs - baseline.metrics.blockingPairs;
  const top3Diff = (da.metrics.top3Rate - baseline.metrics.top3Rate) * 100;
  const avgRankDiff = da.metrics.averageRank - baseline.metrics.averageRank;
  const daWinsCount = [
    top1Diff > 0,
    top3Diff > 0,
    avgRankDiff < 0,
    blockingDiff < 0,
  ].filter(Boolean).length;

  const scenarioInterpretation =
    top1Diff >= 0 && top3Diff >= 0
      ? "この条件では、DAは満足度と安定性の両方で優位です。"
      : top1Diff < 0 && blockingDiff < 0
        ? "この条件では、DAは安定性を改善する一方で、希望充足は下がっています。"
        : "この条件では、指標ごとにトレードオフがあります。";

  return (
    <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-lg font-bold text-slate-900">配属改善シミュレーター</h1>
        <ol className="list-decimal space-y-1 pl-5 text-xs text-slate-600">
          <li>シナリオを1つ選ぶ</li>
          <li>右側で Baseline と DA を比較</li>
          <li>差が出た理由を個人カードで確認</li>
        </ol>

        <div className="space-y-2">
          {Object.entries(SIM_PRESETS).map(([key, preset]) => (
            <Link
              key={key}
              href={`/sim?preset=${key}`}
              className={`block rounded-xl border px-3 py-2 text-xs transition ${
                key === presetKey
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <p className="font-semibold">{preset.label}</p>
              <p className={key === presetKey ? "text-slate-200" : "text-slate-500"}>{preset.description}</p>
            </Link>
          ))}
        </div>

        <form action="/sim" method="get" className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <input type="hidden" name="preset" value={presetKey} />

          <div>
            <label htmlFor="candidateCount" className="mb-1 block text-xs font-semibold text-slate-600">
              人数 N
            </label>
            <input
              id="candidateCount"
              name="candidateCount"
              type="number"
              min={50}
              max={300}
              defaultValue={input.config.candidateCount}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="departmentCount" className="mb-1 block text-xs font-semibold text-slate-600">
              部署数 M
            </label>
            <input
              id="departmentCount"
              name="departmentCount"
              type="number"
              min={5}
              max={30}
              defaultValue={input.config.departmentCount}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="constraintRate" className="mb-1 block text-xs font-semibold text-slate-600">
              制約率 (0-0.7)
            </label>
            <input
              id="constraintRate"
              name="constraintRate"
              type="number"
              min={0}
              max={0.7}
              step={0.01}
              defaultValue={input.config.constraintRate}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            再計算する
          </button>

          <details className="rounded-lg border border-slate-200 bg-white p-2">
            <summary className="cursor-pointer text-xs font-semibold text-slate-600">詳細設定（上級者向け）</summary>
            <div className="mt-2 space-y-2 text-xs">
              <input type="hidden" name="seed" value={input.config.seed} />
              <div>
                <label htmlFor="preferenceLength" className="mb-1 block text-slate-600">
                  希望提出数 K
                </label>
                <input
                  id="preferenceLength"
                  name="preferenceLength"
                  type="number"
                  min={1}
                  max={input.config.departmentCount}
                  defaultValue={input.config.preferenceLength}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="minCapacity" className="mb-1 block text-slate-600">
                    最小定員
                  </label>
                  <input
                    id="minCapacity"
                    name="minCapacity"
                    type="number"
                    min={1}
                    max={60}
                    defaultValue={input.config.minCapacity}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1"
                  />
                </div>
                <div>
                  <label htmlFor="maxCapacity" className="mb-1 block text-slate-600">
                    最大定員
                  </label>
                  <input
                    id="maxCapacity"
                    name="maxCapacity"
                    type="number"
                    min={1}
                    max={80}
                    defaultValue={input.config.maxCapacity}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="popularitySkew" className="mb-1 block text-slate-600">
                  人気偏り
                </label>
                <input
                  id="popularitySkew"
                  name="popularitySkew"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  defaultValue={input.config.popularitySkew}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1"
                />
              </div>
              <div>
                <label htmlFor="aptitudeWeight" className="mb-1 block text-slate-600">
                  適性重み
                </label>
                <input
                  id="aptitudeWeight"
                  name="aptitudeWeight"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  defaultValue={input.config.aptitudeWeight}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1"
                />
              </div>
            </div>
          </details>
        </form>
      </aside>

      <div className="space-y-4">
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-sm font-semibold text-blue-900">DA（Deferred Acceptance）とは？</h2>
          <p className="mt-1 text-xs leading-6 text-blue-900/90">
            新卒が希望順に部署へ申し込み、部署は定員内で優先度の高い人を一時的に保持します。
            あふれた人は次の希望へ進み、申し込みが尽きるまで繰り返します。
          </p>
          <p className="mt-2 text-xs leading-6 text-blue-900/90">
            このページでは、<span className="font-semibold">Baseline（部署側の貪欲割当）</span> と
            <span className="font-semibold"> DA</span> を同条件で比較し、希望充足と安定性の差を見ます。
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 p-4 text-white">
          <p className="text-xs font-semibold tracking-wide text-slate-200">1分で分かる要点</p>
          <p className="mt-1 text-xs font-semibold text-emerald-300">
            DA優位: 4指標中 {daWinsCount} 指標
          </p>
          <p className="mt-1 text-lg font-bold">
            DA は第1希望率を {top1Diff >= 0 ? "+" : ""}
            {top1Diff.toFixed(1)}pt 変化、ブロッキングペアを {blockingDiff} 件変化
          </p>
          <p className="mt-1 text-xs text-slate-200">{scenarioInterpretation}</p>
          <p className="mt-1 text-xs text-slate-300">
            同じデータで方式だけ変えた比較です。まず KPI、次に個人カードを見ると差の理由を追えます。
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">KPI比較（Baseline vs DA）</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {kpiLabels.map((kpi) => {
              const baselineValue = baseline.metrics[kpi.key];
              const daValue = da.metrics[kpi.key];
              const daWins = isDaBetter(kpi.key, baselineValue, daValue);

              return (
                <article key={kpi.key} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Baseline</p>
                      <p className="text-base font-semibold text-slate-900">
                        {formatMetricValue(baselineValue, kpi.unit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">DA</p>
                      <p className="text-base font-semibold text-slate-900">
                        {formatMetricValue(daValue, kpi.unit)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`mt-2 text-xs font-semibold ${
                      daWins ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    DA差分: {metricDeltaText(baselineValue, daValue, kpi.unit)}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">満足度分布ヒストグラム（並列比較）</h2>
          <div className="mt-4 space-y-3">
            {histogramPairs.map((pair) => (
              <div key={pair.label}>
                <p className="mb-1 text-xs font-semibold text-slate-600">{pair.label}</p>
                <div className="grid grid-cols-[70px_1fr_70px_1fr] items-center gap-2 text-xs text-slate-600">
                  <span className="text-right">Base {pair.baseline}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-400"
                      style={{ width: `${(pair.baseline / input.config.candidateCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-right">DA {pair.da}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-800"
                      style={{ width: `${(pair.da / input.config.candidateCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">
            配属テーブル可視化（第1〜第4希望・第5希望以下）
          </h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {RANK_BUCKETS.map((bucket) => (
              <div key={bucket.key} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${bucket.color}`} />
                <span className="text-slate-600">{bucket.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-4">
            {departmentRows.map((row) => (
              <article key={row.id} className="rounded-xl border border-slate-100 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{row.name}</p>
                  <p className="text-xs text-slate-500">定員 {row.capacity}</p>
                </div>
                <div className="grid gap-2 lg:grid-cols-2">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold text-slate-500">
                      Baseline（配属 {row.baselineTotal}）
                    </p>
                    <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
                      {RANK_BUCKETS.map((bucket) => (
                        <div
                          key={`${row.id}-baseline-${bucket.key}`}
                          className={bucket.color}
                          style={{
                            width: `${(row.baselineBuckets[bucket.key] / Math.max(row.capacity, 1)) * 100}%`,
                          }}
                          title={`${bucket.label}: ${row.baselineBuckets[bucket.key]}人`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold text-slate-500">
                      DA（配属 {row.daTotal}）
                    </p>
                    <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
                      {RANK_BUCKETS.map((bucket) => (
                        <div
                          key={`${row.id}-da-${bucket.key}`}
                          className={bucket.color}
                          style={{
                            width: `${(row.daBuckets[bucket.key] / Math.max(row.capacity, 1)) * 100}%`,
                          }}
                          title={`${bucket.label}: ${row.daBuckets[bucket.key]}人`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">個人カード（方式で配属が変わった例）</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {changedCandidates.length > 0 ? (
              changedCandidates.map((row) => (
                <article key={row.candidateId} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {row.candidateName} <span className="text-xs text-slate-500">({row.candidateId})</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-600">Baseline配属: {row.baselineAssignmentName}</p>
                  <p className="mt-1 text-xs text-slate-600">DA配属: {row.daAssignmentName}</p>
                  <p className="mt-2 text-xs text-slate-600">Baseline理由: {row.baselineReason}</p>
                  <p className="mt-1 text-xs text-slate-600">DA理由: {row.daReason}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-600">配属先が変わる候補者は見つかりませんでした。</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
