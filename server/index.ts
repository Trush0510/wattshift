import 'dotenv/config';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import { z } from 'zod';
import { buildOfflineExplanation } from '../src/lib/offlineExplanation';
import type { ExplanationPayload, OptimisationResult } from '../src/lib/types';
import { callGeminiApi, type GeminiCaller } from './geminiService';
import { verifyExplanationGrounding } from './groundingGuard';

const hourlyPointSchema = z.object({
  hour: z.number().int().min(0).max(23),
  label: z.string(),
  solarKw: z.number(),
  demandKw: z.number(),
  importPricePence: z.number(),
  exportPricePence: z.number(),
  tariffTier: z.enum(['off_peak', 'standard', 'peak']),
  action: z.enum(['charge', 'discharge', 'hold']),
  chargeKw: z.number(),
  dischargeKw: z.number(),
  netBatteryKw: z.number(),
  gridImportKw: z.number(),
  gridExportKw: z.number(),
  socStartKwh: z.number(),
  socEndKwh: z.number(),
  socEndPct: z.number(),
  costPence: z.number(),
});

const summarySchema = z.object({
  hourly: z.array(hourlyPointSchema).length(24),
  startSocKwh: z.number(),
  endSocKwh: z.number(),
  totalSolarKwh: z.number(),
  totalDemandKwh: z.number(),
  totalImportKwh: z.number(),
  totalExportKwh: z.number(),
  totalCostPence: z.number(),
  totalCostGbp: z.number(),
});

const explainRequestSchema = z.object({
  scenario: z.enum(['standard', 'cloudy', 'price_spike']),
  config: z.object({
    solarCapacityKwp: z.number(),
    batteryCapacityKwh: z.number(),
    initialSocPct: z.number(),
    minReservePct: z.number(),
    maxPowerKw: z.number(),
    chargeEfficiency: z.number(),
    dischargeEfficiency: z.number(),
    offPeakImportPence: z.number(),
    standardImportPence: z.number(),
    peakImportPence: z.number(),
    exportTariffPence: z.number(),
  }),
  forecast: z.array(z.any()).length(24),
  baseline: summarySchema,
  optimised: summarySchema,
  savingsPence: z.number(),
  savingsGbp: z.number(),
  savingsPct: z.number(),
});

export interface AppDependencies {
  geminiCaller?: GeminiCaller;
  getApiKey?: () => string | undefined;
  getModel?: () => string;
}

export function createApp(deps: AppDependencies = {}): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  const geminiCaller = deps.geminiCaller ?? callGeminiApi;
  const getApiKey = deps.getApiKey ?? (() => process.env.GEMINI_API_KEY?.trim());
  const getModel = deps.getModel ?? (() => process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash');

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'solarxchange-api',
      geminiConfigured: Boolean(getApiKey()),
    });
  });

  app.post('/api/explain', async (req: Request, res: Response) => {
    const parsed = explainRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid optimisation payload',
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = parsed.data as OptimisationResult;
    const apiKey = getApiKey();

    if (!apiKey) {
      res.status(200).json(buildOfflineExplanation(result, 'GEMINI_API_KEY not configured'));
      return;
    }

    try {
      const candidate = await geminiCaller(result, apiKey, getModel());
      const grounding = verifyExplanationGrounding(candidate, result);

      if (!grounding.valid) {
        res.status(200).json(
          buildOfflineExplanation(
            result,
            grounding.reason ?? 'Gemini response failed grounding check',
          ),
        );
        return;
      }

      const payload: ExplanationPayload = {
        source: 'gemini',
        headline: candidate.headline,
        overview: candidate.overview,
        actionHighlights: candidate.actionHighlights,
        financialBreakdown: candidate.financialBreakdown,
        scenarioNote: candidate.scenarioNote,
        generatedAt: new Date().toISOString(),
      };
      res.status(200).json(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gemini API call failed';
      res.status(200).json(buildOfflineExplanation(result, message));
    }
  });

  return app;
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].endsWith('index.ts');

if (isDirectRun) {
  const port = Number(process.env.PORT || 3001);
  const app = createApp();
  app.listen(port, () => {
    console.log(`SolarXchange API listening on http://localhost:${port}`);
  });
}
