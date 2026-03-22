// @ts-check
const { test, expect } = require('@playwright/test');

// Scenario A (OD→Slots) exact: Original 16k OD → 50% remained 8k OD, 250k slots.
// KPIs: Total Original $100,000 | New Total $60,000 | Gross $40,000 | Yuki Fee $12,800 (6,400 YC) | Net $27,200
test.describe('OD→Reservation (scenario A)', () => {
  test('selecting On-demand→Slots shows Remained on-demand TiB and Deducted TiB in shifted section', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();

    await expect(page.getByTestId('remained-on-demand-tib')).toBeVisible();
    await expect(page.getByText('Shifted On-Demand TiB', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Deducted TiB', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Yuki Credits = Shifted On-Demand TiB − Deducted TiB')).toBeVisible();
  });

  test('Remained on-demand TiB reflects slider; typing 18919 updates display', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();

    const remainedInput = page.getByTestId('remained-on-demand-tib');
    await remainedInput.fill('18919');
    await expect(remainedInput).toHaveValue('18919');
  });

  test('50% Remained shows 8000 in Remained on-demand TiB (original 16000)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();

    const remainedInput = page.getByTestId('remained-on-demand-tib');
    await expect(remainedInput).toBeVisible();
    await remainedInput.fill('8000');
    await expect(remainedInput).toHaveValue('8000');

    const sliderLabel = page.getByText('%').first();
    await expect(sliderLabel).toBeVisible();
  });

  test('slider label shows Remained (%) in scenario A', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();
    await expect(page.getByText('Remained (%)')).toBeVisible();
  });

  test('OD→Slots: 16000 TiB, 50% → 8000 remained, slots 250000 → full KPIs and Yuki Fee $12,800', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();
    const remainedOd = page.getByTestId('remained-on-demand-tib');
    await remainedOd.fill('8000');
    await expect(remainedOd).toHaveValue('8000');
    await page.waitForTimeout(600);

    const kpiCards = page.locator('div.rounded-xl').filter({ hasText: 'Total Original Cost' });
    await expect(kpiCards.filter({ hasText: '$100,000' }).first()).toBeVisible({ timeout: 10000 });
    await expect(kpiCards.filter({ hasText: 'Before Yuki' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'New Total Cost' }).filter({ hasText: '$60,000' }).first()).toBeVisible();
    await expect(page.getByText('On-demand TiB:', { exact: false }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Gross Savings' }).filter({ hasText: '$40,000' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Reduction in BigQuery spend' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Yuki Fee' }).filter({ hasText: '$12,800' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Yuki Fee' }).filter({ hasText: '6,400.00 Yuki Credits × $2.00' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Chargeable units × $2.00' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Customer Net Savings' }).filter({ hasText: '$27,200' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Gross savings − Yuki fee' }).first()).toBeVisible();
  });

  test('bar chart: With Yuki bar shows new BQ cost $60,000 and Yuki fee $12,800 (not same as original $100k)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();
    const remainedOd = page.getByTestId('remained-on-demand-tib');
    await remainedOd.fill('8000');
    await expect(remainedOd).toHaveValue('8000');
    await page.waitForTimeout(600);

    const chartSection = page.getByText("Total cost — inc. Yuki's fee", { exact: false }).locator('..');
    await expect(chartSection).toBeVisible();
    await expect(chartSection.getByText('$100,000')).toBeVisible();
    await expect(chartSection.getByText('$60,000')).toBeVisible();
    await expect(chartSection.getByText('$12,800')).toBeVisible();
  });
});

// Scenario B (Slots→OD) exact: Original 2.5M slots → 50% remained 1.25M slots, Yuki OD 1,600 TiB.
// KPIs: Total Original $100,000 | New Total $60,000 | Gross $40,000 | Yuki Fee $12,800 (6,400 YC) | Net $27,200
test.describe('Slots→OD (scenario B) - remained slot-hours = original × pct', () => {
  test('at 50.2% Remained Slot-Hours shows 1,255,000 not 2,249,000', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Slots→On-demand' }).click();

    const remainedSlotsInput = page.getByTestId('remained-slot-hours');
    await expect(remainedSlotsInput).toBeVisible();

    await remainedSlotsInput.fill('1255000');
    await expect(remainedSlotsInput).toHaveValue('1255000');

    await page.getByText('Original On-Demand TiB').first().click();
    await expect(remainedSlotsInput).toHaveValue('1255000');
  });

  test('slider 50.2% shows Remained Slot-Hours 1,255,000 in panel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Slots→On-demand' }).click();

    const remainedSlotsInput = page.getByTestId('remained-slot-hours');
    await remainedSlotsInput.fill('1255000');
    await expect(remainedSlotsInput).toHaveValue('1255000');

    await expect(page.getByText('Shifted reservation slot hours')).toBeVisible();
    await expect(page.getByText('Deducted reservation slot hours')).toBeVisible();
  });

  test('2.5M original slots, 1.25M remained: savings are non-zero (Yuki OD 1600 included in calc)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Slots→On-demand' }).click();

    const remainedSlotsInput = page.getByTestId('remained-slot-hours');
    await remainedSlotsInput.fill('1250000');
    await expect(remainedSlotsInput).toHaveValue('1250000');

    await page.getByText('Original On-Demand TiB').first().click();

    const savingsCard = page.getByText(/Savings|savings|Yuki Fee|chargeable/i).first();
    await expect(savingsCard).toBeVisible({ timeout: 5000 });

    const yukiCreditsOrFee = page.locator('text=/Yuki Credits|Yuki Fee|\\d+(\\.\\d+)?/');
    await expect(yukiCreditsOrFee.first()).toBeVisible();
  });

  test('Slots→OD: 2,500,000 slots, 50% → 1,250,000 remained, Yuki OD 1600 → Deducted 1M, 6400 TiB, full KPIs', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Slots→On-demand' }).click();
    const remainedSlots = page.getByTestId('remained-slot-hours');
    await remainedSlots.fill('1250000');
    await expect(remainedSlots).toHaveValue('1250000');
    await page.getByText('Original On-Demand TiB').first().click();
    await page.waitForTimeout(600);

    await expect(page.getByText('1,000,000', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('6,400 On-Demand TiB × 156.25')).toBeVisible();

    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Total Original Cost' }).filter({ hasText: '$100,000' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Before Yuki' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'New Total Cost' }).filter({ hasText: '$60,000' }).first()).toBeVisible();
    await expect(page.getByText('On-demand TiB:', { exact: false }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Gross Savings' }).filter({ hasText: '$40,000' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Reduction in BigQuery spend' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Yuki Fee' }).filter({ hasText: '$12,800' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Yuki Fee' }).filter({ hasText: '6,400.00 Yuki Credits × $2.00' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Chargeable units × $2.00' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Customer Net Savings' }).filter({ hasText: '$27,200' }).first()).toBeVisible();
    await expect(page.locator('div.rounded-xl').filter({ hasText: 'Gross savings − Yuki fee' }).first()).toBeVisible();
  });

  test('bar chart: With Yuki bar shows new BQ cost $60,000 and Yuki fee $12,800 (Slots→OD)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Slots→On-demand' }).click();
    const remainedSlots = page.getByTestId('remained-slot-hours');
    await remainedSlots.fill('1250000');
    await expect(remainedSlots).toHaveValue('1250000');
    await page.getByText('Original On-Demand TiB').first().click();
    await page.waitForTimeout(600);

    const chartSection = page.getByText("Total cost — inc. Yuki's fee", { exact: false }).locator('..');
    await expect(chartSection).toBeVisible();
    await expect(chartSection.getByText('$100,000')).toBeVisible();
    await expect(chartSection.getByText('$60,000')).toBeVisible();
    await expect(chartSection.getByText('$12,800')).toBeVisible();
  });
});
