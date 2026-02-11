"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { SimulationConfig } from "@/lib/types";

interface PresetItem {
  key: string;
  label: string;
  description: string;
}

interface RecalcModalProps {
  presetKey: string;
  config: SimulationConfig;
  presets: PresetItem[];
}

export function RecalcModal({ presetKey, config, presets }: RecalcModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(presetKey);

  const presetMap = useMemo(
    () => Object.fromEntries(presets.map((preset) => [preset.key, preset])),
    [presets],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelectedPreset(presetKey);
          setOpen(true);
        }}
        className="rounded-2xl border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
      >
        条件を変えて再計算
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 px-4 py-6 backdrop-blur-sm">
              <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">再計算条件を選ぶ</h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    閉じる
                  </button>
                </div>

                <form action="/sim" method="get" className="space-y-4">
                  <input type="hidden" name="preset" value={selectedPreset} />

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600">シナリオ</p>
                    {presets.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setSelectedPreset(preset.key)}
                        className={`block w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                          selectedPreset === preset.key
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <p className="font-semibold">{preset.label}</p>
                        <p className={selectedPreset === preset.key ? "text-slate-200" : "text-slate-500"}>
                          {preset.description}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
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
                        defaultValue={config.candidateCount}
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
                        defaultValue={config.departmentCount}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="constraintRate" className="mb-1 block text-xs font-semibold text-slate-600">
                        制約率
                      </label>
                      <input
                        id="constraintRate"
                        name="constraintRate"
                        type="number"
                        min={0}
                        max={0.7}
                        step={0.01}
                        defaultValue={config.constraintRate}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-600">詳細設定（上級者向け）</summary>
                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <label htmlFor="seed" className="mb-1 block text-slate-600">
                          seed
                        </label>
                        <input
                          id="seed"
                          name="seed"
                          type="number"
                          min={1}
                          max={99999999}
                          defaultValue={config.seed}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1"
                        />
                      </div>
                      <div>
                        <label htmlFor="preferenceLength" className="mb-1 block text-slate-600">
                          希望提出数 K
                        </label>
                        <input
                          id="preferenceLength"
                          name="preferenceLength"
                          type="number"
                          min={1}
                          max={config.departmentCount}
                          defaultValue={config.preferenceLength}
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
                            defaultValue={config.minCapacity}
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
                            defaultValue={config.maxCapacity}
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
                          defaultValue={config.popularitySkew}
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
                          defaultValue={config.aptitudeWeight}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1"
                        />
                      </div>
                    </div>
                  </details>

                  <button
                    type="submit"
                    className="w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
                  >
                    この条件で再計算する
                  </button>
                </form>

                <p className="mt-3 text-xs text-slate-500">
                  現在選択中: {presetMap[selectedPreset]?.label ?? selectedPreset}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
