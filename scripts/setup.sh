#!/bin/bash

set -e

# Set the project directory name and Node.js version
PROJECT_DIR="ropey-growth"
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
  IN_VENV=true
else
  IN_VENV=false
fi

# 1. Ensure NVM is installed and load it
print_message "Checking NVM installation..."
if [ -z "$NVM_DIR" ]; then
  export NVM_DIR="$HOME/.nvm"
fi

# Try to load NVM
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "NVM is not installed. Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
  
  # Source NVM directly after installation
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  
  # Check if NVM was successfully installed
  if ! command -v nvm &> /dev/null; then
    echo "Failed to install NVM. Please install it manually and run this script again."
    echo "Visit https://github.com/nvm-sh/nvm for installation instructions."
    exit 1
  fi
else
  # Source NVM
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
  
  # Verify NVM is available
  if ! command -v nvm &> /dev/null; then
    echo "NVM is installed but not available in the current shell. Trying to load it..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    if ! command -v nvm &> /dev/null; then
      echo "Failed to load NVM. Please ensure it's properly installed and try again."
      exit 1
    fi
  fi
fi

# 2. Install and use the specified Node.js version
print_message "Installing and using Node.js v${NODE_VERSION}..."
nvm install ${NODE_VERSION}
nvm use ${NODE_VERSION}

# Verify Node.js version
NODE_CURRENT=$(node -v)
print_message "Using Node.js ${NODE_CURRENT}"

# 3. Set up Python virtual environment
print_message "Setting up Python virtual environment..."
if [ "$IN_VENV" = false ]; then
  # Find Python 3
  if command -v python3 &> /dev/null; then
    PYTHON=$(which python3)
  elif command -v python &> /dev/null && python --version | grep -q "Python 3"; then
    PYTHON=$(which python)
  else
    echo "Python 3 is not installed. Please install Python 3 and try again."
    exit 1
  fi
  
  print_message "Using Python: $($PYTHON --version)"
  
  # Create virtual environment if it doesn't exist
  if [ ! -d "$VENV_DIR" ]; then
    print_message "Creating new virtual environment at $VENV_DIR..."
    $PYTHON -m venv "$VENV_DIR"
    if [ ! -d "$VENV_DIR" ]; then
      echo "Failed to create virtual environment. Please ensure 'venv' module is available."
      echo "You may need to install it with: sudo apt-get install python3-venv"
      exit 1
    fi
  else
    print_message "Virtual environment already exists at $VENV_DIR"
  fi
  
  # Activate the virtual environment
  print_message "Activating virtual environment..."
  source "$VENV_DIR/bin/activate"
  
  # Verify activation
  if [ -z "$VIRTUAL_ENV" ]; then
    echo "Failed to activate virtual environment. Please check your Python installation."
    exit 1
  fi
  
  print_message "Virtual environment activated: $VIRTUAL_ENV"
else
  print_message "Using existing virtual environment: $VIRTUAL_ENV"
fi

# 4. Upgrade pip and install Python dependencies
print_message "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# 5. Install system dependencies (only on Ubuntu/Debian)
if command -v apt-get &> /dev/null; then
  print_message "Installing system dependencies..."
  sudo apt-get install -y libxi-dev libx11-dev libxext-dev
else
  print_message "Skipping system dependencies (not on Ubuntu/Debian)"
  print_message "If you're on another system, please install the equivalent of: libxi-dev libx11-dev libxext-dev"
fi

# 6. Install Node.js dependencies
print_message "Installing Node.js dependencies..."
npm install

print_message "Setup complete! Python virtual environment and Node.js environment are ready."
print_message "- Node.js: ${NODE_CURRENT}"
print_message "- Python: $(python --version)"
print_message "- Virtual env: $VIRTUAL_ENV"

# Instructions for activating the environment in new terminals
print_message "\nTo activate this environment in a new terminal:"
print_message "1. For Node.js: nvm use ${NODE_VERSION}"
print_message "2. For Python: source ${VENV_DIR}/bin/activate"
