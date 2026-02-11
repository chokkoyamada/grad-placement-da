import { describe, expect, test } from "vitest";
import { defaultSimulationConfig } from "@/lib/simulation/config";
import { generateSimulationInput } from "@/lib/simulation/generator";

describe("generateSimulationInput", () => {
  test("同じ seed なら同じデータを生成する", () => {
    const a = generateSimulationInput(defaultSimulationConfig);
    const b = generateSimulationInput(defaultSimulationConfig);
    expect(a).toEqual(b);
  });

  test("seed が違うと結果が変わる", () => {
    const a = generateSimulationInput({ ...defaultSimulationConfig, seed: 1 });
    const b = generateSimulationInput({ ...defaultSimulationConfig, seed: 2 });
    expect(a).not.toEqual(b);
  });

  test("制約率が高くても各候補者に少なくとも1つ応募可能先がある", () => {
    const input = generateSimulationInput({
      ...defaultSimulationConfig,
      candidateCount: 10,
      departmentCount: 4,
      preferenceLength: 3,
      constraintRate: 0.99,
    });

    expect(input.candidates.every((candidate) => candidate.eligibleDepartments.length >= 1)).toBe(true);
    expect(input.candidates.every((candidate) => candidate.preferences.length >= 1)).toBe(true);
  });
});
