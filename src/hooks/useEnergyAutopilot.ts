import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildOfflineExplanation } from '../lib/offlineExplanation';
import { runEnergyOptimisation } from '../lib/optimiser';
import type {
  ExplanationPayload,
  OptimisationResult,
  ScenarioId,
  SystemConfig,
  ValidationErrors,
} from '../lib/types';
import { DEFAULT_CONFIG, isValidConfig, validateConfig } from '../lib/validation';

const STORAGE_KEY = 'solarxchange_v1_config';

function loadInitialConfig(): SystemConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<SystemConfig>;
    const merged: SystemConfig = { ...DEFAULT_CONFIG, ...parsed };
    return isValidConfig(merged) ? merged : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function useEnergyAutopilot() {
  const [config, setConfig] = useState<SystemConfig>(() => loadInitialConfig());
  const [scenario, setScenario] = useState<ScenarioId>('standard');
  const [isOptimised, setIsOptimised] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<ExplanationPayload | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  const errors: ValidationErrors = useMemo(() => validateConfig(config), [config]);
  const hasErrors = Object.keys(errors).length > 0;

  // Keep last valid result so charts never crash while user is typing an invalid value
  const [lastValidResult, setLastValidResult] = useState<OptimisationResult>(() =>
    runEnergyOptimisation(loadInitialConfig(), 'standard'),
  );

  useEffect(() => {
    if (!hasErrors) {
      setLastValidResult(runEnergyOptimisation(config, scenario));
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [config, scenario, hasErrors]);

  const updateConfigField = useCallback(
    <K extends keyof SystemConfig>(field: K, value: number) => {
      setConfig((prev) => ({ ...prev, [field]: value }));
      setExplanation(null);
    },
    [],
  );

  const selectScenario = useCallback((nextScenario: ScenarioId) => {
    setScenario(nextScenario);
    setExplanation(null);
  }, []);

  const optimiseEnergy = useCallback(() => {
    if (hasErrors) return;
    setIsOptimised(true);
    setExplanation(null);
  }, [hasErrors]);

  const resetDemo = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setConfig(DEFAULT_CONFIG);
    setScenario('standard');
    setIsOptimised(false);
    setExplanation(null);
  }, []);

  const requestExplanation = useCallback(async () => {
    if (hasErrors) return;
    setIsExplaining(true);
    // Ensure schedule is visible when user asks to explain the plan
    setIsOptimised(true);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastValidResult),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as ExplanationPayload;
      setExplanation(payload);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Network error';
      setExplanation(buildOfflineExplanation(lastValidResult, `API unavailable (${reason})`));
    } finally {
      setIsExplaining(false);
    }
  }, [hasErrors, lastValidResult]);

  return {
    config,
    scenario,
    isOptimised,
    errors,
    hasErrors,
    result: lastValidResult,
    explanation,
    isExplaining,
    updateConfigField,
    selectScenario,
    optimiseEnergy,
    resetDemo,
    requestExplanation,
  };
}
