import Link from "next/link";
import { kpiLabels } from "@/lib/mock-data";
import { defaultSimulationConfig } from "@/lib/simulation/config";
import { normalizeSimulationConfig } from "@/lib/simulation/normalize";
import { runSimulation } from "@/lib/simulation/run-simulation";
import type { PlacementResult, SimulationConfig } from "@/lib/types";

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

function parseConfigFromParams(
  params: Record<string, string | string[] | undefined>,
): SimulationConfig {
  return normalizeSimulationConfig({
    seed: parseNumber(params.seed),
    candidateCount: parseNumber(params.candidateCount),
    departmentCount: parseNumber(params.departmentCount),
    minCapacity: parseNumber(params.minCapacity),
    maxCapacity: parseNumber(params.maxCapacity),
    preferenceLength: parseNumber(params.preferenceLength),
    popularitySkew: parseNumber(params.popularitySkew),
    aptitudeWeight: parseNumber(params.aptitudeWeight),
    constraintRate: parseNumber(params.constraintRate),
  });
}

interface SimulatorPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SimulatorPage({ searchParams }: SimulatorPageProps) {
  const params = (await searchParams) ?? {};
  const isSampleRun = params.run === "sample";
  const config = parseConfigFromParams(params);
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

  const assignmentCountByDepartment = (result: PlacementResult): Record<string, number> => {
    const counts: Record<string, number> = Object.fromEntries(
      input.departments.map((department) => [department.id, 0]),
    );

    for (const departmentId of Object.values(result.assignments)) {
      if (departmentId) {
        counts[departmentId] += 1;
      }
    }

    return counts;
  };

  const baselineCounts = assignmentCountByDepartment(baseline);
  const daCounts = assignmentCountByDepartment(da);

  const departmentRows = input.departments.map((department) => {
    const baselineCount = baselineCounts[department.id] ?? 0;
    const daCount = daCounts[department.id] ?? 0;
    return {
      id: department.id,
      name: department.name,
      capacity: department.capacity,
      baseline: baselineCount,
      da: daCount,
      diff: daCount - baselineCount,
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

  return (
    <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-lg font-bold text-slate-900">シミュレーター</h1>
        <p className="text-sm text-slate-600">設定を変えて同条件比較を再実行できます。</p>

        {isSampleRun ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            サンプル条件で実行中です（seed: {input.config.seed}）。
          </div>
        ) : null}

        <form action="/sim" method="get" className="space-y-3">
          <input type="hidden" name="run" value="sample" />

          <div>
            <label htmlFor="seed" className="mb-1 block text-xs font-semibold text-slate-500">
              seed
            </label>
            <input
              id="seed"
              name="seed"
              type="number"
              min={1}
              max={99999999}
              defaultValue={input.config.seed}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label htmlFor="candidateCount" className="mb-1 block text-xs font-semibold text-slate-500">
              新卒人数 N (50-300)
            </label>
            <input
              id="candidateCount"
              name="candidateCount"
              type="number"
              min={50}
              max={300}
              defaultValue={input.config.candidateCount}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label htmlFor="departmentCount" className="mb-1 block text-xs font-semibold text-slate-500">
              部署数 M (5-30)
            </label>
            <input
              id="departmentCount"
              name="departmentCount"
              type="number"
              min={5}
              max={30}
              defaultValue={input.config.departmentCount}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label htmlFor="preferenceLength" className="mb-1 block text-xs font-semibold text-slate-500">
              希望提出数 K
            </label>
            <input
              id="preferenceLength"
              name="preferenceLength"
              type="number"
              min={1}
              max={input.config.departmentCount}
              defaultValue={input.config.preferenceLength}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="minCapacity" className="mb-1 block text-xs font-semibold text-slate-500">
                最小定員
              </label>
              <input
                id="minCapacity"
                name="minCapacity"
                type="number"
                min={1}
                max={60}
                defaultValue={input.config.minCapacity}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
            </div>
            <div>
              <label htmlFor="maxCapacity" className="mb-1 block text-xs font-semibold text-slate-500">
                最大定員
              </label>
              <input
                id="maxCapacity"
                name="maxCapacity"
                type="number"
                min={1}
                max={80}
                defaultValue={input.config.maxCapacity}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
            </div>
          </div>

          <div>
            <label htmlFor="popularitySkew" className="mb-1 block text-xs font-semibold text-slate-500">
              人気偏り (0-1)
            </label>
            <input
              id="popularitySkew"
              name="popularitySkew"
              type="number"
              min={0}
              max={1}
              step={0.05}
              defaultValue={input.config.popularitySkew}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label htmlFor="aptitudeWeight" className="mb-1 block text-xs font-semibold text-slate-500">
              適性重み (0-1)
            </label>
            <input
              id="aptitudeWeight"
              name="aptitudeWeight"
              type="number"
              min={0}
              max={1}
              step={0.05}
              defaultValue={input.config.aptitudeWeight}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label htmlFor="constraintRate" className="mb-1 block text-xs font-semibold text-slate-500">
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            この条件で再計算
          </button>
        </form>

        <Link
          href={`/sim?run=sample&seed=${defaultSimulationConfig.seed}`}
          className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          初期サンプルに戻す
        </Link>
      </aside>

      <div className="space-y-4">
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
          <h2 className="text-sm font-semibold text-slate-800">配属構成テーブル（部署別）</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-2 py-2">部署</th>
                  <th className="px-2 py-2">定員</th>
                  <th className="px-2 py-2">Baseline</th>
                  <th className="px-2 py-2">DA</th>
                  <th className="px-2 py-2">差分(DA-Base)</th>
                </tr>
              </thead>
              <tbody>
                {departmentRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-800">{row.name}</td>
                    <td className="px-2 py-2">{row.capacity}</td>
                    <td className="px-2 py-2">{row.baseline}</td>
                    <td className="px-2 py-2">{row.da}</td>
                    <td
                      className={`px-2 py-2 font-semibold ${
                        row.diff === 0
                          ? "text-slate-500"
                          : row.diff > 0
                            ? "text-emerald-700"
                            : "text-amber-700"
                      }`}
                    >
                      {row.diff > 0 ? "+" : ""}
                      {row.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
