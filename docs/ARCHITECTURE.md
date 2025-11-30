# Architecture

## Overview

QA Architect is a CLI tool that bootstraps quality automation in JavaScript/TypeScript and Python projects.

## Core Components

```
create-qa-architect/
├── setup.js              # Main CLI entry point
├── lib/
│   ├── smart-strategy-generator.js    # Smart test strategy (Pro)
│   ├── dependency-monitoring-*.js     # Dependency monitoring
│   └── validation/                    # Validation utilities
├── templates/            # Project templates
│   ├── eslint.config.cjs
│   ├── .prettierrc
│   ├── .husky/
│   └── scripts/
└── config/               # Language-specific configs
    ├── pyproject.toml
    └── quality-python.yml
```

## Data Flow

1. **Detection Phase**: Detect project type (JS/TS/Python/mixed)
2. **Configuration Phase**: Generate appropriate configs
3. **Installation Phase**: Copy templates, update package.json
4. **Validation Phase**: Verify setup is complete

## Extension Points

- Custom templates via `--template` flag
- Language detection can be extended in `setup.js`
- New quality checks via template files

## Smart Test Strategy (Pro)

Risk-based pre-push validation that adapts to change context:

1. Calculate risk score (0-10) based on files changed
2. Select appropriate test tier (minimal → comprehensive)
3. Run tests with appropriate depth

## CLI Flags

- `--update` - Update existing setup
- `--deps` - Dependency monitoring only
- `--security-config` - Security validation
- `--check-maturity` - Project maturity report
- `--comprehensive` - Full validation suite

