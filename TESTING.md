# LSV Cafe Event Management System - Testing Guide

This document explains how to run tests, interpret results, and maintain test coverage for the LSV Cafe Event Management System.

## Table of Contents

1. [Backend Testing](#backend-testing)
2. [Frontend Testing](#frontend-testing)
3. [Test Coverage](#test-coverage)
4. [CI/CD Integration](#cicd-integration)
5. [Writing New Tests](#writing-new-tests)

## Backend Testing

### Prerequisites

```bash
cd backend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run only integration tests
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

### Test Structure

Backend tests are organized as follows:

```
backend/src/__tests__/
├── setupTests.ts          # Global test configuration
└── routes/
    ├── auth.test.ts       # Authentication endpoint tests
    └── events.test.ts     # Event CRUD and conflict tests
```

### What's Tested

#### Authentication (`auth.test.ts`)
- ✅ Successful login with valid credentials
- ✅ Login failure with wrong password
- ✅ Login failure with non-existent user
- ✅ Server error handling
- ✅ JWT token generation

#### Events (`events.test.ts`)
- ✅ Get all events
- ✅ Create new event
- ✅ Update event
- ✅ Delete event
- ✅ Conflict detection (location)
- ✅ Conflict detection (resources)
- ✅ Rejected events don't cause conflicts
- ✅ Database error handling

### Running Individual Test Suites

```bash
# Run only auth tests
npm test -- auth.test.ts

# Run only event tests
npm test -- events.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="conflict"
```

### Test Coverage Requirements

Minimum coverage thresholds (configured in `jest.config.js`):

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

View coverage report:

```bash
npm run test:coverage
open coverage/index.html  # Opens HTML coverage report
```

## Frontend Testing

### Prerequisites

```bash
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode (Vitest UI)
npm run test:ui
```

### Test Structure

```
src/__tests__/
├── setupTests.ts      # Test configuration
└── App.test.tsx       # Main application tests
```

### What Should Be Tested

#### Component Tests
- User interactions (clicks, form submissions)
- Conditional rendering
- State management
- Props validation

#### Integration Tests
- API calls and responses
- Authentication flow
- Event creation/editing flow
- Error handling

## Test Coverage

### Viewing Coverage Reports

After running `npm run test:coverage`:

```bash
# Backend
cd backend
open coverage/index.html

# Frontend
open coverage/index.html
```

Coverage reports show:
- **Line coverage**: % of code lines executed
- **Branch coverage**: % of conditional branches tested
- **Function coverage**: % of functions called
- **Statement coverage**: % of statements executed

### Coverage Goals

- **Critical paths**: 90%+ coverage (auth, event creation, conflict detection)
- **General code**: 70%+ coverage
- **UI components**: 60%+ coverage

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd backend
        npm ci
        
    - name: Run tests
      run: |
        cd backend
        npm run test:coverage
        
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        directory: ./backend/coverage

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
        
    - name: Run tests
      run: npm run test:coverage
```

### Pre-commit Hooks

Install Husky for pre-commit testing:

```bash
# Backend
cd backend
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "cd backend && npm test"

# Frontend
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test"
```

## Writing New Tests

### Backend Test Example

```typescript
// backend/src/__tests__/routes/example.test.ts
import request from 'supertest';
import express from 'express';
import exampleRoutes from '../../routes/exampleRoutes';
import prisma from '../../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/example', exampleRoutes);

describe('Example Routes', () => {
  describe('POST /api/example', () => {
    it('should create example successfully', async () => {
      // Mock database response
      (prisma.example.create as jest.Mock).mockResolvedValue({
        id: '123',
        name: 'Test',
      });

      const response = await request(app)
        .post('/api/example')
        .send({ name: 'Test' });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test');
    });
  });
});
```

### Frontend Test Example

```typescript
// src/__tests__/components/Example.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Example from '../components/Example';

describe('Example Component', () => {
  it('renders correctly', () => {
    render(<Example title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Example onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Best Practices

1. **Write tests first** (TDD) for critical features
2. **Test behavior, not implementation** - Focus on what the code does, not how
3. **Use descriptive test names** - Should read like documentation
4. **Keep tests isolated** - Each test should be independent
5. **Clean up after tests** - Use `afterEach` to reset mocks
6. **Test edge cases** - Empty inputs, null values, errors
7. **Mock external dependencies** - Database, APIs, file system
8. **Avoid testing third-party code** - Trust that libraries work

## Debugging Tests

### Run Single Test

```bash
# Backend
npm test -- --testNamePattern="should login successfully"

# Frontend
npm test -- -t "renders correctly"
```

### Debug with Node Inspector

```bash
# Backend
node --inspect-brk node_modules/.bin/jest --runInBand

# Then open chrome://inspect in Chrome
```

### View Test Output

```bash
# Verbose output
npm test -- --verbose

# Show console.log statements
npm test -- --silent=false
```

## Performance Testing

For load testing the API:

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test event listing endpoint
ab -n 1000 -c 50 http://localhost:3000/api/events

# Expected: >100 requests/sec, <200ms avg response time
```

## Troubleshooting

### Tests Fail Locally

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check Node.js version (should be 18+):
   ```bash
   node --version
   ```

3. Clear Jest cache:
   ```bash
   npx jest --clearCache
   ```

### Tests Pass Locally but Fail in CI

- Check Node.js version consistency
- Ensure all dependencies are in `package.json`
- Verify environment variables
- Check for time zone issues
- Look for file system path differences

---

**Testing Version**: 1.0  
**Last Updated**: 2025-12-10
