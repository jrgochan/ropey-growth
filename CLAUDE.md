# ROPEY-GROWTH GUIDELINES

## Build/Run Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run all tests
- `npm test -- -t "test name"` - Run specific test
- `npm test -- --watch` - Run tests in watch mode

## Code Style Guidelines
- **TypeScript**: Strict typing everywhere; avoid `any`
- **Imports**: Use `.js` extension even for TypeScript files
- **Formatting**: 2-space indentation, semicolons required
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Error Handling**: Proper error handling with descriptive messages
- **Functions**: Arrow functions for callbacks, regular functions for complex logic
- **Documentation**: JSDoc for public methods and complex logic
- **CSS**: Use CSS modules when styling components
- **Testing**: Use Vitest for unit testing

## Linting Rules
- No unused variables (except with _ prefix)
- Explicit equality checks (===) required
- Curly braces required for all control statements
- Console statements should be avoided in production code