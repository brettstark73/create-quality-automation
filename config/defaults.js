'use strict'

const defaultScripts = {
  format: 'prettier --write .',
  'format:check': 'prettier --check .',
  lint:
    'eslint . --ext .js,.jsx,.ts,.tsx,.html && stylelint "**/*.{css,scss}" --allow-empty-input',
  'lint:fix':
    'eslint . --ext .js,.jsx,.ts,.tsx,.html --fix && stylelint "**/*.{css,scss}" --fix --allow-empty-input'
}

const defaultDevDependencies = {
  husky: '^8.0.0',
  'lint-staged': '^15.0.0',
  prettier: '^3.0.0',
  eslint: '^8.57.0',
  stylelint: '^16.2.1',
  'stylelint-config-standard': '^36.0.0'
}

const defaultLintStaged = {
  'package.json': ['prettier --write'],
  '**/*.{js,jsx,ts,tsx,html}': ['eslint --fix', 'prettier --write'],
  '**/*.{css,scss}': ['stylelint --fix', 'prettier --write'],
  '**/*.{json,md,yml,yaml}': ['prettier --write']
}

module.exports = {
  defaultDevDependencies,
  defaultLintStaged,
  defaultScripts
}
