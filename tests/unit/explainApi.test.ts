import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../server/index';
import { runEnergyOptimisation } from '../../src/lib/optimiser';
import { DEFAULT_CONFIG } from '../../src/lib/validation';

describe('POST /api/explain & Grounding Guard (AC4)', () => {
  const sampleResult = runEnergyOptimisation(DEFAULT_CONFIG, 'standard');

  it('returns HTTP 200 on /api/health', async () => {
    const app = createApp({ getApiKey: () => undefined });
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns clearly labelled offline-fallback when GEMINI_API_KEY is missing', async () => {
    const app = createApp({ getApiKey: () => undefined });
    const res = await request(app).post('/api/explain').send(sampleResult);

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('offline-fallback');
    expect(res.body.financialBreakdown).toContain(
      `£${sampleResult.savingsGbp.toFixed(2)}`,
    );
  });

  it('returns source=gemini when Gemini output is grounded in exact £ figures', async () => {
    const app = createApp({
      getApiKey: () => 'test-key',
      geminiCaller: async (result) => ({
        headline: `Save £${result.savingsGbp.toFixed(2)} with off-peak charging`,
        overview: `Baseline £${result.baseline.totalCostGbp.toFixed(2)} drops to £${result.optimised.totalCostGbp.toFixed(2)}.`,
        actionHighlights: ['Charge overnight at 8.5p/kWh', 'Discharge during 16:00–18:59 peak'],
        financialBreakdown: `Simulated savings of £${result.savingsGbp.toFixed(2)}.`,
        scenarioNote: 'Standard Day forecast used.',
      }),
    });

    const res = await request(app).post('/api/explain').send(sampleResult);
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('gemini');
    expect(res.body.headline).toContain(`£${sampleResult.savingsGbp.toFixed(2)}`);
  });

  it('rejects hallucinated £ figures from Gemini and falls back cleanly', async () => {
    const app = createApp({
      getApiKey: () => 'test-key',
      geminiCaller: async () => ({
        headline: 'Save £99.99 today!',
        overview: 'Hallucinated savings.',
        actionHighlights: ['Charge overnight'],
        financialBreakdown: 'You save £99.99.',
        scenarioNote: 'Standard Day.',
      }),
    });

    const res = await request(app).post('/api/explain').send(sampleResult);
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('offline-fallback');
    expect(res.body.reason).toMatch(/Ungrounded currency figure/);
  });

  it('returns offline-fallback instead of crashing when Gemini throws', async () => {
    const app = createApp({
      getApiKey: () => 'test-key',
      geminiCaller: async () => {
        throw new Error('503 Service Unavailable');
      },
    });

    const res = await request(app).post('/api/explain').send(sampleResult);
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('offline-fallback');
    expect(res.body.reason).toContain('503 Service Unavailable');
  });
});
