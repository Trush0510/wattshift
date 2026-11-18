import { expect, test } from '@playwright/test';

test.describe('SolarXchange End-to-End Journey (AC1–AC5)', () => {
  test('completes Configure -> Forecast -> Optimise -> Simulate -> Explain -> Reset in Chrome', async ({
    page,
  }) => {
    await page.goto('/');

    // AC1 & AC5: Loads without login, shows Simulated Estimates badge, 24 hourly rows, and baseline KPI
    await expect(page.getByRole('heading', { name: 'SolarXchange' })).toBeVisible();
    await expect(page.getByTestId('simulated-estimates-badge')).toContainText('Simulated Estimates');
    await expect(page.getByTestId('kpi-baseline-cost')).toContainText('£');
    await expect(page.getByTestId('kpi-optimised-cost')).toContainText('Ready to calculate');

    for (let h = 0; h < 24; h++) {
      await expect(page.getByTestId(`schedule-row-${h}`)).toBeVisible();
    }

    // AC5: Invalid input produces visible validation message
    const initialSocInput = page.locator('#initial-soc');
    await initialSocInput.fill('5');
    await expect(page.getByRole('alert')).toContainText('Initial charge must be between 10%');

    // Restore valid config and adjust solar capacity (AC1)
    await initialSocInput.fill('50');
    await expect(page.getByRole('alert')).toHaveCount(0);

    const solarBeforeText = await page.getByTestId('kpi-solar-forecast').textContent();
    await page.locator('#solar-capacity').fill('7');
    const solarAfterText = await page.getByTestId('kpi-solar-forecast').textContent();
    expect(solarAfterText).not.toBe(solarBeforeText);

    // AC2: Optimise My Energy reveals 24 actions, optimised cost, and savings
    await page.getByRole('button', { name: 'Optimise My Energy' }).click();
    await expect(page.getByTestId('kpi-optimised-cost')).toContainText('£');
    await expect(page.getByTestId('kpi-savings')).toContainText('£');
    await expect(page.getByTestId('schedule-action-ribbon')).toBeVisible();

    // AC3: Simulate Cloudy Weather (reduces solar kWh) & Price Spike (recalculates without reload)
    const solarStandard = await page.getByTestId('kpi-solar-forecast').textContent();
    await page.getByRole('button', { name: 'Cloudy Weather' }).click();
    const solarCloudy = await page.getByTestId('kpi-solar-forecast').textContent();
    expect(solarCloudy).not.toBe(solarStandard);

    await page.getByRole('button', { name: 'Price Spike' }).click();
    await expect(page.getByTestId('kpi-savings')).toContainText('£');

    // AC4: Explain My Plan returns grounded Gemini or clearly labelled Offline Explanation
    await page.getByRole('button', { name: 'Explain My Plan' }).click();
    await expect(page.getByTestId('explanation-card')).toBeVisible({ timeout: 15000 });
    const badgeText = await page.getByTestId('explanation-source-badge').textContent();
    expect(
      badgeText?.includes('Gemini AI Explanation') ||
        badgeText?.includes('Offline Explanation (Gemini API Unavailable)'),
    ).toBe(true);

    // AC3 & AC5: Reset Demo restores 5 kWp / 10 kWh defaults and Forecast mode
    await page.getByRole('button', { name: 'Reset Demo' }).click();
    await expect(page.locator('#solar-capacity')).toHaveValue('5');
    await expect(page.locator('#battery-capacity')).toHaveValue('10');
    await expect(page.getByTestId('kpi-optimised-cost')).toContainText('Ready to calculate');
  });
});
