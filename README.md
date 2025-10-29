# Create Quality Automation 🚀

Bootstrap quality automation in JavaScript/TypeScript and Python projects with comprehensive tooling. Features GitHub Actions, pre-commit hooks, lint-staged processing, security scanning, SEO validation, and multi-language support with smart project detection.

## ✨ Features

- **🔧 Prettier Code Formatting** - Consistent code style across your project
- **🪝 Husky Pre-commit Hooks** - Automatic quality checks before commits
- **⚡ Lint-staged Processing** - Only process changed files for speed
- **🤖 GitHub Actions** - Automated quality checks in CI/CD
- **📦 One Command Setup** - `npx create-quality-automation@latest`
- **🔄 TypeScript Smart** - Auto-detects and configures TypeScript projects
- **🐍 Python Support** - Complete Python toolchain with Black, Ruff, isort, mypy, pytest
- **🚢 Lighthouse CI** - SEO and performance checking with configurable thresholds
- **🆕 Modern Tooling** - ESLint 9 flat config, Husky 9, latest dependencies
- **🔒 Security Automation** - Blocking npm audit and hardcoded secrets scanning

## 🚀 Quick Start

### For Any Project (Recommended)

```bash
# Navigate to your project (must be a git repository)
cd your-project/

# Bootstrap quality automation
npx create-quality-automation@latest

# Install new dependencies
npm install

# Set up pre-commit hooks
npm run prepare
```

**That's it!** Your project now has comprehensive quality automation.

### Update Existing Setup

```bash
# Update to latest configurations
npx create-quality-automation@latest --update

# Install any new dependencies
npm install

# Verify everything works
npm run lint
```

### New Project from Scratch

```bash
# Create new project
mkdir my-awesome-project && cd my-awesome-project
git init
npm init -y

# Add quality automation
npx create-quality-automation@latest
npm install && npm run prepare

# Start coding with quality tools active!
echo "console.log('Hello, quality world!')" > index.js
git add . && git commit -m "feat: initial commit with quality tools"
```

## 📁 What Gets Added to Your Project

### All Projects (Base Configuration)

```
your-project/
├── .github/
│   └── workflows/
│       └── quality.yml          # GitHub Actions workflow
├── .editorconfig              # Editor defaults
├── .eslintignore              # ESLint ignore patterns
├── .nvmrc                     # Node version pinning
├── .npmrc                     # npm configuration (engine-strict)
├── .prettierrc               # Prettier configuration
├── .prettierignore            # Files to ignore in formatting
├── .stylelintrc.json          # Stylelint CSS/SCSS rules
├── .lighthouserc.js           # Lighthouse CI configuration (SEO/performance)
├── eslint.config.cjs          # ESLint flat config (JavaScript)
├── .husky/                     # Pre-commit hooks (created after npm run prepare)
└── package.json                # Updated with scripts and dependencies
```

### TypeScript Projects (additional files)

```
your-project/
├── eslint.config.ts.cjs       # ESLint flat config with TypeScript support
└── package.json                # Enhanced with TypeScript-aware lint-staged patterns
```

### Python Projects (additional files)

```
your-project/
├── .github/
│   └── workflows/
│       └── quality-python.yml   # Python-specific GitHub Actions
├── .pre-commit-config.yaml     # Python pre-commit hooks
├── pyproject.toml              # Python project configuration
├── requirements-dev.txt        # Python development dependencies
├── tests/
│   └── __init__.py             # Python test package marker
└── package.json                # Python helper scripts (for hybrid projects)
```

## ⚙️ Configuration

### Node Version

- This template pins Node to version 20 for local dev and CI.
- Tools included:
  - `.nvmrc` → auto-switch with `nvm use`
  - `package.json` → `engines.node ">=20"` and Volta pin for Node/npm
  - `.npmrc` → `engine-strict = true` to enforce engine checks

Conservative behavior:

- The setup script adds engines/Volta pins if they are missing, but does not overwrite your existing values.
- This avoids unexpectedly changing repos already pinned to another Node version.

### Prettier Configuration (`.prettierrc`)

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### Lint-staged Configuration (in `package.json`)

```json
{
  "lint-staged": {
    "package.json": ["prettier --write"],
    "**/*.{js,jsx,mjs,cjs,html}": ["eslint --fix", "prettier --write"],
    "**/*.{css,scss,sass,less,pcss}": ["stylelint --fix", "prettier --write"],
    "**/*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

If the setup script detects TypeScript (via a `typescript` dependency or a `tsconfig` file), the `**/*.{js,jsx,mjs,cjs,html}` pattern automatically expands to include `.ts` and `.tsx`.

The CLI scans your repository for existing CSS, Sass, Less, and PostCSS files so Stylelint targets only the directories you already use. If you have custom CSS globs in `lint-staged`, the setup script keeps them instead of overwriting them with broad defaults.

## 🔧 Customization

### Extending ESLint/Stylelint

- ESLint flat config lives in `eslint.config.cjs`. Adjust the exported array to tweak rules—for example, update the final rule block to warn on console usage:
  ```js
  // eslint.config.cjs
  module.exports = [
    /* ...existing entries... */
    {
      files: ['**/*.{js,jsx,mjs,cjs,html}'],
      rules: {
        // existing rules...
        'no-console': 'warn',
      },
    },
  ]
  ```
  When TypeScript is detected the script writes a variant with `@typescript-eslint`; customize the `files: ['**/*.{ts,tsx}']` block in the same way.
- Stylelint rules live in `.stylelintrc.json`; example to relax specificity:
  ```json
  {
    "extends": ["stylelint-config-standard"],
    "rules": { "no-descending-specificity": null }
  }
  ```

### Adding TypeScript Support

1. Add TypeScript to your project: `npm install --save-dev typescript`
2. Re-run the setup script (`npm run setup` or `node setup.js`) to enable `@typescript-eslint` linting and TypeScript-aware lint-staged patterns.
3. Update workflow to include type checking:
   ```yaml
   - name: TypeScript Check
     run: npx tsc --noEmit
   ```

### Python Project Configuration

The tool automatically detects Python projects and configures appropriate tooling:

**Detection criteria** (any of these):

- `.py` files in the project
- `pyproject.toml` file exists
- `requirements.txt` or `requirements-dev.txt` exists

**Python tools configured**:

- **Black** - Code formatting
- **Ruff** - Fast linting and import sorting
- **isort** - Import statement organization
- **mypy** - Static type checking
- **pytest** - Testing framework

**For Python-only projects**: Uses `.pre-commit-config.yaml` with Python hooks
**For hybrid JS/Python projects**: Adds Python patterns to lint-staged configuration

### Lighthouse CI Configuration

Lighthouse CI provides automated SEO and performance monitoring:

**Features configured**:

- **SEO Score Validation** - Minimum 90% SEO score requirement
- **Performance Budgets** - Core Web Vitals monitoring (FCP, LCP, CLS)
- **Accessibility Checks** - Color contrast, alt text, HTML structure
- **Best Practices** - Meta descriptions, canonical URLs, structured data

**Configuration** (`.lighthouserc.js`):

```javascript
// Performance thresholds
'categories:performance': ['warn', { minScore: 0.8 }]
'categories:seo': ['error', { minScore: 0.9 }]
'first-contentful-paint': ['warn', { maxNumericValue: 2000 }]
'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }]
```

**Usage**: Lighthouse CI runs automatically in GitHub Actions when `.lighthouserc.js` exists

### Security Automation Features

Comprehensive security scanning built into the workflow:

**Vulnerability Detection**:

- **npm audit** - Blocks deployment on high-severity vulnerabilities
- **Hardcoded secrets** - Scans for exposed passwords, API keys, tokens
- **XSS patterns** - Detects dangerous innerHTML, eval, document.write usage
- **Input validation** - Warns about unvalidated user inputs

**Security patterns checked**:

```bash
# XSS vulnerability patterns
innerHTML.*\${  # Template literal injection
eval\(.*\${     # Code injection via eval
onclick.*\${    # Event handler injection

# Secret detection patterns
password|secret|key|token.*[=:].*['"][^'"]{8,}  # Long credential values
-----BEGIN.*KEY-----                            # PEM private keys
```

### Adding Testing

- The template ships with an integration smoke test (`npm test`) that exercises `setup.js` end-to-end.
- Replace or extend `tests/setup.test.js` with your project’s preferred test runner (Jest, Vitest, Playwright, etc.).
- Keep the `test` script aligned with your chosen framework so CI executes the same checks.

## 📜 Available Scripts

After setup, your project will have these scripts:

### JavaScript/TypeScript

- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted (used in CI)
- `npm run prepare` - Set up Husky hooks (run after npm install)
- `npm run lint` / `npm run lint:fix` - ESLint flat config (auto-extending to TS) + Stylelint
- `npm run security:audit` - Check for security vulnerabilities
- `npm run security:secrets` - Scan for hardcoded secrets
- `npm run lighthouse:ci` - Run Lighthouse CI performance/SEO checks
- `npm test` - Runs the bootstrap regression test (customize per project)

### Python (added to hybrid projects)

- `npm run python:format` - Format Python code with Black
- `npm run python:lint` - Lint Python code with Ruff
- `npm run python:type-check` - Type check with mypy
- `npm run python:test` - Run Python tests with pytest

## 🤖 GitHub Actions Workflows

### Trigger Conditions

Both workflows run on:

- Push to `main`, `master`, or `develop` branches
- Pull requests to those branches

### JavaScript/TypeScript Workflow (`quality.yml`)

**Code Quality Steps**:

- ✅ **Node.js Setup** - Uses Node 20 with npm caching
- ✅ **Dependency Installation** - Smart npm ci/install detection
- ✅ **Prettier Check** - Enforces consistent formatting
- ✅ **ESLint** - JavaScript/TypeScript linting with zero warnings
- ✅ **Stylelint** - CSS/SCSS/Sass/Less/PostCSS validation

**Security Steps**:

- ✅ **Security Audit** - npm audit with high-severity blocking
- ✅ **Hardcoded Secrets Detection** - Pattern matching for exposed credentials
- ✅ **XSS Vulnerability Scanning** - innerHTML, eval, document.write patterns
- ✅ **Input Validation Analysis** - Unvalidated user input warnings

**Performance & SEO** (when configured):

- ✅ **Lighthouse CI** - Automated SEO score validation and Core Web Vitals

### Python Workflow (`quality-python.yml`)

**Code Quality Steps**:

- ✅ **Python Setup** - Uses Python 3.9+ with pip caching
- ✅ **Dependency Installation** - Installs from requirements-dev.txt
- ✅ **Black Formatting** - Code style enforcement
- ✅ **Ruff Linting** - Fast Python linting and import sorting
- ✅ **mypy Type Checking** - Static type validation
- ✅ **pytest Execution** - Test suite validation

**Security Steps**:

- ✅ **Python Security Patterns** - Python-specific vulnerability detection

## 🛠️ Troubleshooting

### "husky not found" Error

Run `npm run prepare` after installing dependencies.

### Prettier Conflicts with Other Formatters

Add conflicting formatters to `.prettierignore` or configure them to work together.

### GitHub Actions Not Running

Ensure your repository has Actions enabled in Settings > Actions.

### Vercel Runtime (Note)

- Prefer auto‑detection of Node from `package.json` `engines` when deploying to Vercel.
- Avoid hard‑coding a `runtime` value in `vercel.json` unless confirmed against current Vercel docs — incorrect values can break deploys.
- The template pins Node 20 for local/CI via `.nvmrc`, `engines`, and optional Volta; this is independent of Vercel’s runtime.

## 🔄 Updating

To update an existing project:

```bash
npx create-quality-automation@latest --update
npm install
```

The tool safely merges new configurations without overwriting your customizations.

## 🤝 Contributing

Want to improve this template?

1. Fork the repository
2. Make your changes
3. Test with a sample project
4. Submit a pull request

## 📄 License

MIT License - feel free to use in any project!

## 🙋‍♂️ Support

If you run into issues:

1. Check the troubleshooting section above
2. Review the GitHub Actions logs
3. Open an issue in this repository

---

**Made with ❤️ to make code quality effortless**
