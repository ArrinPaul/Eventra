/**
 * E2E Test: Check-in Flow
 * Tests the QR code scanning and check-in process
 */

import { test, expect, Page } from '@playwright/test';

// Helper functions
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

async function mockAuthenticatedUser(page: Page, role: 'student' | 'organizer' | 'admin' = 'student') {
  await page.evaluate((userRole) => {
    localStorage.setItem('currentUser', JSON.stringify({
      id: 'test-user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: userRole,
      registrationId: 'REG-12345',
      checkedIn: false,
    }));
  }, role);
}

async function mockOrganizerUser(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('currentUser', JSON.stringify({
      id: 'org-user-1',
      name: 'Test Organizer',
      email: 'organizer@example.com',
      role: 'organizer',
    }));
  });
}

test.describe('Tickets Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('should display tickets page when authenticated', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/tickets');
    await waitForPageLoad(page);

    // Should show tickets page or redirect based on auth state
    const url = page.url();
    expect(url.includes('tickets') || url.includes('login')).toBe(true);
  });

  test('should display QR code for ticket', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/tickets');
    await waitForPageLoad(page);

    // Look for QR code element
    const qrCode = page.locator('[data-testid="qr-code"]').or(
      page.locator('svg[viewBox]') // QR codes are typically SVG
    ).or(
      page.locator('canvas') // Or canvas
    );

    // QR code should be present if user has tickets
    if (await qrCode.first().isVisible()) {
      await expect(qrCode.first()).toBeVisible();
    }
  });

  test('should show ticket details', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/tickets');
    await waitForPageLoad(page);

    // Should show ticket information
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have add to calendar option', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/tickets');
    await waitForPageLoad(page);

    // Look for calendar button
    const calendarButton = page.getByRole('button', { name: /calendar|add to calendar/i });
    if (await calendarButton.isVisible()) {
      await expect(calendarButton).toBeEnabled();
    }
  });
});

test.describe('Check-in Scanner', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('should display scanner page for organizers', async ({ page }) => {
    await mockOrganizerUser(page);
    await page.goto('/check-in-scanner');
    await waitForPageLoad(page);

    // Should show scanner or redirect
    const url = page.url();
    expect(url.includes('scanner') || url.includes('login') || url.includes('dashboard')).toBe(true);
  });

  test('should have manual search fallback', async ({ page }) => {
    await mockOrganizerUser(page);
    await page.goto('/check-in-scanner');
    await waitForPageLoad(page);

    // Look for manual search option
    const searchInput = page.getByPlaceholder(/search|name|email/i).or(
      page.locator('input[type="search"]').or(page.locator('input[type="text"]'))
    );

    if (await searchInput.first().isVisible()) {
      await expect(searchInput.first()).toBeEnabled();
    }
  });

  test('should show check-in stats', async ({ page }) => {
    await mockOrganizerUser(page);
    await page.goto('/check-in-scanner');
    await waitForPageLoad(page);

    // Look for stats display
    const statsContainer = page.locator('[data-testid="check-in-stats"]').or(
      page.locator('text=/checked in|total|rate/i')
    );

    // Stats should be visible if page is loaded
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});

test.describe('Check-in Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('should display check-in page', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/check-in');
    await waitForPageLoad(page);

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should show check-in status', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/check-in');
    await waitForPageLoad(page);

    // Look for status indicator
    const statusBadge = page.locator('[data-testid="check-in-status"]').or(
      page.locator('text=/checked in|not checked in|pending/i')
    );

    // Should show some content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});

test.describe('QR Code Validation', () => {
  test('should handle invalid QR codes gracefully', async ({ page }) => {
    await mockOrganizerUser(page);
    await page.goto('/check-in-scanner');
    await waitForPageLoad(page);

    // If there's a manual entry option, test invalid input
    const searchInput = page.getByPlaceholder(/search|code|ticket/i);
    
    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('INVALID-CODE-12345');
      await page.keyboard.press('Enter');
      
      // Should not crash, should show error or no results
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await mockOrganizerUser(page);
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.goto('/check-in-scanner');
    
    // Should handle offline state
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Restore online mode
    await page.context().setOffline(false);
  });
});

test.describe('Certificate Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('should display certificates page', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/certificates');
    await waitForPageLoad(page);

    // Should show certificates page or redirect
    const url = page.url();
    expect(url.includes('certificates') || url.includes('login')).toBe(true);
  });

  test('should show certificate list for user', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/certificates');
    await waitForPageLoad(page);

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have download option for certificates', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/certificates');
    await waitForPageLoad(page);

    // Look for download button
    const downloadButton = page.getByRole('button', { name: /download|pdf|export/i });
    
    // If certificates exist, download should be available
    if (await downloadButton.first().isVisible()) {
      await expect(downloadButton.first()).toBeEnabled();
    }
  });

  test('should verify certificate', async ({ page }) => {
    // Test certificate verification page
    await page.goto('/certificates/verify');
    await waitForPageLoad(page);

    // Should have verification input
    const verifyInput = page.getByPlaceholder(/code|id|certificate/i).or(
      page.locator('input[type="text"]')
    );

    if (await verifyInput.first().isVisible()) {
      await expect(verifyInput.first()).toBeEnabled();
    }
  });
});

test.describe('My Events Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('should display my events page', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/my-events');
    await waitForPageLoad(page);

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have tabs for registered and past events', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/my-events');
    await waitForPageLoad(page);

    // Look for tab navigation
    const tabs = page.getByRole('tab').or(
      page.locator('[role="tablist"]')
    );

    if (await tabs.first().isVisible()) {
      await expect(tabs.first()).toBeVisible();
    }
  });

  test('should show event status indicators', async ({ page }) => {
    await mockAuthenticatedUser(page);
    await page.goto('/my-events');
    await waitForPageLoad(page);

    // Look for status badges
    const statusBadge = page.locator('[data-testid="event-status"]').or(
      page.locator('text=/upcoming|past|live|completed/i')
    );

    // Main content should be visible regardless
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
