'use strict'

const { InteractivePrompt } = require('../lib/interactive/prompt')
const {
  generateQuestions,
  parseAnswers,
} = require('../lib/interactive/questions')

/**
 * Tests for interactive mode functionality
 */
async function testInteractiveMode() {
  console.log('🧪 Testing interactive mode...\n')

  // Test 1: TTY detection
  console.log('🔍 Testing TTY detection...')
  const prompt = new InteractivePrompt()

  // Should detect non-TTY environment
  const isTTY = prompt.isTTY()
  if (typeof isTTY !== 'boolean') {
    throw new Error('isTTY() should return a boolean')
  }
  console.log(`  ✅ TTY detection works (current: ${isTTY})`)

  // Test 2: Question generation
  console.log('🔍 Testing question generation...')
  const questions = generateQuestions()

  if (!Array.isArray(questions)) {
    throw new Error('generateQuestions() should return an array')
  }

  if (questions.length === 0) {
    throw new Error('Questions array should not be empty')
  }

  // Verify required questions exist
  const hasOperationMode = questions.some(q => q.name === 'operationMode')
  const hasDependencyMonitoring = questions.some(
    q => q.name === 'dependencyMonitoring'
  )
  const hasDryRun = questions.some(q => q.name === 'dryRun')
  const hasToolExclusions = questions.some(q => q.name === 'toolExclusions')

  if (
    !hasOperationMode ||
    !hasDependencyMonitoring ||
    !hasDryRun ||
    !hasToolExclusions
  ) {
    throw new Error('Missing required questions in generated set')
  }

  console.log('  ✅ Question generation works')

  // Test 3: Answer parsing - full setup with all defaults
  console.log('🔍 Testing answer parsing (full setup)...')
  const answersFullSetup = {
    operationMode: 'setup',
    dependencyMonitoring: true,
    dryRun: false,
    toolExclusions: [],
  }

  const flagsFullSetup = parseAnswers(answersFullSetup)

  if (!Array.isArray(flagsFullSetup)) {
    throw new Error('parseAnswers() should return an array of flags')
  }

  if (flagsFullSetup.includes('--deps') === false) {
    throw new Error('Expected --deps flag for dependency monitoring')
  }

  if (flagsFullSetup.includes('--dry-run')) {
    throw new Error('Should not include --dry-run when dryRun is false')
  }

  console.log('  ✅ Answer parsing works for full setup')

  // Test 4: Answer parsing - validation mode
  console.log('🔍 Testing answer parsing (validation mode)...')
  const answersValidation = {
    operationMode: 'validate',
    dependencyMonitoring: false,
    dryRun: true,
    toolExclusions: [],
  }

  const flagsValidation = parseAnswers(answersValidation)

  if (
    !flagsValidation.includes('--validate') &&
    !flagsValidation.includes('--comprehensive')
  ) {
    throw new Error(
      'Expected --validate or --comprehensive flag for validation mode'
    )
  }

  if (!flagsValidation.includes('--dry-run')) {
    throw new Error('Expected --dry-run flag when dryRun is true')
  }

  if (flagsValidation.includes('--deps')) {
    throw new Error(
      'Should not include --deps when dependency monitoring is false'
    )
  }

  console.log('  ✅ Answer parsing works for validation mode')

  // Test 5: Answer parsing - tool exclusions
  console.log('🔍 Testing answer parsing (tool exclusions)...')
  const answersWithExclusions = {
    operationMode: 'setup',
    dependencyMonitoring: false,
    dryRun: false,
    toolExclusions: ['npm-audit', 'gitleaks', 'markdownlint'],
  }

  const flagsWithExclusions = parseAnswers(answersWithExclusions)

  if (!flagsWithExclusions.includes('--no-npm-audit')) {
    throw new Error('Expected --no-npm-audit flag')
  }

  if (!flagsWithExclusions.includes('--no-gitleaks')) {
    throw new Error('Expected --no-gitleaks flag')
  }

  if (!flagsWithExclusions.includes('--no-markdownlint')) {
    throw new Error('Expected --no-markdownlint flag')
  }

  console.log('  ✅ Answer parsing works for tool exclusions')

  // Test 6: Answer parsing - update mode
  console.log('🔍 Testing answer parsing (update mode)...')
  const answersUpdate = {
    operationMode: 'update',
    dependencyMonitoring: false,
    dryRun: false,
    toolExclusions: [],
  }

  const flagsUpdate = parseAnswers(answersUpdate)

  if (!flagsUpdate.includes('--update')) {
    throw new Error('Expected --update flag for update mode')
  }

  console.log('  ✅ Answer parsing works for update mode')

  console.log('\n✅ All interactive mode tests passed!\n')
}

// Run tests if this file is executed directly
if (require.main === module) {
  testInteractiveMode().catch(error => {
    console.error('❌ Interactive mode tests failed:', error.message)
    process.exit(1)
  })
}

module.exports = { testInteractiveMode }
