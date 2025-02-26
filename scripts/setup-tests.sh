#!/bin/bash

# setup-tests.sh
# Creates the test directory structure and ensures needed dependencies are installed

set -e

# Set Node.js version to match main setup
NODE_VERSION="18"
VENV_DIR=".venv"

# Function to print messages in color
print_message() {
  local color="\033[1;34m" # Blue
  local reset="\033[0m"
  echo -e "${color}$1${reset}"
}

# Check if we're already in a virtual environment
if [ -n "$VIRTUAL_ENV" ]; then
  print_message "Already in a Python virtual environment: $VIRTUAL_ENV"
else
  # Activate the virtual environment if it exists
  if [ -d "$VENV_DIR" ]; then
    print_message "Activating Python virtual environment..."
    source "$VENV_DIR/bin/activate"
    print_message "Virtual environment activated: $VIRTUAL_ENV"
  else
    print_message "Warning: Python virtual environment not found at $VENV_DIR"
    print_message "Run ./scripts/setup.sh first to create the virtual environment"
  fi
fi

# Load NVM
print_message "Loading NVM..."
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # Source NVM
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
  
  # Verify NVM is available
  if command -v nvm &> /dev/null; then
    print_message "Using NVM to set Node.js version..."
    nvm use ${NODE_VERSION} || nvm install ${NODE_VERSION} && nvm use ${NODE_VERSION}
    NODE_CURRENT=$(node -v)
    print_message "Using Node.js ${NODE_CURRENT}"
  else
    print_message "Warning: NVM is installed but not available in the current shell"
    print_message "Continuing with system Node.js version"
  fi
else
  print_message "Warning: NVM not found. Using system Node.js version"
  print_message "Run ./scripts/setup.sh first to set up NVM"
fi

print_message "Setting up test environment..."

# Create test directories
print_message "Creating test directories..."
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/visual
mkdir -p tests/performance
mkdir -p tests/mocks

# Create directories for test artifacts
mkdir -p tests/snapshots
mkdir -p tests/reports

# Make sure we have the latest dependencies
print_message "Installing test dependencies..."
npm install @vitest/coverage-v8 @vitest/ui jsdom --save-dev

# Copy setup file if it doesn't exist
if [ ! -f "tests/setup.ts" ]; then
  print_message "Creating test setup file..."
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
  print_message "Creating Vitest configuration file..."
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

print_message "Test setup complete!"
print_message "- Node.js: $(node -v)"
if [ -n "$VIRTUAL_ENV" ]; then
  print_message "- Python: $(python --version)"
  print_message "- Virtual env: $VIRTUAL_ENV"
fi
print_message "\nYou can now run the tests with: npm test"
