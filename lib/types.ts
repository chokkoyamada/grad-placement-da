export type AlgorithmKey = "baseline" | "da";

export interface SimulationConfig {
  seed: number;
  candidateCount: number;
  departmentCount: number;
  minCapacity: number;
  maxCapacity: number;
  preferenceLength: number;
  popularitySkew: number;
  aptitudeWeight: number;
  constraintRate: number;
}

export interface CandidateProfile {
  id: string;
  name: string;
  preferences: string[];
  eligibleDepartments: string[];
}

export interface DepartmentProfile {
  id: string;
  name: string;
  capacity: number;
}

export interface AssignmentReason {
  candidateId: string;
  algorithm: AlgorithmKey;
  assignedDepartmentId: string | null;
  summary: string;
}

export interface PlacementMetrics {
  firstChoiceRate: number;
  top3Rate: number;
  averageRank: number;
  blockingPairs: number;
}

export interface HistogramBin {
  label: string;
  value: number;
}

export interface PlacementResult {
  algorithm: AlgorithmKey;
  assignments: Record<string, string | null>;
  reasons: AssignmentReason[];
  metrics: PlacementMetrics;
  satisfactionHistogram: HistogramBin[];
}

export interface SimulationInput {
  config: SimulationConfig;
  candidates: CandidateProfile[];
  departments: DepartmentProfile[];
  candidateAptitude: Record<string, Record<string, number>>;
  departmentPriority: Record<string, string[]>;
}

export interface SimulationOutput {
  input: SimulationInput;
  baseline: PlacementResult;
  da: PlacementResult;
}
