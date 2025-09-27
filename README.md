# Create Quality Automation 🚀

Bootstrap quality automation in any project with GitHub Actions, Husky pre-commit hooks, lint-staged, and Prettier formatting. Modern ESLint 9 flat config with automatic TypeScript support.

## ✨ Features

- **🔧 Prettier Code Formatting** - Consistent code style across your project
- **🪝 Husky Pre-commit Hooks** - Automatic quality checks before commits
- **⚡ Lint-staged Processing** - Only process changed files for speed
- **🤖 GitHub Actions** - Automated quality checks in CI/CD
- **📦 One Command Setup** - `npx create-quality-automation@latest`
- **🔄 TypeScript Smart** - Auto-detects and configures TypeScript projects
- **🆕 Modern Tooling** - ESLint 9 flat config, Husky 9, latest dependencies

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

```
your-project/
├── .github/
│   └── workflows/
│       └── quality.yml          # GitHub Actions workflow
├── .editorconfig              # Editor defaults
├── eslint.config.cjs          # ESLint flat config (JS)
├── .prettierrc               # Prettier configuration
├── .prettierignore            # Files to ignore in formatting
├── .husky/                     # Pre-commit hooks (created after setup)
└── package.json                # Updated with scripts and dependencies
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

### Adding Testing

- The template ships with an integration smoke test (`npm test`) that exercises `setup.js` end-to-end.
- Replace or extend `tests/setup.test.js` with your project’s preferred test runner (Jest, Vitest, Playwright, etc.).
- Keep the `test` script aligned with your chosen framework so CI executes the same checks.

## 📜 Available Scripts

After setup, your project will have these scripts:

- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted (used in CI)
- `npm run prepare` - Set up Husky hooks (run after npm install)
- `npm run lint` / `npm run lint:fix` - ESLint flat config (auto-extending to TS) + Stylelint
- `npm test` - Runs the bootstrap regression test (customize per project)

## 🤖 GitHub Actions Workflow

The workflow runs on:

- Push to `main`, `master`, or `develop` branches
- Pull requests to those branches

It performs:

- ✅ Prettier formatting check
- ✅ Linting (if configured)
- ✅ Testing (if configured)
- ✅ Security audit

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
