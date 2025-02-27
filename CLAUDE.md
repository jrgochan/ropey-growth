# Ropey Growth Project - Development Guidelines

## Commands
- `npm run dev` - Run development server with Vite
- `npm run build` - Build production version
- `npm run lint` - Run ESLint on JS and TS files
- `npm run format` - Format with Prettier
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- Run single test: `npx vitest run -t "test name pattern"`

## Code Style
- **TypeScript**: Strict typing enabled, ES6 target, ES modules
- **Naming**: PascalCase for classes, camelCase for methods, PascalCase for interfaces
- **Imports**: ES modules with explicit extensions, use relative paths
- **Error Handling**: Use TypeScript strict null checks and optional chaining
- **Documentation**: JSDoc-style comments for classes and functions
- **Testing**: Files named `.test.ts`, use describe/it pattern with Vitest

## Project Structure
- `/src` - Source code (main.ts is entry point)
- `/tests` - Test files and test setup
- `/scripts` - Build and setup scripts

Always run `npm run lint` and `npm test` before committing changes.