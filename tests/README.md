# Family Tree Testing Suite

## Overview

Comprehensive test suite for the Family Tree application's person creation and linking functionality.

## Test Structure

### E2E Tests (Playwright)

Located in `tests/e2e/`

#### Test Files
- `person-creation.spec.ts` - Basic person creation and linking tests
- `person-creation-refactored.spec.ts` - Advanced tests with utilities
- `test-utils.ts` - Reusable test utilities and helper functions

#### Key Test Scenarios

1. **Create New Person** - Verifies "Create" button behavior for new people
2. **Link Existing Person** - Verifies "Link" button behavior for existing people
3. **Complete Workflow** - Tests Create → Link → Link across multiple images
4. **Search Functionality** - Partial search, case insensitive, multiple matches
5. **Error Handling** - Invalid coordinates, network errors
6. **UI State Management** - Button states, input validation, cleanup

## Critical Test Features

### 🎯 **Proper Crop Selection**
Tests use accurate mouse coordinates instead of simple drag operations:
```typescript
// Get image bounding box
const imageBox = await mainImage.boundingBox();

// Calculate precise coordinates
const startX = imageBox.x + imageBox.width * 0.4;
const startY = imageBox.y + imageBox.height * 0.3;

// Create proper drag from point A to point B
await page.mouse.move(startX, startY);
await page.mouse.down();
await page.mouse.move(startX + 100, startY + 100);
await page.mouse.up();
```

### 🔍 **Button State Validation**
Core functionality being tested:
- **"Create" button** appears for new people (no search matches)
- **"Link" button** appears when existing person is selected
- **Button state changes** when switching between create/link modes

### 📡 **API Integration Testing**
Tests verify actual API calls:
- `POST /api/people` - Person creation (expects 201)
- `POST /api/people/link-to-image` - Person linking (expects 200)
- Proper error handling for failed requests

## Running Tests

### Prerequisites
1. Application running on `http://localhost:3000`
2. Database accessible and migrated
3. Test images available in `public/images/`

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test person-creation-refactored.spec.ts

# Run tests with debug
npx playwright test --debug
```

### Test Configuration

- **Browser:** Chromium (configured in `playwright.config.ts`)
- **Base URL:** `http://localhost:3000`
- **Timeout:** 30 seconds per test
- **Retries:** 2 retries on CI, 0 locally
- **Screenshots:** On failure
- **Traces:** On first retry

## Test Utilities

### `PersonTestUtils` Class

Provides reusable functions for common test operations:

```typescript
const personUtils = new PersonTestUtils(page);

// Enable crop mode
await personUtils.enableCropMode();

// Create crop selection
await personUtils.createCropSelection('center', 120);

// Create new person
await personUtils.createPerson('Test Person');

// Link existing person
await personUtils.linkExistingPerson('Search Term', 'Exact Person Name');

// Navigate between images
await personUtils.navigateToImage(2);

// Wait for UI cleanup
await personUtils.waitForUICleanup();
```

## Test Data Management

### Test Isolation
- Each test creates its own test data
- Tests don't depend on external database state
- Clean separation between test scenarios

### Test People Names
Tests use descriptive names to avoid conflicts:
- `"New Test Person"` - For creation tests
- `"Existing Test Person"` - For linking tests
- `"Workflow Test Person"` - For multi-step tests
- `"Button Test Person"` - For UI state tests

## Debugging Tests

### Visual Debugging
```bash
# Run with browser visible
npm run test:e2e:headed

# Run with Playwright Inspector
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Common Issues

1. **"Image not found"** - Ensure test images exist in `public/images/`
2. **"Timeout waiting for element"** - Check if app is running on correct port
3. **"Invalid coordinates"** - Verify crop selection logic generates valid bounds
4. **"API call failed"** - Check backend is running and database is accessible

### Test Screenshots

Failed tests automatically capture screenshots in `test-results/`

## Coverage Areas

### ✅ **Currently Tested**
- Person creation workflow
- Person linking workflow  
- Search functionality
- Button state management
- Coordinate validation
- API integration
- Error handling
- UI cleanup

### 🚧 **Future Test Areas**
- Visual bounding box verification
- Multiple people on same image
- Person deletion
- Cross-browser compatibility
- Mobile responsive behavior
- Performance under load
- Accessibility compliance

## Contributing

### Adding New Tests
1. Use `PersonTestUtils` for common operations
2. Follow naming convention: `"test-scenario-description"`
3. Include both positive and negative test cases
4. Add appropriate assertions for UI state
5. Verify API calls and responses

### Test Best Practices
- Use descriptive test names
- Group related tests in `test.describe()` blocks
- Use `test.step()` for complex test scenarios
- Await all async operations
- Add timeouts for flaky elements
- Clean up test data when possible

---

**Test Suite Version:** 1.0.0  
**Last Updated:** 2025-06-25  
**Compatible with:** Family Tree App v0.1.0