#!/bin/bash

set -e

# Set the project directory name
PROJECT_DIR="mycelial-growth-simulation"
NODE_VERSION="18"

# Function to print messages in color
print_message() {
  local color="\033[1;34m" # Blue
  local reset="\033[0m"
  echo -e "${color}$1${reset}"
}

# 1. Ensure NVM is installed and load it
print_message "Checking NVM installation..."
if [ -z "$NVM_DIR" ]; then
  export NVM_DIR="$HOME/.nvm"
fi
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "NVM is not installed. Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
  source "$NVM_DIR/nvm.sh"
else
  source "$NVM_DIR/nvm.sh"
fi

# 2. Install and use the latest LTS version of Node.js
print_message "Installing the latest LTS version of Node.js..."
nvm install --lts ${NODE_VERSION}
#nvm use --lts ${NODE_VERSION}
nvm use ${NODE_VERSION}

# 3. Set up Python virtual environment
print_message "Setting up Python virtual environment..."
PYTHON=$(which python3)
if [ -z "$PYTHON" ]; then
  echo "Python3 is not installed. Please install Python3 and try again."
  exit 1
fi

# Create and activate the virtual environment
VENV_DIR=".venv"
if [ ! -d "$VENV_DIR" ]; then
  $PYTHON -m venv "$VENV_DIR"
  echo "Virtual environment created at $VENV_DIR"
else
  echo "Virtual environment already exists at $VENV_DIR"
fi
source "$VENV_DIR/bin/activate"

# 4. Upgrade pip and install Python dependencies
print_message "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# 5. Install Node.js dependencies
print_message "Installing Node.js dependencies..."
npm i

print_message "Setup complete! Python virtual environment and Node.js environment are ready."

