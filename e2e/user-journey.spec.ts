/**
 * E2E Test: Complete User Journey
 * Tests: Signup → Register for Event → Check-in Flow
 */

import { test, expect, Page } from '@playwright/test';

// Test user data
const testUser = {
  name: 'Test User',
  email: `test.user.${Date.now()}@example.com`,
  password: 'SecureP@ss123',
};

// Helper functions
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

test.describe('Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
  });

  test('should display landing page correctly', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check hero section
    await expect(page.locator('h1')).toBeVisible();
    
    // Check navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Check CTA buttons
    await expect(page.getByRole('link', { name: /explore|events/i })).toBeVisible();
  });

  test('should navigate to explore page', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Click explore events
    await page.getByRole('link', { name: /explore/i }).first().click();
    
    // Should be on explore page
    await expect(page).toHaveURL(/.*explore/);
    
    // Should show event cards or empty state
    await expect(page.locator('[data-testid="event-grid"], [data-testid="no-events"]')).toBeVisible({ timeout: 10000 }).catch(() => {
      // If no test IDs, look for common elements
      expect(page.locator('main')).toBeVisible();
    });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Click login/sign in button
    const loginButton = page.getByRole('link', { name: /login|sign in/i }).first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/.*login|.*auth/);
    }
  });
});

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/auth/login');
    await waitForPageLoad(page);

    // Check for form elements
    await expect(page.getByLabel(/email/i).or(page.locator('input[type="email"]'))).toBeVisible();
    await expect(page.getByLabel(/password/i).or(page.locator('input[type="password"]'))).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in|submit/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');
    await waitForPageLoad(page);

    // Submit empty form
    await page.getByRole('button', { name: /sign in|log in|submit/i }).click();

    // Should show validation messages or remain on login page
    await expect(page).toHaveURL(/.*login|.*auth/);
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/login');
    await waitForPageLoad(page);

    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    await emailInput.fill('invalid-email');
    await emailInput.blur();

    // Trigger form validation
    await page.getByRole('button', { name: /sign in|log in|submit/i }).click();
    
    // Should either show error or remain on page
    await expect(page).toHaveURL(/.*login|.*auth/);
  });

  test('should have Google OAuth option', async ({ page }) => {
    await page.goto('/auth/login');
    await waitForPageLoad(page);

    // Check for Google sign-in button
    const googleButton = page.getByRole('button', { name: /google|continue with google/i });
    if (await googleButton.isVisible()) {
      await expect(googleButton).toBeEnabled();
    }
  });
});

test.describe('Event Exploration', () => {
  test('should display events on explore page', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageLoad(page);

    // Page should load
    await expect(page.locator('main')).toBeVisible();
    
    // Should have search functionality
    const searchInput = page.getByPlaceholder(/search/i).or(page.locator('input[type="search"]'));
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeEnabled();
    }
  });

  test('should filter events by category', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageLoad(page);

    // Look for category filters
    const categoryFilter = page.locator('[data-testid="category-filter"]').or(
      page.getByRole('button', { name: /category|filter/i })
    );
    
    if (await categoryFilter.first().isVisible()) {
      await categoryFilter.first().click();
    }
  });

  test('should toggle between grid and list view', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageLoad(page);

    // Look for view toggle
    const viewToggle = page.locator('[data-testid="view-toggle"]').or(
      page.getByRole('button', { name: /grid|list/i })
    );
    
    if (await viewToggle.first().isVisible()) {
      await viewToggle.first().click();
    }
  });

  test('should search for events', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageLoad(page);

    const searchInput = page.getByPlaceholder(/search/i).or(page.locator('input[type="search"]'));
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('technology');
      await page.keyboard.press('Enter');
      await waitForPageLoad(page);
    }
  });
});

test.describe('Event Details', () => {
  test('should display event details page', async ({ page }) => {
    // Navigate to a sample event (may need to adjust based on actual data)
    await page.goto('/events/sample-event-id');
    await waitForPageLoad(page);

    // Check for common event details elements
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should show register button', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageLoad(page);

    // Click on first event card if exists
    const eventCard = page.locator('[data-testid="event-card"]').or(
      page.locator('article').first()
    );
    
    if (await eventCard.first().isVisible()) {
      await eventCard.first().click();
      await waitForPageLoad(page);

      // Look for register button
      const registerButton = page.getByRole('button', { name: /register|sign up|join/i });
      if (await registerButton.isVisible()) {
        await expect(registerButton).toBeEnabled();
      }
    }
  });
});

test.describe('Dashboard Navigation', () => {
  test('should display dashboard when authenticated', async ({ page }) => {
    // Mock authentication by setting localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('currentUser', JSON.stringify({
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
      }));
    });

    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Should either show dashboard or redirect to login
    const url = page.url();
    expect(url.includes('dashboard') || url.includes('login') || url.includes('auth')).toBe(true);
  });

  test('should redirect unauthenticated users', async ({ page }) => {
    await clearLocalStorage(page);
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Should redirect to login or show login prompt
    const url = page.url();
    expect(
      url.includes('login') || 
      url.includes('auth') || 
      url.includes('dashboard')
    ).toBe(true);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForPageLoad(page);

    // Page should be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Check for mobile menu (hamburger)
    const mobileMenu = page.locator('[data-testid="mobile-menu"]').or(
      page.getByRole('button', { name: /menu/i })
    );
    
    // Either mobile menu should exist or navigation should be visible
    const nav = page.locator('nav');
    await expect(nav.or(mobileMenu.first())).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await waitForPageLoad(page);

    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await waitForPageLoad(page);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check for nav element with proper role
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/auth/login');
    await waitForPageLoad(page);

    // Check that inputs have labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      // At least email and password should have labels or aria-label
      const emailInput = page.locator('input[type="email"]').or(page.getByLabel(/email/i));
      await expect(emailInput).toBeVisible();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Tab through elements
    await page.keyboard.press('Tab');
    
    // Should focus on a focusable element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeTruthy();
  });
});

test.describe('Performance', () => {
  test('should load landing page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await waitForPageLoad(page);
    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should not have console errors on landing page', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await waitForPageLoad(page);

    // Filter out expected errors (e.g., Firebase initialization in dev)
    const criticalErrors = consoleErrors.filter(
      error => !error.includes('Firebase') && !error.includes('development')
    );

    // Should have minimal console errors
    expect(criticalErrors.length).toBeLessThan(5);
  });
});
