# Mycelial Growth Simulation Testing Framework

This directory contains the comprehensive testing framework for the Mycelial Growth Simulation project. The tests are built using Vitest, a modern testing framework compatible with Vite.

## Directory Structure

```
tests/
├── integration/    # Tests for multiple components working together
├── mocks/          # Mocks and test fixtures
├── performance/    # Performance and benchmark tests
├── snapshots/      # Visual regression test snapshots
├── unit/           # Unit tests for individual components
├── visual/         # Visual regression tests
├── README.md       # This file
└── setup.ts        # Global test setup and mocks
```

## Running Tests

You can run tests using the following npm scripts:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with the Vitest UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:visual
npm run test:performance
```

## Test Types

### Unit Tests

Located in `tests/unit/`, these tests focus on individual components in isolation. They ensure each component behaves as expected independently.

### Integration Tests

Located in `tests/integration/`, these tests verify that multiple components work together correctly, focusing on their interactions.

### Visual Regression Tests

Located in `tests/visual/`, these tests capture and compare snapshots of the canvas rendering to ensure visual consistency across code changes.

### Performance Tests

Located in `tests/performance/`, these tests measure the execution time of critical operations, ensuring the simulation remains performant.

## Writing New Tests

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { YourComponent } from '../../src/yourComponent';

describe('YourComponent', () => {
  it('should do something specific', () => {
    const component = new YourComponent();
    const result = component.doSomething();
    expect(result).toBe(expectedValue);
  });
});
```

### Visual Regression Tests

```typescript
import { describe, it, expect } from 'vitest';
import { VisualSnapshot } from '../visual/VisualSnapshot';
import { YourRenderer } from '../../src/yourRenderer';

describe('Visual Regression', () => {
  it('should render consistently', () => {
    const renderer = new YourRenderer();
    renderer.render();
    
    const snapshot = new VisualSnapshot(renderer.context, width, height);
    // Compare with baseline or store as new baseline
  });
});
```

## Mocks

Common mocks are provided in `tests/setup.ts` and include:

- Canvas and CanvasRenderingContext2D
- Window and requestAnimationFrame
- GPU.js objects

Additional mocks can be added to `tests/mocks/` as needed.

## Continuous Integration

Tests are automatically run on pull requests and pushes to the main branches using GitHub Actions. The workflow is defined in `.github/workflows/ci.yml`.