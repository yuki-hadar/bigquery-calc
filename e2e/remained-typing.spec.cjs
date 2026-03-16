// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Typing test: when the user types in "Remained on-demand TiB" (or similar)
 * character by character with a delay between each character, the input
 * must always show what they have typed so far — not snap back to 8000
 * or the original value. Pasting a value should also work.
 */
test.describe('Remained field typing', () => {
  test('typing character-by-character with 500ms delay shows each partial value', async ({ page }) => {
    await page.goto('/');

    // Select scenario "On-demand→Slots" so "Remained on-demand TiB" is visible
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();

    // Wait for the Remained on-demand TiB input to be visible and get its locator
    const remainedInput = page.getByTestId('remained-on-demand-tib');
    await expect(remainedInput).toBeVisible();

    // Clear any existing value and focus
    await remainedInput.click();
    await remainedInput.clear();

    // Type "18919" one character at a time with 500ms between each character.
    // After each keystroke we must see the accumulated string, not 8000 or 16000.
    const digits = ['1', '8', '9', '1', '9'];
    for (let i = 0; i < digits.length; i++) {
      await page.keyboard.type(digits[i], { delay: 50 });
      await page.waitForTimeout(500);

      const expectedSoFar = digits.slice(0, i + 1).join('');
      const value = await remainedInput.inputValue();

      expect(
        value,
        `After typing "${expectedSoFar}" the input should show "${expectedSoFar}", not 8000 or original. Got: "${value}"`
      ).toBe(expectedSoFar);
    }

    // Final value should be 18919
    await expect(remainedInput).toHaveValue('18919');
  });

  test('pasting a value into Remained on-demand TiB works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();

    const remainedInput = page.getByTestId('remained-on-demand-tib');
    await expect(remainedInput).toBeVisible();

    await remainedInput.click();
    await remainedInput.clear();
    await remainedInput.fill('18919');

    await expect(remainedInput).toHaveValue('18919');
  });

  test('typing "1" then "0" then "0" then "0" then "0" shows 1, 10, 100, 1000, 10000', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'On-demand→Slots' }).click();

    const remainedInput = page.getByTestId('remained-on-demand-tib');
    await expect(remainedInput).toBeVisible();
    await remainedInput.click();
    await remainedInput.clear();

    const steps = [
      { key: '1', expected: '1' },
      { key: '0', expected: '10' },
      { key: '0', expected: '100' },
      { key: '0', expected: '1000' },
      { key: '0', expected: '10000' },
    ];

    for (const { key, expected } of steps) {
      await page.keyboard.type(key, { delay: 30 });
      await page.waitForTimeout(400);
      const value = await remainedInput.inputValue();
      expect(value).toBe(expected);
    }
  });
});
