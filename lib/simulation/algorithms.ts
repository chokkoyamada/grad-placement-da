import type { AlgorithmKey, AssignmentReason, PlacementResult, SimulationInput } from "@/lib/types";
import { evaluatePlacement } from "@/lib/simulation/metrics";

function buildPreferenceRankMap(input: SimulationInput): Record<string, Record<string, number>> {
  const map: Record<string, Record<string, number>> = {};
  for (const candidate of input.candidates) {
    map[candidate.id] = {};
    candidate.preferences.forEach((departmentId, index) => {
      map[candidate.id][departmentId] = index + 1;
    });
  }

  return map;
}

function buildDepartmentRankMaps(input: SimulationInput): Record<string, Record<string, number>> {
  const rankMaps: Record<string, Record<string, number>> = {};
  for (const department of input.departments) {
    const rankMap: Record<string, number> = {};
    const priority = input.departmentPriority[department.id] ?? [];
    priority.forEach((candidateId, index) => {
      rankMap[candidateId] = index;
    });
    rankMaps[department.id] = rankMap;
  }

  return rankMaps;
}

function summarizeReasons(
  algorithm: AlgorithmKey,
  input: SimulationInput,
  assignments: Record<string, string | null>,
): AssignmentReason[] {
  const deptNameMap = new Map(input.departments.map((department) => [department.id, department.name]));

  return input.candidates.map((candidate) => {
    const assignedId = assignments[candidate.id];
    if (!assignedId) {
      return {
        candidateId: candidate.id,
        algorithm,
        assignedDepartmentId: null,
        summary: "応募可能な候補で確定せず未配属。",
      };
    }

    const rank = candidate.preferences.findIndex((departmentId) => departmentId === assignedId);
    const rankText = rank >= 0 ? `第${rank + 1}希望` : "希望外";

    return {
      candidateId: candidate.id,
      algorithm,
      assignedDepartmentId: assignedId,
      summary: `${rankText}の${deptNameMap.get(assignedId) ?? assignedId}に配属。`,
    };
  });
}

export function runBaseline(input: SimulationInput): PlacementResult {
  const assignments: Record<string, string | null> = Object.fromEntries(
    input.candidates.map((candidate) => [candidate.id, null]),
  );

  const unassigned = new Set(input.candidates.map((candidate) => candidate.id));
  const preferenceRanks = buildPreferenceRankMap(input);

  // 会社最適寄りの簡易ルールとして、部署ごとの候補者スコア順に埋める。
  for (const department of input.departments) {
    const rankedCandidates = input.candidates
      .filter(
        (candidate) =>
          unassigned.has(candidate.id) &&
          candidate.eligibleDepartments.includes(department.id) &&
          preferenceRanks[candidate.id][department.id] !== undefined,
      )
      .map((candidate) => {
        const rank = preferenceRanks[candidate.id][department.id];
        const preferenceScore = (input.config.preferenceLength - rank + 1) / input.config.preferenceLength;
        const aptitudeScore = input.candidateAptitude[candidate.id][department.id];
        const score =
          input.config.aptitudeWeight * aptitudeScore + (1 - input.config.aptitudeWeight) * preferenceScore;

        return { candidateId: candidate.id, score };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.candidateId.localeCompare(b.candidateId);
      });

    const selected = rankedCandidates.slice(0, department.capacity);
    for (const entry of selected) {
      assignments[entry.candidateId] = department.id;
      unassigned.delete(entry.candidateId);
    }
  }

  const reasons = summarizeReasons("baseline", input, assignments);
  const metricsResult = evaluatePlacement(input, assignments);

  return {
    algorithm: "baseline",
    assignments,
    reasons,
    metrics: metricsResult.metrics,
    satisfactionHistogram: metricsResult.histogram,
  };
}

export function runDeferredAcceptance(input: SimulationInput): PlacementResult {
  const assignments: Record<string, string | null> = Object.fromEntries(
    input.candidates.map((candidate) => [candidate.id, null]),
  );

  const departmentSlots = new Map(input.departments.map((department) => [department.id, department.capacity]));
  const departmentRankMaps = buildDepartmentRankMaps(input);
  const nextProposalIndex: Record<string, number> = Object.fromEntries(
    input.candidates.map((candidate) => [candidate.id, 0]),
  );
  const holding: Record<string, string[]> = Object.fromEntries(
    input.departments.map((department) => [department.id, []]),
  );

  const queue = [...input.candidates.map((candidate) => candidate.id)];

  // 新卒提案型DA: 候補者が希望順に提案し、部署は優先順位上位のみ暫定保持する。
  while (queue.length > 0) {
    const candidateId = queue.shift();
    if (!candidateId) {
      continue;
    }

    const candidate = input.candidates.find((entry) => entry.id === candidateId);
    if (!candidate) {
      continue;
    }

    const proposalIndex = nextProposalIndex[candidateId];
    if (proposalIndex >= candidate.preferences.length) {
      continue;
    }

    const targetDepartmentId = candidate.preferences[proposalIndex];
    nextProposalIndex[candidateId] = proposalIndex + 1;

    if (!candidate.eligibleDepartments.includes(targetDepartmentId)) {
      queue.push(candidateId);
      continue;
    }

    const currentHolding = [...holding[targetDepartmentId], candidateId];
    const rankMap = departmentRankMaps[targetDepartmentId];
    const capacity = departmentSlots.get(targetDepartmentId) ?? 0;

    currentHolding.sort((a, b) => {
      const rankA = rankMap[a] ?? Number.MAX_SAFE_INTEGER;
      const rankB = rankMap[b] ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return a.localeCompare(b);
    });

    holding[targetDepartmentId] = currentHolding.slice(0, capacity);
    const rejected = currentHolding.slice(capacity);

    for (const rejectedCandidateId of rejected) {
      if (nextProposalIndex[rejectedCandidateId] < (input.candidates.find((x) => x.id === rejectedCandidateId)?.preferences.length ?? 0)) {
        queue.push(rejectedCandidateId);
      }
    }
  }

  for (const [departmentId, candidateIds] of Object.entries(holding)) {
    for (const candidateId of candidateIds) {
      assignments[candidateId] = departmentId;
    }
  }

  const reasons = summarizeReasons("da", input, assignments);
  const metricsResult = evaluatePlacement(input, assignments);

  return {
    algorithm: "da",
    assignments,
    reasons,
    metrics: metricsResult.metrics,
    satisfactionHistogram: metricsResult.histogram,
  };
}
