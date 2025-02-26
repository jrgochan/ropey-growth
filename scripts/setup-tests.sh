#!/bin/bash

# setup-tests.sh
# Creates the test directory structure and ensures needed dependencies are installed

set -e

# Create test directories
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/visual
mkdir -p tests/performance
mkdir -p tests/mocks

# Create directories for test artifacts
mkdir -p tests/snapshots
mkdir -p tests/reports

# Make sure we have the latest dependencies
npm install @vitest/coverage-v8 @vitest/ui jsdom --save-dev

# Copy setup file if it doesn't exist
if [ ! -f "tests/setup.ts" ]; then
  echo "Creating test setup file..."
  cat > tests/setup.ts << EOL
import { beforeEach, afterEach, vi } from 'vitest';

// Mock for canvas and GPU context
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string = '';
  strokeStyle: string = '';
  lineWidth: number = 1;
  shadowBlur: number = 0;
  shadowColor: string = '';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  beginPath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  fill() {}
  stroke() {}
  clearRect() {}
  fillRect() {}
  getImageData() { return { data: new Uint8ClampedArray(0) }; }
}

// Setup global mocks
beforeEach(() => {
  // Mock window
  global.window = {
    ...global.window,
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    requestAnimationFrame: vi.fn().mockImplementation((callback) => {
      return setTimeout(() => callback(Date.now()), 0);
    }),
    cancelAnimationFrame: vi.fn().mockImplementation((id) => {
      clearTimeout(id);
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  // Mock canvas
  global.HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType) => {
    if (contextType === '2d') {
      return new MockCanvasRenderingContext2D(global.HTMLCanvasElement.prototype as any);
    }
    return null;
  });
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
EOL
fi

# Create vitest config if it doesn't exist
if [ ! -f "vitest.config.ts" ]; then
  echo "Creating Vitest configuration file..."
  cat > vitest.config.ts << EOL
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['./tests/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', 'tests/', '**/*.d.ts'],
    },
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
EOL
fi

echo "Test setup complete. You can now run the tests with: npm test"