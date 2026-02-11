export interface Random {
  next: () => number;
  int: (min: number, max: number) => number;
  pickN: <T>(items: T[], count: number) => T[];
  weightedIndex: (weights: number[]) => number;
}

export function createSeededRandom(seed: number): Random {
  let state = seed >>> 0;

  const next = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) => {
    if (max < min) {
      throw new Error(`invalid int range: ${min}..${max}`);
    }

    return Math.floor(next() * (max - min + 1)) + min;
  };

  const pickN = <T>(items: T[], count: number): T[] => {
    if (count >= items.length) {
      return [...items];
    }

    const pool = [...items];
    const picked: T[] = [];
    for (let i = 0; i < count; i += 1) {
      const index = int(0, pool.length - 1);
      const [value] = pool.splice(index, 1);
      picked.push(value);
    }

    return picked;
  };

  const weightedIndex = (weights: number[]) => {
    const total = weights.reduce((sum, value) => sum + Math.max(value, 0), 0);
    if (total <= 0) {
      return int(0, Math.max(0, weights.length - 1));
    }

    let cursor = next() * total;
    for (let i = 0; i < weights.length; i += 1) {
      cursor -= Math.max(weights[i], 0);
      if (cursor <= 0) {
        return i;
      }
    }

    return weights.length - 1;
  };

  return { next, int, pickN, weightedIndex };
}
