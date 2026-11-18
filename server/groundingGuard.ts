import type { OptimisationResult } from '../src/lib/types';

export interface GeminiExplanationShape {
  headline: string;
  overview: string;
  actionHighlights: string[];
  financialBreakdown: string;
  scenarioNote: string;
}

export interface GroundingCheckResult {
  valid: boolean;
  reason?: string;
}

/**
 * Verifies that every £ amount cited in Gemini's explanation matches one of
 * the exact calculated financial figures (baseline, optimised, or savings).
 * Prevents hallucinated savings or contradictory numbers (AC4).
 */
export function verifyExplanationGrounding(
  candidate: GeminiExplanationShape,
  result: OptimisationResult,
): GroundingCheckResult {
  if (
    !candidate.headline?.trim() ||
    !candidate.overview?.trim() ||
    !Array.isArray(candidate.actionHighlights) ||
    candidate.actionHighlights.length === 0 ||
    !candidate.financialBreakdown?.trim() ||
    !candidate.scenarioNote?.trim()
  ) {
    return { valid: false, reason: 'Incomplete explanation structure from Gemini' };
  }

  const allowedAmounts = [
    result.baseline.totalCostGbp,
    result.optimised.totalCostGbp,
    result.savingsGbp,
    0,
  ];

  const combinedText = [
    candidate.headline,
    candidate.overview,
    ...candidate.actionHighlights,
    candidate.financialBreakdown,
    candidate.scenarioNote,
  ].join(' ');

  const poundMatches = combinedText.match(/£\s*(-?\d+(?:\.\d+)?)/g) ?? [];
  for (const match of poundMatches) {
    const num = Number(match.replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(num)) {
      return { valid: false, reason: `Unparseable currency figure: ${match}` };
    }
    const matchesAllowed = allowedAmounts.some((allowed) => Math.abs(allowed - num) <= 0.015);
    if (!matchesAllowed) {
      return {
        valid: false,
        reason: `Ungrounded currency figure ${match} (expected £${result.baseline.totalCostGbp.toFixed(2)}, £${result.optimised.totalCostGbp.toFixed(2)}, or £${result.savingsGbp.toFixed(2)})`,
      };
    }
  }

  return { valid: true };
}
