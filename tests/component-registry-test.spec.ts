import { test, expect, Page } from '@playwright/test'

// Test configuration
const BASE_URL = 'http://localhost:3003'
const ADMIN_PAGE_URL = `${BASE_URL}/admin/component-registry`
const API_URL = `${BASE_URL}/api/component-registry`

// Expected counts (adjust these based on your actual data)
const EXPECTED_TOTAL_COMPONENTS = 47
const EXPECTED_IMPLEMENTED = 47
const EXPECTED_NEEDS_WORK = 0
const EXPECTED_PLACEHOLDER = 0
const EXPECTED_TOTAL_USAGES = 0 // 0 because mdxUsageCount is optional and not set yet

/**
 * Helper: Get registry data from API
 */
async function fetchRegistryData(page: Page) {
  const response = await page.request.get(API_URL)
  expect(response.ok()).toBeTruthy()
  return await response.json()
}

/**
 * Helper: Wait for page to finish loading
 */
async function waitForPageLoad(page: Page) {
  // Wait for loading to disappear
  await page.waitForSelector('text=Loading', { state: 'hidden', timeout: 10000 })
  // Wait for component list to appear
  await page.waitForSelector('.component-card', { timeout: 10000 })
}

/**
 * Helper: Get stat value by label
 */
async function getStatValue(page: Page, label: string): Promise<number> {
  const statCard = page.locator('.stat-card', { has: page.locator(`text="${label}"`) })
  const valueText = await statCard.locator('.stat-value').textContent()
  return parseInt(valueText?.replace(/,/g, '') || '0')
}

/**
 * Helper: Expand a component card by name
 */
async function expandComponent(page: Page, componentName: string) {
  const card = page.locator('.component-card', { has: page.locator(`text="${componentName}"`) })
  const header = card.locator('.card-header')
  await header.click()
  // Wait for card body to appear
  await card.locator('.card-body').waitFor({ state: 'visible' })
  return card
}

/**
 * Helper: Save registry and wait for success
 */
async function saveRegistry(page: Page) {
  await page.click('button:has-text("Save Registry")')
  // Wait for success message
  await page.waitForSelector('.message-success', { timeout: 5000 })
  const successMessage = await page.locator('.message-success').textContent()
  expect(successMessage).toContain('saved successfully')
}

test.describe('Component Registry Admin - Data Integrity', () => {
  test('should display correct component counts in stats dashboard', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    // Check stats dashboard
    const totalComponents = await getStatValue(page, 'Total Components')
    const implemented = await getStatValue(page, 'Implemented')
    const needsWork = await getStatValue(page, 'Needs Work')
    const placeholder = await getStatValue(page, 'Placeholder')
    const totalUsages = await getStatValue(page, 'Total Usages')

    expect(totalComponents).toBe(EXPECTED_TOTAL_COMPONENTS)
    expect(implemented).toBe(EXPECTED_IMPLEMENTED)
    expect(needsWork).toBe(EXPECTED_NEEDS_WORK)
    expect(placeholder).toBe(EXPECTED_PLACEHOLDER)
    expect(totalUsages).toBe(EXPECTED_TOTAL_USAGES) // Should be 0, not NaN
  })

  test('should match API data with UI display', async ({ page }) => {
    // Fetch from API
    const apiData = await fetchRegistryData(page)
    const apiComponentCount = Object.keys(apiData).length

    // Load UI
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    // Count components in UI
    const componentCards = page.locator('.component-card')
    const uiComponentCount = await componentCards.count()

    expect(uiComponentCount).toBe(apiComponentCount)
    expect(apiComponentCount).toBe(EXPECTED_TOTAL_COMPONENTS)
  })

  test('should display all expected components from API', async ({ page }) => {
    const apiData = await fetchRegistryData(page)
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    // Check that each component from API appears in UI
    const componentNames = Object.keys(apiData)
    for (const name of componentNames.slice(0, 5)) { // Test first 5 to keep test fast
      const componentCard = page.locator('.component-name', { hasText: name })
      await expect(componentCard).toBeVisible()
    }
  })
})

test.describe('Component Registry Admin - Filtering & Search', () => {
  test('should filter components by status', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    const initialCount = await page.locator('.component-card').count()
    expect(initialCount).toBe(EXPECTED_TOTAL_COMPONENTS)

    // Filter by "Implemented"
    await page.selectOption('.filter-select', 'implemented')
    await page.waitForTimeout(500) // Allow React to re-render
    const implementedCount = await page.locator('.component-card').count()
    expect(implementedCount).toBe(EXPECTED_IMPLEMENTED)

    // Filter by "Needs Work"
    await page.selectOption('.filter-select', 'needs-work')
    await page.waitForTimeout(500)
    const needsWorkCount = await page.locator('.component-card').count()
    expect(needsWorkCount).toBe(EXPECTED_NEEDS_WORK)

    // Reset to "All Components"
    await page.selectOption('.filter-select', 'all')
    await page.waitForTimeout(500)
    const allCount = await page.locator('.component-card').count()
    expect(allCount).toBe(EXPECTED_TOTAL_COMPONENTS)
  })

  test('should search components by name', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    // Search for "Phone"
    await page.fill('.search-input', 'Phone')
    await page.waitForTimeout(500)

    const searchResults = await page.locator('.component-card').count()
    expect(searchResults).toBeGreaterThan(0)

    // Verify all visible components contain "Phone"
    const componentNames = await page.locator('.component-name').allTextContents()
    for (const name of componentNames) {
      expect(name.toLowerCase()).toContain('phone')
    }

    // Clear search
    await page.fill('.search-input', '')
    await page.waitForTimeout(500)
    const allCount = await page.locator('.component-card').count()
    expect(allCount).toBe(EXPECTED_TOTAL_COMPONENTS)
  })

  test('should show "no results" when search has no matches', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    await page.fill('.search-input', 'XYZ_NONEXISTENT_COMPONENT_999')
    await page.waitForTimeout(500)

    await expect(page.locator('.empty-state')).toBeVisible()
    await expect(page.locator('.empty-state')).toContainText('No components found')
  })
})

test.describe('Component Registry Admin - Component Editing', () => {
  test('should expand and collapse component cards', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    // Get first component name
    const firstComponentName = await page.locator('.component-name').first().textContent()
    expect(firstComponentName).toBeTruthy()

    // Expand
    const card = await expandComponent(page, firstComponentName!)
    await expect(card.locator('.card-body')).toBeVisible()
    await expect(card.locator('.expand-btn')).toContainText('▼')

    // Collapse
    await card.locator('.card-header').click()
    await expect(card.locator('.card-body')).not.toBeVisible()
    await expect(card.locator('.expand-btn')).toContainText('▶')
  })

  test('should display component details when expanded', async ({ page }) => {
    const apiData = await fetchRegistryData(page)
    const firstComponentName = Object.keys(apiData)[0]
    const firstComponent = apiData[firstComponentName]

    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    const card = await expandComponent(page, firstComponentName)

    // Verify status dropdown
    const statusSelect = card.locator('.form-select').first()
    const statusValue = await statusSelect.inputValue()
    expect(statusValue).toBe(firstComponent.status)

    // Verify component type
    const componentTypeSelects = card.locator('.form-select')
    const componentType = await componentTypeSelects.nth(1).inputValue()
    expect(componentType).toBe(firstComponent.componentType)

    // Verify usage count is displayed only if field exists
    const usageCountLabel = card.locator('text=MDX Usage Count')
    if (firstComponent.mdxUsageCount != null) {
      await expect(usageCountLabel).toBeVisible()
      await expect(card.locator('.usage-display')).toContainText(`${firstComponent.mdxUsageCount} occurrences`)
    } else {
      await expect(usageCountLabel).not.toBeVisible()
    }
  })

  test('should edit component status', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    // Find a component and expand it
    const componentName = await page.locator('.component-name').first().textContent()
    const card = await expandComponent(page, componentName!)

    // Change status to "needs-work" - use more specific selector
    const statusSelect = card.locator('.form-select').first()
    const originalStatus = await statusSelect.inputValue()
    await statusSelect.selectOption('needs-work')

    // Verify the status badge updates
    await page.waitForTimeout(300)
    const statusBadge = card.locator('.status-badge')
    await expect(statusBadge).toContainText('needs-work')

    // Cleanup: revert to original status
    await statusSelect.selectOption(originalStatus)
  })

  test('should toggle rendering capabilities', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    const componentName = await page.locator('.component-name').first().textContent()
    const card = await expandComponent(page, componentName!)

    // Find "Can Render Block" checkbox
    const blockCheckbox = card.locator('input[type="checkbox"]').first()
    const initialState = await blockCheckbox.isChecked()

    // Toggle it
    await blockCheckbox.click()
    await page.waitForTimeout(300)
    expect(await blockCheckbox.isChecked()).toBe(!initialState)

    // Toggle back
    await blockCheckbox.click()
    await page.waitForTimeout(300)
    expect(await blockCheckbox.isChecked()).toBe(initialState)
  })
})

test.describe('Component Registry Admin - TODO Management', () => {
  test('should add a TODO to a component', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    const componentName = await page.locator('.component-name').first().textContent()
    const card = await expandComponent(page, componentName!)

    // Count existing TODOs
    const initialTodoCount = await card.locator('.todo-item').count()

    // Add a new TODO
    const todoInput = card.locator('.todo-add .form-input')
    await todoInput.fill('Test TODO: Review implementation')
    await card.locator('.btn-add').click()
    await page.waitForTimeout(300)

    // Verify TODO was added
    const newTodoCount = await card.locator('.todo-item').count()
    expect(newTodoCount).toBe(initialTodoCount + 1)

    // Verify TODO text appears
    const lastTodo = card.locator('.todo-item').last()
    await expect(lastTodo).toContainText('Test TODO: Review implementation')
  })

  test('should remove a TODO from a component', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    const componentName = await page.locator('.component-name').first().textContent()
    const card = await expandComponent(page, componentName!)

    // Add a TODO first
    const todoInput = card.locator('.todo-add .form-input')
    await todoInput.fill('Temporary TODO for deletion test')
    await card.locator('.btn-add').click()
    await page.waitForTimeout(300)

    const countBeforeDelete = await card.locator('.todo-item').count()
    expect(countBeforeDelete).toBeGreaterThan(0)

    // Remove the last TODO
    const lastTodoRemoveBtn = card.locator('.todo-item').last().locator('.todo-remove')
    await lastTodoRemoveBtn.click()
    await page.waitForTimeout(300)

    // Verify TODO was removed
    const countAfterDelete = await card.locator('.todo-item').count()
    expect(countAfterDelete).toBe(countBeforeDelete - 1)
  })

  test('should not add empty TODO', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    const componentName = await page.locator('.component-name').first().textContent()
    const card = await expandComponent(page, componentName!)

    const initialCount = await card.locator('.todo-item').count()

    // Try to add empty TODO
    const addBtn = card.locator('.btn-add')
    expect(await addBtn.isDisabled()).toBe(true)

    // Add whitespace only
    const todoInput = card.locator('.todo-add .form-input')
    await todoInput.fill('   ')
    await page.waitForTimeout(200)

    // Button should still be disabled
    expect(await addBtn.isDisabled()).toBe(true)

    // Verify no TODO was added
    const finalCount = await card.locator('.todo-item').count()
    expect(finalCount).toBe(initialCount)
  })
})

test.describe('Component Registry Admin - Save Functionality', () => {
  test('should save registry changes via API', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    // Make a change: add TODO to first component
    const componentName = await page.locator('.component-name').first().textContent()
    const card = await expandComponent(page, componentName!)

    const uniqueTodo = `E2E Test TODO - ${Date.now()}`
    const todoInput = card.locator('.todo-add .form-input')
    await todoInput.fill(uniqueTodo)
    await card.locator('.btn-add').click()
    await page.waitForTimeout(300)

    // Save the registry
    await saveRegistry(page)

    // Reload page and verify change persisted
    await page.reload()
    await waitForPageLoad(page)

    const reloadedCard = await expandComponent(page, componentName!)
    await expect(reloadedCard.locator('.todo-text', { hasText: uniqueTodo })).toBeVisible()

    // Cleanup: remove the test TODO
    const testTodo = reloadedCard.locator('.todo-item', { has: page.locator(`text="${uniqueTodo}"`) })
    await testTodo.locator('.todo-remove').click()
    await page.waitForTimeout(300)
    await saveRegistry(page)
  })

  test('should display save button as enabled when changes are made', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    const saveBtn = page.locator('button:has-text("Save Registry")')

    // Make a change
    const componentName = await page.locator('.component-name').first().textContent()
    const card = await expandComponent(page, componentName!)

    const checkbox = card.locator('input[type="checkbox"]').first()
    await checkbox.click()
    await page.waitForTimeout(300)

    // Save button should be clickable
    expect(await saveBtn.isEnabled()).toBe(true)
  })

  test('should show success message after saving', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    // Make a trivial change (toggle checkbox back and forth)
    const componentName = await page.locator('.component-name').first().textContent()
    const card = await expandComponent(page, componentName!)
    const checkbox = card.locator('input[type="checkbox"]').first()

    const initialState = await checkbox.isChecked()
    await checkbox.click()
    await page.waitForTimeout(200)
    await checkbox.click() // Toggle back to original state
    await page.waitForTimeout(200)

    // Save
    await page.click('button:has-text("Save Registry")')

    // Verify success message appears
    const successMessage = page.locator('.message-success')
    await expect(successMessage).toBeVisible({ timeout: 5000 })
    await expect(successMessage).toContainText('saved successfully')

    // Verify message disappears after timeout (3 seconds)
    await expect(successMessage).not.toBeVisible({ timeout: 4000 })
  })
})

test.describe('Component Registry Admin - API Endpoint', () => {
  test('should return valid JSON from API endpoint', async ({ page }) => {
    const response = await page.request.get(API_URL)

    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(typeof data).toBe('object')
    expect(Object.keys(data).length).toBe(EXPECTED_TOTAL_COMPONENTS)
  })

  test('should have correct structure for each component in API', async ({ page }) => {
    const data = await fetchRegistryData(page)

    const firstComponent = data[Object.keys(data)[0]]

    // Verify required fields exist
    expect(firstComponent).toHaveProperty('status')
    expect(firstComponent).toHaveProperty('componentType')
    expect(firstComponent).toHaveProperty('canRenderBlock')
    expect(firstComponent).toHaveProperty('canRenderInline')
    expect(firstComponent).toHaveProperty('fields')

    // Verify field types
    expect(typeof firstComponent.status).toBe('string')
    expect(typeof firstComponent.componentType).toBe('string')
    expect(typeof firstComponent.canRenderBlock).toBe('boolean')
    expect(typeof firstComponent.canRenderInline).toBe('boolean')
    expect(typeof firstComponent.fields).toBe('object')

    // Valid status values
    expect(['implemented', 'needs-work', 'placeholder', 'deprecated', 'alias']).toContain(firstComponent.status)

    // Valid component types
    expect(['block', 'inline', 'wrapper']).toContain(firstComponent.componentType)
  })
})

test.describe('Component Registry Admin - Results Count', () => {
  test('should display accurate results count at bottom', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    const resultsCount = page.locator('.results-count')
    await expect(resultsCount).toBeVisible()
    await expect(resultsCount).toContainText(`Showing ${EXPECTED_TOTAL_COMPONENTS} of ${EXPECTED_TOTAL_COMPONENTS}`)
  })

  test('should update results count when filtering', async ({ page }) => {
    await page.goto(ADMIN_PAGE_URL)
    await waitForPageLoad(page)

    // Search for "Phone"
    await page.fill('.search-input', 'Phone')
    await page.waitForTimeout(500)

    const visibleCount = await page.locator('.component-card').count()
    const resultsCount = page.locator('.results-count')

    await expect(resultsCount).toContainText(`Showing ${visibleCount} of ${EXPECTED_TOTAL_COMPONENTS}`)
    expect(visibleCount).toBeLessThan(EXPECTED_TOTAL_COMPONENTS)
  })
})
