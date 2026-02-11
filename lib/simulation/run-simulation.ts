import type { SimulationConfig, SimulationOutput } from "@/lib/types";
import { runBaseline, runDeferredAcceptance } from "@/lib/simulation/algorithms";
import { defaultSimulationConfig } from "@/lib/simulation/config";
import { generateSimulationInput } from "@/lib/simulation/generator";

export function runSimulation(config: SimulationConfig): SimulationOutput {
  const input = generateSimulationInput(config);
  const baseline = runBaseline(input);
  const da = runDeferredAcceptance(input);

  return {
    input,
    baseline,
    da,
  };
}

export function runDefaultSimulation(): SimulationOutput {
  return runSimulation(defaultSimulationConfig);
}
