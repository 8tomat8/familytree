import { Page, expect } from '@playwright/test';

export class PersonTestUtils {
  constructor(private page: Page) {}

  /**
   * Enable cropping mode and verify it's activated
   */
  async enableCropMode() {
    const cropButton = this.page.getByRole('button', { name: 'Toggle image cropping' });
    await expect(cropButton).toBeVisible();
    await cropButton.click();
    
    // Verify crop mode is enabled (thumbnails should be disabled)
    const thumbnail = this.page.getByRole('button', { name: /IMG_.*1/ });
    await expect(thumbnail).toBeDisabled();
  }

  /**
   * Create a proper crop selection using mouse coordinates
   * @param position - Position on image ('center', 'top-left', 'bottom-right', etc.)
   * @param size - Size of crop area in pixels (default: 100)
   */
  async createCropSelection(position: 'center' | 'top-left' | 'bottom-right' | 'custom' = 'center', size: number = 100) {
    const mainImage = this.page.locator('img[alt*="IMG_"]').first();
    await expect(mainImage).toBeVisible();
    
    const imageBox = await mainImage.boundingBox();
    expect(imageBox).toBeTruthy();
    
    if (!imageBox) return;

    let startX: number, startY: number;

    switch (position) {
      case 'center':
        startX = imageBox.x + imageBox.width * 0.5 - size / 2;
        startY = imageBox.y + imageBox.height * 0.5 - size / 2;
        break;
      case 'top-left':
        startX = imageBox.x + 50;
        startY = imageBox.y + 50;
        break;
      case 'bottom-right':
        startX = imageBox.x + imageBox.width - size - 50;
        startY = imageBox.y + imageBox.height - size - 50;
        break;
      default:
        startX = imageBox.x + imageBox.width * 0.4;
        startY = imageBox.y + imageBox.height * 0.3;
    }

    const endX = startX + size;
    const endY = startY + size;
    
    // Create proper drag selection
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY);
    await this.page.mouse.up();
    
    // Verify person input UI appears
    const personInput = this.page.getByRole('textbox', { name: 'Enter person\'s name' });
    await expect(personInput).toBeVisible({ timeout: 5000 });
  }

  /**
   * Create a new person with the given name
   */
  async createPerson(name: string) {
    const personInput = this.page.getByRole('textbox', { name: 'Enter person\'s name' });
    await personInput.fill(name);
    
    // Verify "Create" button appears and is enabled
    const createButton = this.page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
    
    // Listen for API calls
    const personCreatePromise = this.page.waitForResponse(
      response => response.url().includes('/api/people') && response.request().method() === 'POST'
    );
    const personLinkPromise = this.page.waitForResponse(
      response => response.url().includes('/api/people/link-to-image') && response.request().method() === 'POST'
    );
    
    await createButton.click();
    
    // Wait for API calls and verify success
    const createResponse = await personCreatePromise;
    expect(createResponse.status()).toBe(201);
    
    const linkResponse = await personLinkPromise;
    expect(linkResponse.status()).toBe(200);
    
    // Verify success message
    const successMessage = this.page.locator(`text=Created and linked ${name}`);
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Search for and link an existing person
   */
  async linkExistingPerson(searchTerm: string, exactPersonName: string) {
    const personInput = this.page.getByRole('textbox', { name: 'Enter person\'s name' });
    
    // Search for the person
    await personInput.fill(searchTerm);
    
    // Verify person appears in dropdown
    const personOption = this.page.locator(`text=${exactPersonName}`);
    await expect(personOption).toBeVisible({ timeout: 3000 });
    
    // Select the person
    await personOption.click();
    
    // Verify input field updates and button changes to "Link"
    await expect(personInput).toHaveValue(exactPersonName);
    const linkButton = this.page.getByRole('button', { name: 'Link' });
    await expect(linkButton).toBeVisible();
    await expect(linkButton).toBeEnabled();
    
    // Ensure "Create" button is not visible
    const createButton = this.page.getByRole('button', { name: 'Create' });
    await expect(createButton).not.toBeVisible();
    
    // Link the person
    const linkPromise = this.page.waitForResponse(
      response => response.url().includes('/api/people/link-to-image') && response.request().method() === 'POST'
    );
    
    await linkButton.click();
    
    // Verify API call succeeds
    const linkResponse = await linkPromise;
    expect(linkResponse.status()).toBe(200);
    
    // Verify success message
    const successMessage = this.page.locator(`text=Linked ${exactPersonName} to image`);
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Navigate to a specific image by index
   */
  async navigateToImage(imageNumber: number) {
    const currentImageNumber = await this.getCurrentImageNumber();
    const difference = imageNumber - currentImageNumber;
    
    if (difference > 0) {
      // Navigate forward
      for (let i = 0; i < difference; i++) {
        await this.page.keyboard.press('ArrowRight');
        await this.page.waitForTimeout(500); // Small delay for navigation
      }
    } else if (difference < 0) {
      // Navigate backward
      for (let i = 0; i < Math.abs(difference); i++) {
        await this.page.keyboard.press('ArrowLeft');
        await this.page.waitForTimeout(500);
      }
    }
    
    // Verify we're on the correct image - use regex pattern to match "X of Y" format
    await expect(this.page.locator(`text=/^${imageNumber} of \\d+$/`)).toBeVisible({ timeout: 8000 });
  }

  /**
   * Get the current image number from the UI
   */
  async getCurrentImageNumber(): Promise<number> {
    const imageCounter = this.page.locator('text=/\\d+ of \\d+/');
    await expect(imageCounter).toBeVisible();
    const text = await imageCounter.textContent();
    const match = text?.match(/^(\\d+) of/);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Wait for UI cleanup after person operations
   */
  async waitForUICleanup() {
    // Wait for automatic cleanup (2 second timeout + buffer)
    await this.page.waitForTimeout(2500);
    
    // Verify crop selection and input are cleared
    const personInput = this.page.getByRole('textbox', { name: 'Enter person\'s name' });
    await expect(personInput).not.toBeVisible();
  }

  /**
   * Clean up any existing people from the database for testing
   */
  async cleanupTestData() {
    // This would typically make API calls to clean up test data
    // For now, we'll rely on the natural test isolation
    // In a real implementation, you might want to:
    // 1. Call DELETE endpoints to remove test people
    // 2. Reset database to a known state
    // 3. Clear any cached data
  }

  /**
   * Verify that an error message is displayed
   */
  async verifyErrorMessage(expectedErrorText: string) {
    const errorMessage = this.page.locator(`text=${expectedErrorText}`).first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Create a crop selection that should result in invalid coordinates
   */
  async createInvalidCropSelection() {
    const mainImage = this.page.locator('img[alt*="IMG_"]').first();
    const imageBox = await mainImage.boundingBox();
    
    if (imageBox) {
      const startX = imageBox.x + 100;
      const startY = imageBox.y + 100;
      // Create extremely small crop (1px difference)
      await this.page.mouse.move(startX, startY);
      await this.page.mouse.down();
      await this.page.mouse.move(startX + 1, startY + 1);
      await this.page.mouse.up();
    }
  }
}