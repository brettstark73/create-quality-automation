# Create Quality Automation - Claude Code Configuration

This project uses Brett Stark's global Claude Code configuration with specific adaptations for quality automation tooling.

## Project Information
- **Package:** `create-quality-automation`
- **CLI Command:** `npx create-quality-automation@latest`
- **Purpose:** Bootstrap quality automation in any project via CLI

## Project-Specific Commands

### Linting & Quality Checks
- **Lint:** `npm run lint` - Run ESLint 9 flat config and Stylelint
- **Lint Fix:** `npm run lint:fix` - Auto-fix linting issues
- **Format:** `npm run format` - Format all files with Prettier
- **Format Check:** `npm run format:check` - Check formatting without changes
- **Test:** `npm run test` - Run setup integration tests

### Development Workflow
- **Setup:** `npm run setup` - Initialize quality automation in target project
- **Prepare:** `npm run prepare` - Initialize Husky hooks

## Quality Automation Features
- **ESLint 9 Flat Config** with automatic TypeScript support detection
- **Stylelint** for CSS/SCSS/Sass/Less/PostCSS linting
- **Prettier** for code formatting
- **Husky 9** pre-commit hooks
- **lint-staged** for staged file processing
- **GitHub Actions** workflows with quality checks

## Development Notes
- Always run `npm run lint` and `npm run format:check` before committing
- This is an npm package with CLI functionality - test with `npm run test`
- Setup script is conservative and merge-safe for existing projects
- Supports Node.js ≥20 with Volta configuration
- Package is published to npm as an unscoped CLI (`create-quality-automation`)

---
*Inherits all global preferences from Brett Stark's universal Claude Code configuration*
