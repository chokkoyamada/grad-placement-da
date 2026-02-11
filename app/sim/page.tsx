import { kpiLabels } from "@/lib/mock-data";
import { RecalcModal } from "@/app/sim/_components/recalc-modal";
import { defaultSimulationConfig } from "@/lib/simulation/config";
import { normalizeSimulationConfig } from "@/lib/simulation/normalize";
import { runSimulation } from "@/lib/simulation/run-simulation";
import type { SimulationConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

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

function formatMetricValue(value: number, unit: string): string {
  if (unit === "%") {
    return `${(value * 100).toFixed(1)}${unit}`;
  }
  if (unit === "位") {
    return `${value.toFixed(2)}${unit}`;
  }
  return `${Math.round(value)}${unit}`;
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

  const departmentRows = input.departments.map((department) => {
    const baselineBuckets = buildEmptyBucketCounts();
    const daBuckets = buildEmptyBucketCounts();

    for (const candidate of input.candidates) {
      const baselineAssignedDepartment = baseline.assignments[candidate.id];
      const daAssignedDepartment = da.assignments[candidate.id];

      if (baselineAssignedDepartment === department.id) {
        const rank = candidate.preferences.findIndex((deptId) => deptId === department.id) + 1 || null;
        baselineBuckets[rankToBucket(rank)] += 1;
      }

      if (daAssignedDepartment === department.id) {
        const rank = candidate.preferences.findIndex((deptId) => deptId === department.id) + 1 || null;
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
  const daWinsCount = [top1Diff > 0, top3Diff > 0, avgRankDiff < 0, blockingDiff < 0].filter(Boolean).length;

  const scenarioInterpretation =
    top1Diff >= 0 && top3Diff >= 0
      ? "この条件では、DAは満足度と安定性の両方で優位です。"
      : top1Diff < 0 && blockingDiff < 0
        ? "この条件では、DAは安定性を改善する一方で、希望充足は下がっています。"
        : "この条件では、指標ごとにトレードオフがあります。";

  const presetItems = Object.entries(SIM_PRESETS).map(([key, preset]) => ({
    key,
    label: preset.label,
    description: preset.description,
    config: normalizeSimulationConfig({
      ...defaultSimulationConfig,
      ...preset.config,
    }),
  }));

  return (
    <section className="space-y-4">
      <section className="surface-card rounded-3xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500">現在のシナリオ</p>
            <h1 className="text-lg font-bold text-slate-900">
              {SIM_PRESETS[presetKey]?.label ?? "標準シナリオ"}
            </h1>
            <p className="text-xs text-slate-600">
              {SIM_PRESETS[presetKey]?.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">N {input.config.candidateCount}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">M {input.config.departmentCount}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                制約率 {(input.config.constraintRate * 100).toFixed(0)}%
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">seed {input.config.seed}</span>
            </div>
          </div>
          <RecalcModal presetKey={presetKey} config={input.config} presets={presetItems} />
        </div>
      </section>

      <div className="space-y-4">
        <section className="surface-card rounded-3xl brand-gradient-soft p-4">
          <h2 className="text-sm font-semibold text-blue-900">DA（Deferred Acceptance）とは？</h2>
          <p className="mt-1 text-xs leading-6 text-blue-900/90">
            新卒が希望順に部署へ申し込み、部署は定員内で優先度の高い人を一時的に保持し、
            あふれた人は次の希望へ進む方式です。
          </p>
          <p className="mt-2 text-xs leading-6 text-blue-900/90">
            このページは <span className="font-semibold">左=Baseline / 右=DA</span> で固定表示し、
            同条件の差分を直接見比べます。
          </p>
        </section>

        <section className="rounded-3xl border border-blue-800 bg-blue-900 p-4 text-white shadow-lg shadow-blue-200/50">
          <p className="text-xs font-semibold tracking-wide text-blue-100">1分で分かる要点</p>
          <p className="mt-1 text-xs font-semibold text-blue-200">DA優位: 4指標中 {daWinsCount} 指標</p>
          <p className="mt-1 text-lg font-bold">
            DA は第1希望率を {top1Diff >= 0 ? "+" : ""}
            {top1Diff.toFixed(1)}pt 変化、ブロッキングペアを {blockingDiff} 件変化
          </p>
          <p className="mt-1 text-xs text-blue-100">{scenarioInterpretation}</p>
        </section>

        <section className="surface-card rounded-3xl p-4">
          <h2 className="text-sm font-semibold text-slate-800">左右固定 比較ビュー（左: Baseline / 右: DA）</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-white">Baseline</p>
              <div className="space-y-2">
                {kpiLabels.map((kpi) => (
                  <div key={`b-${kpi.key}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="text-slate-600">{kpi.label}</span>
                    <span className="font-semibold text-slate-900">{formatMetricValue(baseline.metrics[kpi.key], kpi.unit)}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 inline-flex rounded-full bg-blue-700 px-3 py-1 text-xs font-bold text-white">DA</p>
              <div className="space-y-2">
                {kpiLabels.map((kpi) => (
                  <div key={`d-${kpi.key}`} className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2 text-sm">
                    <span className="text-slate-600">{kpi.label}</span>
                    <span className="font-semibold text-slate-900">{formatMetricValue(da.metrics[kpi.key], kpi.unit)}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {kpiLabels.map((kpi) => {
              const b = baseline.metrics[kpi.key];
              const d = da.metrics[kpi.key];
              const better = isDaBetter(kpi.key, b, d);
              return (
                <div key={`delta-${kpi.key}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <span className="text-slate-600">{kpi.label} 差分: </span>
                  <span className={better ? "font-bold text-blue-700" : "font-bold text-slate-700"}>
                    {metricDeltaText(b, d, kpi.unit)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-card rounded-3xl p-4">
          <h2 className="text-sm font-semibold text-slate-800">満足度分布（左: Baseline / 右: DA）</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-bold text-slate-700">Baseline</p>
              <div className="space-y-2">
                {baseline.satisfactionHistogram.map((bin) => (
                  <div key={`hist-b-${bin.label}`}>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <span>{bin.label}</span>
                      <span>{bin.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-500" style={{ width: `${(bin.value / input.config.candidateCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-bold text-blue-700">DA</p>
              <div className="space-y-2">
                {da.satisfactionHistogram.map((bin) => (
                  <div key={`hist-d-${bin.label}`}>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <span>{bin.label}</span>
                      <span>{bin.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-700" style={{ width: `${(bin.value / input.config.candidateCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="surface-card rounded-3xl p-4">
          <h2 className="text-sm font-semibold text-slate-800">部署別 希望順位構成（左: Baseline / 右: DA）</h2>
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
              <article key={row.id} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{row.name}</p>
                  <p className="text-xs text-slate-500">定員 {row.capacity}</p>
                </div>
                <div className="grid gap-2 lg:grid-cols-2">
                  <div>
                    <p className="mb-1 text-[11px] font-semibold text-slate-600">Baseline（配属 {row.baselineTotal}）</p>
                    <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
                      {RANK_BUCKETS.map((bucket) => (
                        <div
                          key={`${row.id}-baseline-${bucket.key}`}
                          className={bucket.color}
                          style={{ width: `${(row.baselineBuckets[bucket.key] / Math.max(row.capacity, 1)) * 100}%` }}
                          title={`${bucket.label}: ${row.baselineBuckets[bucket.key]}人`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold text-blue-700">DA（配属 {row.daTotal}）</p>
                    <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
                      {RANK_BUCKETS.map((bucket) => (
                        <div
                          key={`${row.id}-da-${bucket.key}`}
                          className={bucket.color}
                          style={{ width: `${(row.daBuckets[bucket.key] / Math.max(row.capacity, 1)) * 100}%` }}
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

        <section className="surface-card rounded-3xl p-4">
          <h2 className="text-sm font-semibold text-slate-800">個別比較（左: Baseline / 右: DA）</h2>
          <div className="mt-3 space-y-3">
            {changedCandidates.length > 0 ? (
              changedCandidates.map((row) => (
                <article key={row.candidateId} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <p className="text-sm font-semibold text-slate-800">
                    {row.candidateName} <span className="text-xs text-slate-500">({row.candidateId})</span>
                  </p>
                  <div className="mt-2 grid gap-2 lg:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="text-xs font-bold text-slate-700">Baseline</p>
                      <p className="mt-1 text-xs text-slate-600">配属: {row.baselineAssignmentName}</p>
                      <p className="mt-1 text-xs text-slate-600">理由: {row.baselineReason}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-2">
                      <p className="text-xs font-bold text-blue-700">DA</p>
                      <p className="mt-1 text-xs text-slate-600">配属: {row.daAssignmentName}</p>
                      <p className="mt-1 text-xs text-slate-600">理由: {row.daReason}</p>
                    </div>
                  </div>
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
