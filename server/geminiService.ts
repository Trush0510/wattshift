import { GoogleGenAI, Type } from '@google/genai';
import { SCENARIO_META } from '../src/lib/scenarios';
import type { OptimisationResult } from '../src/lib/types';
import type { GeminiExplanationShape } from './groundingGuard';

const GEMINI_TIMEOUT_MS = 8000;

export type GeminiCaller = (
  result: OptimisationResult,
  apiKey: string,
  model: string,
) => Promise<GeminiExplanationShape>;

export const callGeminiApi: GeminiCaller = async (
  result: OptimisationResult,
  apiKey: string,
  model: string,
): Promise<GeminiExplanationShape> => {
  const ai = new GoogleGenAI({ apiKey });
  const scenarioInfo = SCENARIO_META[result.scenario];

  const compactSchedule = result.optimised.hourly.map((h) => ({
    hour: h.label,
    action: h.action,
    chargeKw: Number(h.chargeKw.toFixed(2)),
    dischargeKw: Number(h.dischargeKw.toFixed(2)),
    solarKw: Number(h.solarKw.toFixed(2)),
    demandKw: Number(h.demandKw.toFixed(2)),
    importPence: h.importPricePence,
    socEndPct: h.socEndPct,
  }));

  const prompt = [
    'You are SolarXchange AI Energy Autopilot explaining a pre-calculated 24-hour UK home solar + battery schedule.',
    'STRICT GROUNDING RULES:',
    `- Active scenario: ${scenarioInfo.label} (${scenarioInfo.description})`,
    `- System: ${result.config.solarCapacityKwp} kWp solar, ${result.config.batteryCapacityKwh} kWh battery (start ${result.optimised.startSocKwh.toFixed(2)} kWh, end ${result.optimised.endSocKwh.toFixed(2)} kWh).`,
    `- EXACT calculated financial metrics (do NOT invent or alter any £ numbers):`,
    `  * Baseline 24h Cost: £${result.baseline.totalCostGbp.toFixed(2)}`,
    `  * Optimised 24h Cost: £${result.optimised.totalCostGbp.toFixed(2)}`,
    `  * Estimated Daily Savings (Baseline - Optimised): £${result.savingsGbp.toFixed(2)} (${result.savingsPct}%)`,
    `- Total solar forecast: ${result.optimised.totalSolarKwh} kWh; total demand: ${result.optimised.totalDemandKwh} kWh.`,
    '- Only cite £ amounts from the three exact metrics above. Refer to all savings as simulated estimates.',
    `- Hourly schedule JSON: ${JSON.stringify(compactSchedule)}`,
  ].join('\n');

  const requestPromise = ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          overview: { type: Type.STRING },
          actionHighlights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          financialBreakdown: { type: Type.STRING },
          scenarioNote: { type: Type.STRING },
        },
        required: [
          'headline',
          'overview',
          'actionHighlights',
          'financialBreakdown',
          'scenarioNote',
        ],
      },
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Gemini API request timed out')), GEMINI_TIMEOUT_MS);
  });

  const response = await Promise.race([requestPromise, timeoutPromise]);
  const text = response.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return JSON.parse(text) as GeminiExplanationShape;
};
