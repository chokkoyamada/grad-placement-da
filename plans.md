# plans.md

## Vision
Interactive simulator comparing Baseline vs DA for new-grad placement, highlighting:
- satisfaction distribution
- stability / blocking pairs
- incentive to be honest

## Milestones
1. Scaffold Next.js app + routes + basic UI shell
2. Deterministic sample data generator with seed
3. Implement baseline algorithm
4. Implement DA algorithm
5. Compute metrics (top-1, top-k, avg rank, blocking pairs)
6. Visualizations (KPI cards + histogram + individual card)
7. About page explanation & polish

## Current status
- [x] M1 Scaffold
- [x] M2 Data generator
- [x] M3 Algorithms
- [x] M4 Metrics
- [x] M5 Visualizations
- [x] M6 About & polish

## Decisions
- Baseline: greedy assignment by department score (aptitude + preference weight)
- DA: candidate-proposing, department keeps best up to capacity
- Constraints: MVP uses hard constraints (infeasible pairs removed)
