/**
 * Interactive mode handler
 * Handles interactive mode flow and re-parsing of arguments
 */

'use strict'

/**
 * Handle interactive mode setup
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.args - Original command-line arguments
 * @param {Object} options.InteractivePrompt - InteractivePrompt class
 * @param {Function} options.runInteractiveFlow - Function to run interactive flow
 * @param {Function} options.parseArguments - Function to parse arguments
 * @returns {Promise<Object>} Re-parsed configuration after interactive selections
 */
async function handleInteractiveMode(options) {
  const { args, InteractivePrompt, runInteractiveFlow, parseArguments } =
    options

  const prompt = new InteractivePrompt()

  if (!prompt.isTTY()) {
    console.error(
      '❌ Interactive mode requires a TTY environment (interactive terminal).'
    )
    console.error('   For non-interactive use, please specify flags directly.')
    console.error('   Run with --help to see available options.\n')
    process.exit(1)
  }

  let interactiveFlags
  try {
    interactiveFlags = await runInteractiveFlow(prompt)
    console.log(
      `\n🚀 Running setup with options: ${interactiveFlags.join(' ')}\n`
    )
  } catch (error) {
    if (error.message.includes('cancelled')) {
      console.log('\n❌ Interactive mode cancelled\n')
      process.exit(0)
    }
    console.error(`❌ Interactive mode error: ${error.message}\n`)
    process.exit(1)
  }

  const originalFlags = args.filter(arg => arg !== '--interactive')
  const mergedFlags = [...originalFlags, ...interactiveFlags]

  const parsedConfig = parseArguments(mergedFlags)

  console.log('📋 Configuration after interactive selections applied\n')

  return parsedConfig
}

module.exports = { handleInteractiveMode }
