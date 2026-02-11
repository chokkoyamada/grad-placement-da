import { describe, expect, test } from "vitest";
import type { SimulationInput } from "@/lib/types";
import { runBaseline, runDeferredAcceptance } from "@/lib/simulation/algorithms";
import { countBlockingPairs } from "@/lib/simulation/metrics";

const fixtureInput: SimulationInput = {
  config: {
    seed: 42,
    candidateCount: 2,
    departmentCount: 2,
    minCapacity: 1,
    maxCapacity: 1,
    preferenceLength: 2,
    popularitySkew: 0,
    aptitudeWeight: 1,
    constraintRate: 0,
  },
  candidates: [
    {
      id: "c-001",
      name: "候補者001",
      preferences: ["d-001", "d-002"],
      eligibleDepartments: ["d-001", "d-002"],
    },
    {
      id: "c-002",
      name: "候補者002",
      preferences: ["d-001", "d-002"],
      eligibleDepartments: ["d-001", "d-002"],
    },
  ],
  departments: [
    { id: "d-001", name: "第一部署", capacity: 1 },
    { id: "d-002", name: "第二部署", capacity: 1 },
  ],
  candidateAptitude: {
    "c-001": { "d-001": 0.9, "d-002": 0.2 },
    "c-002": { "d-001": 0.8, "d-002": 0.1 },
  },
  departmentPriority: {
    "d-001": ["c-002", "c-001"],
    "d-002": ["c-001", "c-002"],
  },
};

describe("placement algorithms", () => {
  test("baseline は部署順の貪欲割当になる", () => {
    const baseline = runBaseline(fixtureInput);
    expect(baseline.assignments).toEqual({
      "c-001": "d-001",
      "c-002": "d-002",
    });
  });

  test("DA は部署優先に沿って安定割当を返す", () => {
    const da = runDeferredAcceptance(fixtureInput);
    expect(da.assignments).toEqual({
      "c-001": "d-002",
      "c-002": "d-001",
    });
  });

  test("fixture では baseline に blocking pair があり DA では 0", () => {
    const baseline = runBaseline(fixtureInput);
    const da = runDeferredAcceptance(fixtureInput);

    expect(countBlockingPairs(fixtureInput, baseline.assignments)).toBe(1);
    expect(countBlockingPairs(fixtureInput, da.assignments)).toBe(0);
  });
});
