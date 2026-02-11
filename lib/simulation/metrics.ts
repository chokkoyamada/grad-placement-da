import type { HistogramBin, PlacementMetrics, SimulationInput } from "@/lib/types";

export interface PlacementEvaluation {
  metrics: PlacementMetrics;
  histogram: HistogramBin[];
}

function rankOfAssignment(candidatePreferences: string[], assignedDepartmentId: string | null): number | null {
  if (!assignedDepartmentId) {
    return null;
  }

  const index = candidatePreferences.findIndex((departmentId) => departmentId === assignedDepartmentId);
  if (index < 0) {
    return null;
  }

  return index + 1;
}

export function countBlockingPairs(
  input: SimulationInput,
  assignments: Record<string, string | null>,
): number {
  const currentByDepartment: Record<string, string[]> = Object.fromEntries(
    input.departments.map((department) => [department.id, []]),
  );
  for (const [candidateId, departmentId] of Object.entries(assignments)) {
    if (departmentId) {
      currentByDepartment[departmentId].push(candidateId);
    }
  }

  const priorityRankByDepartment: Record<string, Record<string, number>> = {};
  for (const department of input.departments) {
    const rankMap: Record<string, number> = {};
    const rankedCandidates = input.departmentPriority[department.id] ?? [];
    rankedCandidates.forEach((candidateId, index) => {
      rankMap[candidateId] = index;
    });
    priorityRankByDepartment[department.id] = rankMap;
  }

  let blockingPairs = 0;
  for (const candidate of input.candidates) {
    const currentAssignment = assignments[candidate.id];
    const currentRank = rankOfAssignment(candidate.preferences, currentAssignment);

    for (let preferenceIndex = 0; preferenceIndex < candidate.preferences.length; preferenceIndex += 1) {
      const preferredDepartmentId = candidate.preferences[preferenceIndex];
      if (!candidate.eligibleDepartments.includes(preferredDepartmentId)) {
        continue;
      }

      const preferredRank = preferenceIndex + 1;
      if (currentRank !== null && preferredRank >= currentRank) {
        continue;
      }

      const currentAssignedCandidates = currentByDepartment[preferredDepartmentId] ?? [];
      const capacity = input.departments.find((department) => department.id === preferredDepartmentId)?.capacity ?? 0;
      const rankMap = priorityRankByDepartment[preferredDepartmentId] ?? {};
      const candidateRank = rankMap[candidate.id] ?? Number.MAX_SAFE_INTEGER;

      if (currentAssignedCandidates.length < capacity) {
        blockingPairs += 1;
        continue;
      }

      const worstCurrentCandidateRank = currentAssignedCandidates.reduce((worst, currentCandidateId) => {
        const currentRankValue = rankMap[currentCandidateId] ?? Number.MAX_SAFE_INTEGER;
        return Math.max(worst, currentRankValue);
      }, -1);

      if (candidateRank < worstCurrentCandidateRank) {
        blockingPairs += 1;
      }
    }
  }

  return blockingPairs;
}

export function evaluatePlacement(
  input: SimulationInput,
  assignments: Record<string, string | null>,
): PlacementEvaluation {
  const ranks: Array<number | null> = input.candidates.map((candidate) =>
    rankOfAssignment(candidate.preferences, assignments[candidate.id]),
  );

  const assignedRanks = ranks.filter((rank): rank is number => rank !== null);
  const candidateCount = input.candidates.length;
  const firstChoiceCount = ranks.filter((rank) => rank === 1).length;
  const top3Count = ranks.filter((rank) => rank !== null && rank <= 3).length;
  const averageRank =
    assignedRanks.length === 0
      ? 0
      : assignedRanks.reduce((sum, rank) => sum + rank, 0) / assignedRanks.length;

  const histogram: HistogramBin[] = [
    { label: "第1希望", value: ranks.filter((rank) => rank === 1).length },
    { label: "第2希望", value: ranks.filter((rank) => rank === 2).length },
    { label: "第3希望", value: ranks.filter((rank) => rank === 3).length },
    { label: "第4希望以下", value: ranks.filter((rank) => rank !== null && rank >= 4).length },
    { label: "未配属", value: ranks.filter((rank) => rank === null).length },
  ];

  return {
    metrics: {
      firstChoiceRate: candidateCount === 0 ? 0 : firstChoiceCount / candidateCount,
      top3Rate: candidateCount === 0 ? 0 : top3Count / candidateCount,
      averageRank: Number(averageRank.toFixed(4)),
      blockingPairs: countBlockingPairs(input, assignments),
    },
    histogram,
  };
}
