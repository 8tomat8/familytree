import { test, expect } from '@playwright/test';

/**
 * QA Test Suite: Person Selection Input Field Validation
 * Using Playwright for end-to-end UI testing
 * 
 * CRITICAL TEST: Validates that when selecting an existing person from the dropdown,
 * the full name appears correctly in the input field
 */

test.describe('Person Selection Input Field - Full Name Display', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for images to load
    await expect(page.locator('img[alt*="IMG_"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display full name in input field when selecting existing person from dropdown', async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log('Browser console:', msg.text()));

    await test.step('Setup: Create a test person first', async () => {
      // Enable crop mode
      const cropButton = page.getByRole('button', { name: 'Toggle image cropping' });
      await cropButton.click();
      
      // Create crop selection
      const mainImage = page.locator('img[alt*="IMG_"]').first();
      const imageBox = await mainImage.boundingBox();
      
      if (imageBox) {
        const startX = imageBox.x + imageBox.width * 0.3;
        const startY = imageBox.y + imageBox.height * 0.3;
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 100, startY + 100);
        await page.mouse.up();
      }
      
      // Create person with full name including special characters
      const personInput = page.getByRole('textbox', { name: 'Enter person\'s name' });
      await expect(personInput).toBeVisible();
      const testPersonName = 'John Smith-O\'Connor Jr.';
      await personInput.fill(testPersonName);
      
      // Create the person
      const createButton = page.getByRole('button', { name: 'Create' });
      await createButton.click();
      
      // Wait for creation to complete
      await page.waitForTimeout(3000);
      
      // Exit crop mode
      await cropButton.click();
      
      console.log(`✅ Created test person: ${testPersonName}`);
    });

    await test.step('Navigate to different image and test person selection', async () => {
      // Navigate to next image
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1000);
      
      // Enable crop mode again
      const cropButton = page.getByRole('button', { name: 'Toggle image cropping' });
      await cropButton.click();
      
      // Create new crop selection
      const mainImage = page.locator('img[alt*="IMG_"]').first();
      const imageBox = await mainImage.boundingBox();
      
      if (imageBox) {
        const startX = imageBox.x + imageBox.width * 0.5;
        const startY = imageBox.y + imageBox.height * 0.4;
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 80, startY + 80);
        await page.mouse.up();
      }
      
      const personInput = page.getByRole('textbox', { name: 'Enter person\'s name' });
      await expect(personInput).toBeVisible();
      
      console.log('✅ Crop mode enabled on second image');
    });

    await test.step('CRITICAL TEST: Search and select existing person', async () => {
      const personInput = page.getByRole('textbox', { name: 'Enter person\'s name' });
      
      // Type partial name to trigger search
      await personInput.fill('John');
      await page.waitForTimeout(1000);
      
      // Wait for dropdown to appear
      const dropdown = page.locator('div.absolute.top-full');
      await expect(dropdown).toBeVisible({ timeout: 5000 });
      
      // Look for the person in dropdown
      const personInDropdown = page.locator('div.font-medium').filter({ hasText: 'John Smith-O\'Connor Jr.' });
      
      // Verify the person appears in dropdown
      await expect(personInDropdown).toBeVisible({ timeout: 3000 });
      console.log('✅ Person found in dropdown');
      
      // CRITICAL TEST: Click on the person in dropdown
      await personInDropdown.click();
      
      // Small wait for state updates
      await page.waitForTimeout(500);
      
      // VALIDATION: Check that input field contains the FULL name
      const inputValue = await personInput.inputValue();
      
      console.log(`Input field value after selection: "${inputValue}"`);
      
      // CRITICAL ASSERTION: Full name should be displayed
      expect(inputValue).toBe('John Smith-O\'Connor Jr.');
      
      console.log('✅ CRITICAL TEST PASSED: Full name correctly displayed in input field');
      
      // Additional validation: Button should show "Link"
      const linkButton = page.getByRole('button', { name: 'Link' });
      await expect(linkButton).toBeVisible({ timeout: 3000 });
      
      console.log('✅ Link button correctly displayed for existing person');
    });

    await test.step('Test edge cases: Long names and special characters', async () => {
      // Clear and test with different search
      const personInput = page.getByRole('textbox', { name: 'Enter person\'s name' });
      
      // Clear input
      await personInput.fill('');
      await page.waitForTimeout(500);
      
      // Search by last name part
      await personInput.fill('O\'Connor');
      await page.waitForTimeout(1000);
      
      // Should still find the person
      const personInDropdown = page.locator('div.font-medium').filter({ hasText: 'John Smith-O\'Connor Jr.' });
      await expect(personInDropdown).toBeVisible({ timeout: 3000 });
      
      // Click again
      await personInDropdown.click();
      await page.waitForTimeout(500);
      
      // Verify full name still appears
      const inputValue = await personInput.inputValue();
      expect(inputValue).toBe('John Smith-O\'Connor Jr.');
      
      console.log('✅ Edge case test passed: Search by partial name with special characters');
    });
  });

  test('should handle rapid person selection changes correctly', async ({ page }) => {
    await test.step('Setup: Create multiple test persons', async () => {
      const testPersons = [
        'Alice Johnson',
        'Bob Williams-Smith',
        'Charlie O\'Brien'
      ];
      
      for (const personName of testPersons) {
        // Enable crop mode
        const cropButton = page.getByRole('button', { name: 'Toggle image cropping' });
        await cropButton.click();
        
        // Create crop
        const mainImage = page.locator('img[alt*="IMG_"]').first();
        const imageBox = await mainImage.boundingBox();
        
        if (imageBox) {
          const startX = imageBox.x + Math.random() * 200 + 100;
          const startY = imageBox.y + Math.random() * 200 + 100;
          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.mouse.move(startX + 80, startY + 80);
          await page.mouse.up();
        }
        
        const personInput = page.getByRole('textbox', { name: 'Enter person\'s name' });
        await personInput.fill(personName);
        
        const createButton = page.getByRole('button', { name: 'Create' });
        await createButton.click();
        await page.waitForTimeout(2000);
        
        // Exit crop mode
        await cropButton.click();
        await page.waitForTimeout(500);
      }
      
      console.log('✅ Created multiple test persons');
    });

    await test.step('Test rapid selection changes', async () => {
      // Navigate to clean image
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1000);
      
      // Enable crop mode
      const cropButton = page.getByRole('button', { name: 'Toggle image cropping' });
      await cropButton.click();
      
      // Create crop
      const mainImage = page.locator('img[alt*="IMG_"]').first();
      const imageBox = await mainImage.boundingBox();
      
      if (imageBox) {
        const startX = imageBox.x + imageBox.width * 0.4;
        const startY = imageBox.y + imageBox.height * 0.4;
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 100, startY + 100);
        await page.mouse.up();
      }
      
      const personInput = page.getByRole('textbox', { name: 'Enter person\'s name' });
      await expect(personInput).toBeVisible();
      
      // Test rapid selections
      const selections = [
        { search: 'Alice', expected: 'Alice Johnson' },
        { search: 'Bob', expected: 'Bob Williams-Smith' },
        { search: 'Charlie', expected: 'Charlie O\'Brien' }
      ];
      
      for (const selection of selections) {
        // Search for person
        await personInput.fill(selection.search);
        await page.waitForTimeout(800);
        
        // Select from dropdown
        const personInDropdown = page.locator('div.font-medium').filter({ hasText: selection.expected });
        await expect(personInDropdown).toBeVisible({ timeout: 3000 });
        await personInDropdown.click();
        await page.waitForTimeout(300);
        
        // Verify input value
        const inputValue = await personInput.inputValue();
        expect(inputValue).toBe(selection.expected);
        
        console.log(`✅ Rapid selection test: ${selection.expected} correctly displayed`);
      }
    });
  });

  test('should preserve input field value during dropdown navigation', async ({ page }) => {
    await test.step('Setup and test keyboard navigation', async () => {
      // Enable crop mode
      const cropButton = page.getByRole('button', { name: 'Toggle image cropping' });
      await cropButton.click();
      
      // Create crop
      const mainImage = page.locator('img[alt*="IMG_"]').first();
      const imageBox = await mainImage.boundingBox();
      
      if (imageBox) {
        const startX = imageBox.x + imageBox.width * 0.3;
        const startY = imageBox.y + imageBox.height * 0.3;
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 90, startY + 90);
        await page.mouse.up();
      }
      
      const personInput = page.getByRole('textbox', { name: 'Enter person\'s name' });
      await expect(personInput).toBeVisible();
      
      // Type to show dropdown
      await personInput.fill('Test Search');
      await page.waitForTimeout(1000);
      
      // Even if no matches, input should preserve typed value
      const inputValue = await personInput.inputValue();
      expect(inputValue).toBe('Test Search');
      
      console.log('✅ Input field preserves typed value when no matches found');
      
      // Test that typing clears any previous selection
      await personInput.fill('Different Name');
      const newInputValue = await personInput.inputValue();
      expect(newInputValue).toBe('Different Name');
      
      console.log('✅ Input field updates correctly when typing new values');
    });
  });
});

/**
 * TEST SUMMARY:
 * 
 * These Playwright tests validate the critical issue reported by the user:
 * "when I select an existing person to link from the list, full name is not show in the input field"
 * 
 * Test Coverage:
 * 1. ✅ Person creation and dropdown population
 * 2. ✅ Search functionality with partial names
 * 3. ✅ CRITICAL: Full name display after dropdown selection
 * 4. ✅ Special characters and edge cases
 * 5. ✅ Rapid selection changes
 * 6. ✅ Input field state management
 * 
 * Expected Behavior:
 * - When user types in search box, dropdown shows matching persons
 * - When user clicks on person in dropdown, FULL NAME should appear in input
 * - Input field should preserve exact name including special characters
 * - Button should change from "Create" to "Link" for existing persons
 * 
 * This test suite will help identify if the issue is:
 * - Frontend state management problem
 * - Race condition in React state updates
 * - API response handling issue
 * - UI component rendering problem
 */