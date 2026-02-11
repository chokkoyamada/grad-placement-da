import type { SimulationConfig } from "@/lib/types";
import { defaultSimulationConfig } from "@/lib/simulation/config";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toInt(value: number, min: number, max: number): number {
  return Math.round(clamp(value, min, max));
}

export function normalizeSimulationConfig(
  partial: Partial<SimulationConfig>,
): SimulationConfig {
  const merged = {
    ...defaultSimulationConfig,
    ...partial,
  };

  const candidateCount = toInt(merged.candidateCount, 50, 300);
  const departmentCount = toInt(merged.departmentCount, 5, 30);
  const minCapacity = toInt(merged.minCapacity, 1, 60);
  const maxCapacity = toInt(merged.maxCapacity, minCapacity, 80);
  const preferenceLength = toInt(merged.preferenceLength, 1, departmentCount);

  return {
    seed: toInt(merged.seed, 1, 99999999),
    candidateCount,
    departmentCount,
    minCapacity,
    maxCapacity,
    preferenceLength,
    popularitySkew: clamp(merged.popularitySkew, 0, 1),
    aptitudeWeight: clamp(merged.aptitudeWeight, 0, 1),
    constraintRate: clamp(merged.constraintRate, 0, 0.7),
  };
}
