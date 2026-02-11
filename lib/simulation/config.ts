import type { SimulationConfig } from "@/lib/types";

export const defaultSimulationConfig: SimulationConfig = {
  seed: 20260211,
  candidateCount: 120,
  departmentCount: 8,
  minCapacity: 10,
  maxCapacity: 18,
  preferenceLength: 5,
  popularitySkew: 0.65,
  aptitudeWeight: 0.6,
  constraintRate: 0.12,
};
