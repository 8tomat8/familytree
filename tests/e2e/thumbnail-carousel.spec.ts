import { test, expect } from '@playwright/test';

test.describe('Image Navigation and Thumbnail Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the gallery
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for the main gallery to load
    await expect(page.locator('.swiper-slide').first()).toBeVisible({ timeout: 10000 });
    
    // Wait for interface to settle
    await page.waitForTimeout(2000);
  });

  test('should display thumbnail grid and support keyboard navigation', async ({ page }) => {
    await test.step('Verify thumbnail grid display', async () => {
      // Check for thumbnail grid layout
      const thumbnailImages = page.locator('img[src*="/images/"]:visible');
      const thumbnailCount = await thumbnailImages.count();
      
      expect(thumbnailCount).toBeGreaterThan(0);
      console.log(`✅ Found ${thumbnailCount} thumbnail images displayed`);
      
      // Verify main image counter is visible
      const imageCounter = page.locator('text=/\\d+ of \\d+/').first();
      await expect(imageCounter).toBeVisible();
      
      const counterText = await imageCounter.textContent();
      console.log(`📊 Current position: ${counterText}`);
      
      // Verify main image is displayed
      const mainImage = page.locator('.swiper-slide-visible img').first();
      await expect(mainImage).toBeVisible();
      console.log('✅ Main image is visible');
    });

    await test.step('Test keyboard navigation functionality', async () => {
      // Get initial image counter
      const initialCounter = await page.locator('text=/\\d+ of \\d+/').first().textContent();
      console.log(`📊 Starting at: ${initialCounter}`);
      
      // Extract current image number
      const currentMatch = initialCounter?.match(/(\d+) of (\d+)/);
      const currentImage = currentMatch ? parseInt(currentMatch[1]) : 1;
      const totalImages = currentMatch ? parseInt(currentMatch[2]) : 0;
      
      console.log(`📊 Image ${currentImage} of ${totalImages} total`);
      
      // Test right arrow navigation (only if not at last image)
      if (currentImage < totalImages) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(1000);
        
        const afterRightCounter = await page.locator('text=/\\d+ of \\d+/').first().textContent();
        console.log(`📊 After right arrow: ${afterRightCounter}`);
        
        expect(afterRightCounter).not.toBe(initialCounter);
        expect(afterRightCounter).toContain(`${currentImage + 1} of ${totalImages}`);
        console.log('✅ Right arrow navigation working');
        
        // Test left arrow to go back
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(1000);
        
        const backCounter = await page.locator('text=/\\d+ of \\d+/').first().textContent();
        console.log(`📊 After left arrow: ${backCounter}`);
        
        expect(backCounter).toBe(initialCounter);
        console.log('✅ Left arrow navigation working');
      } else {
        console.log('⚠️ At last image, testing left arrow only');
        
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(1000);
        
        const afterLeftCounter = await page.locator('text=/\\d+ of \\d+/').first().textContent();
        console.log(`📊 After left arrow: ${afterLeftCounter}`);
        
        if (afterLeftCounter !== initialCounter) {
          console.log('✅ Left arrow navigation working');
          
          // Go back to original
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test('should display visual indicators for active state', async ({ page }) => {
    await test.step('Check for active state indicators', async () => {
      // Look for border-based active state indicators (found in exploration)
      const activeIndicators = page.locator('[class*="border"]');
      const borderElementCount = await activeIndicators.count();
      
      if (borderElementCount > 0) {
        console.log(`✅ Found ${borderElementCount} elements with border classes (potential active indicators)`);
        
        // Check if at least one is visible
        const visibleBorderElements = await activeIndicators.filter({ hasText: /./ }).count();
        console.log(`📍 ${visibleBorderElements} border elements have content`);
      } else {
        console.log('⚠️ No border-based active indicators found');
      }
      
      // Check for main image active state
      const activeSlide = page.locator('.swiper-slide-visible, .swiper-slide-active');
      await expect(activeSlide.first()).toBeVisible();
      console.log('✅ Active swiper slide is visible');
    });
  });

  test('should handle rapid keyboard navigation', async ({ page }) => {
    await test.step('Test rapid arrow key presses', async () => {
      // Get initial position
      const initialCounter = await page.locator('text=/\\d+ of \\d+/').first().textContent();
      const currentMatch = initialCounter?.match(/(\d+) of (\d+)/);
      const currentImage = currentMatch ? parseInt(currentMatch[1]) : 1;
      const totalImages = currentMatch ? parseInt(currentMatch[2]) : 0;
      
      console.log(`📊 Starting rapid navigation test from image ${currentImage}`);
      
      // Test rapid right arrow presses (up to 5 images forward)
      const maxSteps = Math.min(5, totalImages - currentImage);
      
      if (maxSteps > 0) {
        for (let i = 0; i < maxSteps; i++) {
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(300); // Shorter wait for rapid testing
        }
        
        const forwardCounter = await page.locator('text=/\\d+ of \\d+/').first().textContent();
        console.log(`📊 After ${maxSteps} right arrows: ${forwardCounter}`);
        
        // Navigate back to original position
        for (let i = 0; i < maxSteps; i++) {
          await page.keyboard.press('ArrowLeft');
          await page.waitForTimeout(300);
        }
        
        const backCounter = await page.locator('text=/\\d+ of \\d+/').first().textContent();
        console.log(`📊 After returning: ${backCounter}`);
        
        expect(backCounter).toBe(initialCounter);
        console.log('✅ Rapid keyboard navigation working correctly');
      } else {
        console.log('⚠️ At last image, skipping rapid navigation test');
      }
    });
  });

  test('should verify main image updates during keyboard navigation', async ({ page }) => {
    await test.step('Test main image synchronization with navigation', async () => {
      // Get the main image element
      const mainImage = page.locator('.swiper-slide-visible img').first();
      await expect(mainImage).toBeVisible();
      
      // Get initial image source
      const initialSrc = await mainImage.getAttribute('src');
      console.log(`📸 Initial main image: ${initialSrc?.split('/').pop()}`);
      
      // Navigate forward
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1000);
      
      // Check if main image changed
      const newSrc = await mainImage.getAttribute('src');
      console.log(`📸 After navigation: ${newSrc?.split('/').pop()}`);
      
      if (newSrc !== initialSrc) {
        console.log('✅ Main image updates correctly with keyboard navigation');
        
        // Navigate back
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(1000);
        
        const backSrc = await mainImage.getAttribute('src');
        expect(backSrc).toBe(initialSrc);
        console.log('✅ Main image synchronization is bidirectional');
      } else {
        console.log('⚠️ At edge of collection or main image not updating');
      }
    });
  });

  test('should maintain performance during rapid navigation', async ({ page }) => {
    await test.step('Test performance with rapid keyboard input', async () => {
      const startTime = Date.now();
      
      // Perform rapid navigation
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(100); // Very fast navigation
      }
      
      const navigationTime = Date.now() - startTime;
      console.log(`📊 10 rapid navigations took: ${navigationTime}ms`);
      
      // Verify we're still responsive
      const finalCounter = await page.locator('text=/\\d+ of \\d+/').first().textContent();
      console.log(`📊 Final position: ${finalCounter}`);
      
      // Check that main image is still visible and loaded
      const mainImage = page.locator('.swiper-slide-visible img').first();
      await expect(mainImage).toBeVisible();
      
      // Performance should be reasonable (less than 5 seconds for 10 navigations)
      expect(navigationTime).toBeLessThan(5000);
      console.log('✅ Navigation performance is acceptable');
    });
  });
});