import type { CandidateProfile, DepartmentProfile, SimulationConfig, SimulationInput } from "@/lib/types";
import { createSeededRandom } from "@/lib/simulation/random";

const DEPARTMENT_NAME_POOL = [
  "営業",
  "AI開発",
  "財務",
  "人事",
  "オペレーション",
  "基盤開発",
  "社内コンサル",
  "R&D",
  "法務",
  "マーケティング",
  "セキュリティ",
  "経営企画",
  "データ分析",
  "品質保証",
  "カスタマーサクセス",
  "グローバル推進",
  "調達",
  "広報",
  "デザイン",
  "新規事業",
  "業務改革",
  "監査",
  "物流",
  "生産管理",
  "教育研修",
  "情報システム",
  "購買",
  "総務",
  "研究開発",
  "事業管理",
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function departmentName(index: number): string {
  return DEPARTMENT_NAME_POOL[index] ?? `部署${index + 1}`;
}

function buildDepartments(config: SimulationConfig): DepartmentProfile[] {
  const random = createSeededRandom(config.seed ^ 0xabc12345);

  return Array.from({ length: config.departmentCount }, (_, index) => ({
    id: `d-${String(index + 1).padStart(3, "0")}`,
    name: departmentName(index),
    capacity: random.int(config.minCapacity, config.maxCapacity),
  }));
}

function buildCandidates(config: SimulationConfig): CandidateProfile[] {
  return Array.from({ length: config.candidateCount }, (_, index) => ({
    id: `c-${String(index + 1).padStart(3, "0")}`,
    name: `候補者${String(index + 1).padStart(3, "0")}`,
    preferences: [],
    eligibleDepartments: [],
  }));
}

export function generateSimulationInput(config: SimulationConfig): SimulationInput {
  const random = createSeededRandom(config.seed);
  const departments = buildDepartments(config);
  const candidates = buildCandidates(config);

  const basePopularity = departments.map((_, index) => {
    const rank = index + 1;
    return 1 / Math.pow(rank, 1 + config.popularitySkew * 1.5);
  });

  const candidateAptitude: Record<string, Record<string, number>> = {};
  for (const candidate of candidates) {
    candidateAptitude[candidate.id] = {};
    const candidateStrength = random.next();

    for (const department of departments) {
      const departmentAffinity = random.next();
      const aptitude = clamp(candidateStrength * 0.5 + departmentAffinity * 0.5, 0, 1);
      candidateAptitude[candidate.id][department.id] = Number(aptitude.toFixed(6));
    }
  }

  for (const candidate of candidates) {
    const eligible = departments.filter(() => random.next() > config.constraintRate);
    if (eligible.length === 0) {
      const fallbackDept = departments[random.int(0, departments.length - 1)];
      candidate.eligibleDepartments = [fallbackDept.id];
    } else {
      candidate.eligibleDepartments = eligible.map((dept) => dept.id);
    }

    const preferenceCount = Math.max(
      1,
      Math.min(config.preferenceLength, candidate.eligibleDepartments.length),
    );

    const weights = departments.map((dept, index) => {
      if (!candidate.eligibleDepartments.includes(dept.id)) {
        return 0;
      }

      const popularity = basePopularity[index];
      const aptitude = candidateAptitude[candidate.id][dept.id];
      return clamp(popularity * 0.8 + aptitude * 0.6, 0, 10);
    });

    const remaining = [...departments];
    const chosen: string[] = [];
    for (let i = 0; i < preferenceCount; i += 1) {
      const remainingWeights = remaining.map((dept) => {
        const index = departments.findIndex((origin) => origin.id === dept.id);
        return weights[index];
      });
      const pickIndex = random.weightedIndex(remainingWeights);
      const [picked] = remaining.splice(pickIndex, 1);
      if (picked) {
        chosen.push(picked.id);
      }
    }

    candidate.preferences = chosen;
  }

  const departmentPriority: Record<string, string[]> = {};
  for (const department of departments) {
    const ranked = [...candidates]
      .map((candidate) => {
        const aptitude = candidateAptitude[candidate.id][department.id];
        const noise = random.next() * 0.15;
        const score = aptitude * 0.85 + noise;
        return { candidateId: candidate.id, score };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.candidateId.localeCompare(b.candidateId);
      })
      .map((entry) => entry.candidateId);

    departmentPriority[department.id] = ranked;
  }

  return {
    config,
    candidates,
    departments,
    candidateAptitude,
    departmentPriority,
  };
}
