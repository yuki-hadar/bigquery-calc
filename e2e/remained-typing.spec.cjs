// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Typing test: when the user types in "Remained on-demand TiB", the input must
 * show what they have typed — not snap back to 8000 or the original value.
 * Pasting (fill) and character-by-character typing after select-all both work.
 */
test.describe('Remained field typing', () => {
  test('typing character-by-character shows each partial value', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();

    const remainedInput = page.getByTestId('remained-on-demand-tib');
    await expect(remainedInput).toBeVisible();

    // fill() replaces entire value; then type rest so we see 1, 18, 189, 1891, 18919
    await remainedInput.fill('1');
    await expect(remainedInput).toHaveValue('1');

    const rest = ['8', '9', '1', '9'];
    for (let i = 0; i < rest.length; i++) {
      await page.keyboard.type(rest[i], { delay: 50 });
      const expectedSoFar = '1' + rest.slice(0, i + 1).join('');
      await expect(remainedInput).toHaveValue(expectedSoFar);
    }

    await expect(remainedInput).toHaveValue('18919');
  });

  test('pasting a value into Remained on-demand TiB works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();

    const remainedInput = page.getByTestId('remained-on-demand-tib');
    await expect(remainedInput).toBeVisible();

    await remainedInput.click();
    await remainedInput.fill('18919');

    await expect(remainedInput).toHaveValue('18919');
  });

  test('typing 1 then 0 then 0 then 0 then 0 shows 1, 10, 100, 1000, 10000', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();

    const remainedInput = page.getByTestId('remained-on-demand-tib');
    await expect(remainedInput).toBeVisible();

    // fill('1') then type zeros so we see 1, 10, 100, 1000, 10000
    await remainedInput.fill('1');
    await expect(remainedInput).toHaveValue('1');

    const expectedAfterEachZero = ['10', '100', '1000', '10000'];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.type('0', { delay: 30 });
      await expect(remainedInput).toHaveValue(expectedAfterEachZero[i]);
    }
  });
});
