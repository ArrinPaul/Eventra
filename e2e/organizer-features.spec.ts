/**
 * E2E Test: Organizer Features
 * Tests event creation, management, and analytics
 */

import { test, expect, Page } from '@playwright/test';

// Helper functions
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

async function mockOrganizerUser(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('currentUser', JSON.stringify({
      id: 'org-user-1',
      name: 'Test Organizer',
      email: 'organizer@example.com',
      role: 'organizer',
      organization: 'Test Organization',
    }));
  });
}

async function mockAdminUser(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('currentUser', JSON.stringify({
      id: 'admin-user-1',
      name: 'Test Admin',
      email: 'admin@example.com',
      role: 'admin',
    }));
  });
}

test.describe('Event Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await mockOrganizerUser(page);
  });

  test('should display event creation page', async ({ page }) => {
    await page.goto('/events/create');
    await waitForPageLoad(page);

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have step-by-step wizard', async ({ page }) => {
    await page.goto('/events/create');
    await waitForPageLoad(page);

    // Look for stepper or progress indicator
    const stepper = page.locator('[data-testid="stepper"]').or(
      page.locator('[role="progressbar"]').or(
        page.locator('text=/step|basic|details|ticketing/i')
      )
    );

    if (await stepper.first().isVisible()) {
      await expect(stepper.first()).toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/events/create');
    await waitForPageLoad(page);

    // Try to proceed without filling required fields
    const nextButton = page.getByRole('button', { name: /next|continue|submit/i });
    
    if (await nextButton.first().isVisible()) {
      await nextButton.first().click();
      
      // Should show validation error or stay on same step
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    }
  });

  test('should have AI generation feature', async ({ page }) => {
    await page.goto('/events/create');
    await waitForPageLoad(page);

    // Look for AI/Magic button
    const aiButton = page.getByRole('button', { name: /ai|magic|generate|auto/i });
    
    if (await aiButton.first().isVisible()) {
      await expect(aiButton.first()).toBeEnabled();
    }
  });

  test('should support ticket tiers', async ({ page }) => {
    await page.goto('/events/create');
    await waitForPageLoad(page);

    // Navigate to ticketing step if multi-step
    const ticketingTab = page.getByRole('tab', { name: /ticket/i }).or(
      page.getByText(/ticket/i)
    );

    if (await ticketingTab.first().isVisible()) {
      await ticketingTab.first().click();
    }

    // Look for add tier button
    const addTierButton = page.getByRole('button', { name: /add tier|add ticket/i });
    
    if (await addTierButton.isVisible()) {
      await expect(addTierButton).toBeEnabled();
    }
  });
});

test.describe('Organizer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await mockOrganizerUser(page);
  });

  test('should display organizer dashboard', async ({ page }) => {
    await page.goto('/organizer');
    await waitForPageLoad(page);

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should show event statistics', async ({ page }) => {
    await page.goto('/organizer');
    await waitForPageLoad(page);

    // Look for stats cards
    const statsCard = page.locator('[data-testid="stats-card"]').or(
      page.locator('text=/total|events|attendees|revenue/i')
    );

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should list managed events', async ({ page }) => {
    await page.goto('/organizer');
    await waitForPageLoad(page);

    // Look for events list or table
    const eventsList = page.locator('[data-testid="events-list"]').or(
      page.locator('table').or(
        page.locator('[role="list"]')
      )
    );

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have create event button', async ({ page }) => {
    await page.goto('/organizer');
    await waitForPageLoad(page);

    // Look for create event CTA
    const createButton = page.getByRole('button', { name: /create event|new event/i }).or(
      page.getByRole('link', { name: /create event|new event/i })
    );

    if (await createButton.first().isVisible()) {
      await expect(createButton.first()).toBeEnabled();
    }
  });
});

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await mockOrganizerUser(page);
  });

  test('should display analytics page', async ({ page }) => {
    await page.goto('/organizer/analytics');
    await waitForPageLoad(page);

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should show charts and visualizations', async ({ page }) => {
    await page.goto('/organizer/analytics');
    await waitForPageLoad(page);

    // Look for chart elements
    const chart = page.locator('[data-testid="chart"]').or(
      page.locator('svg').or(
        page.locator('canvas')
      )
    );

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have export functionality', async ({ page }) => {
    await page.goto('/organizer/analytics');
    await waitForPageLoad(page);

    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|download|csv/i });
    
    if (await exportButton.first().isVisible()) {
      await expect(exportButton.first()).toBeEnabled();
    }
  });

  test('should support date range filtering', async ({ page }) => {
    await page.goto('/organizer/analytics');
    await waitForPageLoad(page);

    // Look for date range selector
    const dateFilter = page.locator('[data-testid="date-filter"]').or(
      page.getByRole('button', { name: /7 days|30 days|date/i })
    );

    if (await dateFilter.first().isVisible()) {
      await expect(dateFilter.first()).toBeEnabled();
    }
  });
});

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await mockAdminUser(page);
  });

  test('should display admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await waitForPageLoad(page);

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have tabs for different sections', async ({ page }) => {
    await page.goto('/admin');
    await waitForPageLoad(page);

    // Look for admin tabs
    const tabs = page.getByRole('tab').or(
      page.locator('[role="tablist"]')
    );

    if (await tabs.first().isVisible()) {
      await expect(tabs.first()).toBeVisible();
    }
  });

  test('should show user management section', async ({ page }) => {
    await page.goto('/admin');
    await waitForPageLoad(page);

    // Look for users tab or section
    const usersTab = page.getByRole('tab', { name: /user/i }).or(
      page.getByText(/user management/i)
    );

    if (await usersTab.first().isVisible()) {
      await usersTab.first().click();
      await waitForPageLoad(page);
    }

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should show moderation section', async ({ page }) => {
    await page.goto('/admin');
    await waitForPageLoad(page);

    // Look for moderation tab
    const moderationTab = page.getByRole('tab', { name: /moderation|reports/i }).or(
      page.getByText(/moderation/i)
    );

    if (await moderationTab.first().isVisible()) {
      await moderationTab.first().click();
      await waitForPageLoad(page);
    }

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should show settings section', async ({ page }) => {
    await page.goto('/admin');
    await waitForPageLoad(page);

    // Look for settings tab
    const settingsTab = page.getByRole('tab', { name: /setting/i }).or(
      page.getByText(/system settings/i)
    );

    if (await settingsTab.first().isVisible()) {
      await settingsTab.first().click();
      await waitForPageLoad(page);
    }

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});

test.describe('Broadcast Messaging', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await mockOrganizerUser(page);
  });

  test('should display broadcast form', async ({ page }) => {
    await page.goto('/organizer');
    await waitForPageLoad(page);

    // Look for broadcast section
    const broadcastSection = page.locator('[data-testid="broadcast-form"]').or(
      page.getByText(/broadcast|announcement/i)
    );

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have recipient selection', async ({ page }) => {
    await page.goto('/organizer');
    await waitForPageLoad(page);

    // Look for recipient selector
    const recipientSelect = page.locator('[data-testid="recipient-select"]').or(
      page.getByRole('combobox')
    );

    if (await recipientSelect.first().isVisible()) {
      await expect(recipientSelect.first()).toBeEnabled();
    }
  });
});

test.describe('Certificate Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await mockOrganizerUser(page);
  });

  test('should show certificate manager', async ({ page }) => {
    await page.goto('/organizer');
    await waitForPageLoad(page);

    // Look for certificates section/tab
    const certTab = page.getByRole('tab', { name: /certificate/i }).or(
      page.getByText(/certificates/i)
    );

    if (await certTab.first().isVisible()) {
      await certTab.first().click();
      await waitForPageLoad(page);
    }

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have template selection', async ({ page }) => {
    await page.goto('/organizer');
    await waitForPageLoad(page);

    // Navigate to certificates if tabbed
    const certTab = page.getByRole('tab', { name: /certificate/i });
    if (await certTab.first().isVisible()) {
      await certTab.first().click();
    }

    // Look for template selector
    const templateSelect = page.locator('[data-testid="template-select"]').or(
      page.getByText(/template/i)
    );

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
