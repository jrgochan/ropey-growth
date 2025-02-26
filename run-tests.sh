#!/bin/bash

# This script runs the tests directly using Node.js
# It's a workaround for issues with npm test in WSL

echo "Running tests..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    echo "You can install it with: sudo apt install nodejs npm"
    exit 1
fi

# Check if the node_modules directory exists
if [ ! -d "node_modules" ]; then
    echo "node_modules directory not found. Installing dependencies..."
    npm install
fi

# Run the tests
echo "Running unit tests..."
node --experimental-vm-modules node_modules/vitest/vitest.mjs run tests/unit

echo "Tests completed."
