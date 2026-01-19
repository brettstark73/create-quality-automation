'use strict'

/**
 * GitHub Actions Cost Analyzer
 *
 * Analyzes GitHub Actions usage patterns and provides cost optimization recommendations.
 * Pro feature that helps developers avoid unexpected CI/CD bills.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const yaml = require('js-yaml')
const { showProgress } = require('../ui-helpers')

/**
 * Discover all GitHub Actions workflow files in the project
 * @param {string} projectPath - Root path of the project
 * @returns {{name: string, path: string}[]} Array of workflow files
 */
function discoverWorkflows(projectPath) {
  const workflowDir = path.join(projectPath, '.github', 'workflows')

  if (!fs.existsSync(workflowDir)) {
    return []
  }

  const files = fs.readdirSync(workflowDir)
  return files
    .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
    .map(file => ({
      name: file,
      path: path.join(workflowDir, file),
    }))
}

/**
 * Estimate workflow duration based on job steps
 * @param {object} workflow - Parsed YAML workflow object
 * @returns {number} Estimated duration in minutes
 */
function estimateWorkflowDuration(workflow) {
  if (!workflow.jobs) {
    return 0
  }

  let totalMinutes = 0

  for (const job of Object.values(workflow.jobs)) {
    // Default job duration estimate: 5 minutes
    let jobMinutes = 5

    if (job.steps && Array.isArray(job.steps)) {
      // Estimate based on known operations
      for (const step of job.steps) {
        // Check for expensive operations
        if (step.name) {
          const stepName = step.name.toLowerCase()

          // Known expensive operations
          if (stepName.includes('test') || stepName.includes('e2e')) {
            jobMinutes += 10 // Tests typically take longer
          } else if (
            stepName.includes('build') ||
            stepName.includes('compile')
          ) {
            jobMinutes += 5
          } else if (
            stepName.includes('deploy') ||
            stepName.includes('publish')
          ) {
            jobMinutes += 3
          } else if (
            stepName.includes('install') ||
            stepName.includes('setup')
          ) {
            jobMinutes += 2
          } else {
            jobMinutes += 1 // Generic step
          }
        } else {
          jobMinutes += 1 // Generic step without name
        }
      }

      // Cap individual job at reasonable limits
      jobMinutes = Math.min(jobMinutes, 60) // Max 60 min per job
    }

    // Check for matrix strategy (multiplies job runs)
    if (job.strategy && job.strategy.matrix) {
      const matrixSize = calculateMatrixSize(job.strategy.matrix)
      jobMinutes *= matrixSize
    }

    totalMinutes += jobMinutes
  }

  return Math.ceil(totalMinutes)
}

/**
 * Calculate the size of a GitHub Actions matrix strategy
 * @param {object} matrix - Matrix configuration
 * @returns {number} Number of matrix combinations
 */
function calculateMatrixSize(matrix) {
  let size = 1

  for (const values of Object.values(matrix)) {
    if (Array.isArray(values)) {
      size *= values.length
    }
  }

  return size
}

/**
 * Get commit frequency from git log
 * @param {string} projectPath - Root path of the project
 * @param {number} days - Number of days to analyze (default: 30)
 * @returns {{commitsPerDay: number, totalCommits: number}} Commit frequency stats
 */
function getCommitFrequency(projectPath, days = 30) {
  try {
    // Safe: No user input, hardcoded git command
    const gitLog = execSync('git log --oneline --since="30 days ago" --all', {
      cwd: projectPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
    }).trim()

    if (!gitLog) {
      return { commitsPerDay: 0, totalCommits: 0 }
    }

    const totalCommits = gitLog.split('\n').length
    const commitsPerDay = totalCommits / days

    return {
      commitsPerDay: Math.max(commitsPerDay, 0.5), // Min 0.5 commits/day
      totalCommits,
    }
  } catch (error) {
    // Not a git repo or no commits - use conservative default
    if (process.env.QAA_DEBUG || process.env.NODE_ENV === 'test') {
      console.log(`Debug: Could not detect git activity: ${error.message}`)
    }
    return { commitsPerDay: 1, totalCommits: 0 } // Assume 1 commit/day
  }
}

/**
 * Calculate monthly CI costs based on workflow usage
 * @param {Array} workflows - Array of workflow analysis results
 * @param {number} commitsPerDay - Average commits per day
 * @returns {object} Cost breakdown and recommendations
 */
function calculateMonthlyCosts(workflows, commitsPerDay) {
  const minutesPerWorkflow = workflows.reduce(
    (total, wf) => total + wf.estimatedDuration,
    0
  )
  const workflowRunsPerDay = commitsPerDay * workflows.length
  const minutesPerDay = minutesPerWorkflow * commitsPerDay
  const minutesPerMonth = Math.ceil(minutesPerDay * 30)

  // GitHub Actions pricing (as of 2024)
  const FREE_TIER_MINUTES = 2000 // Free tier monthly limit
  const TEAM_TIER_MINUTES = 3000 // Team tier monthly limit
  const COST_PER_MINUTE = 0.008 // $0.008/min for private repos

  const freeOverage = Math.max(0, minutesPerMonth - FREE_TIER_MINUTES)
  const teamOverage = Math.max(0, minutesPerMonth - TEAM_TIER_MINUTES)

  const freeOverageCost = freeOverage * COST_PER_MINUTE
  const teamOverageCost = teamOverage * COST_PER_MINUTE

  return {
    minutesPerMonth,
    minutesPerDay,
    workflowRunsPerDay,
    breakdown: workflows.map(wf => ({
      name: wf.name,
      minutesPerRun: wf.estimatedDuration,
      runsPerMonth: Math.ceil(commitsPerDay * 30),
      minutesPerMonth: Math.ceil(wf.estimatedDuration * commitsPerDay * 30),
    })),
    tiers: {
      free: {
        limit: FREE_TIER_MINUTES,
        overage: freeOverage,
        cost: freeOverageCost,
        withinLimit: minutesPerMonth <= FREE_TIER_MINUTES,
      },
      team: {
        limit: TEAM_TIER_MINUTES,
        overage: teamOverage,
        cost: teamOverageCost,
        withinLimit: minutesPerMonth <= TEAM_TIER_MINUTES,
        monthlyCost: 4, // $4/user/month
      },
    },
  }
}

/**
 * Analyze workflows for optimization opportunities
 * @param {Array} workflows - Array of parsed workflow objects
 * @param {number} commitsPerDay - Average commits per day
 * @returns {Array} Array of optimization recommendations
 */
function analyzeOptimizations(workflows, commitsPerDay) {
  const recommendations = []

  for (const wf of workflows) {
    const workflow = wf.parsed
    const workflowName = wf.name

    if (!workflow.jobs) continue

    // Check each job for optimization opportunities
    for (const [jobName, job] of Object.entries(workflow.jobs)) {
      // 1. Detect missing caching
      const hasSteps = job.steps && Array.isArray(job.steps)
      if (hasSteps) {
        const hasCaching = job.steps.some(
          step =>
            step.uses &&
            (step.uses.includes('actions/cache') ||
              step.uses.includes('actions/setup-node'))
        )
        const hasInstall = job.steps.some(
          step =>
            step.run &&
            (step.run.includes('npm install') ||
              step.run.includes('yarn install') ||
              step.run.includes('pnpm install') ||
              step.run.includes('pip install'))
        )

        if (hasInstall && !hasCaching) {
          // Estimate 2-5 min savings per run
          const savingsPerRun = 3
          const savingsPerMonth = Math.ceil(savingsPerRun * commitsPerDay * 30)

          recommendations.push({
            type: 'caching',
            workflow: workflowName,
            job: jobName,
            title: 'Add dependency caching',
            description: `Job "${jobName}" installs dependencies but doesn't cache them`,
            action: 'Add actions/cache before install step',
            potentialSavings: savingsPerMonth,
            savingsPerRun,
            priority: 'high',
          })
        }
      }

      // 2. Detect oversized matrix strategies
      if (job.strategy && job.strategy.matrix) {
        const matrixSize = calculateMatrixSize(job.strategy.matrix)
        if (matrixSize >= 6) {
          // Suggest reducing by 50%
          const currentMinutes = wf.estimatedDuration
          const reductionFactor = 0.5
          const savingsPerMonth = Math.ceil(
            currentMinutes * reductionFactor * commitsPerDay * 30
          )

          recommendations.push({
            type: 'matrix',
            workflow: workflowName,
            job: jobName,
            title: 'Reduce matrix size',
            description: `Job "${jobName}" runs ${matrixSize} matrix combinations`,
            action: `Consider testing only LTS + latest versions (reduce to ${Math.ceil(matrixSize / 2)} combinations)`,
            potentialSavings: savingsPerMonth,
            savingsPerRun: Math.ceil(currentMinutes * reductionFactor),
            priority: matrixSize >= 9 ? 'high' : 'medium',
          })
        }
      }
    }

    // 3. Detect high-frequency scheduled workflows
    if (workflow.on) {
      const triggers = Array.isArray(workflow.on) ? workflow.on : [workflow.on]
      const hasSchedule =
        triggers.includes('schedule') ||
        (typeof workflow.on === 'object' && workflow.on.schedule)

      if (hasSchedule && workflowName.includes('nightly')) {
        const currentRuns = 30 // Daily = 30 runs/month
        const proposedRuns = 4 // Weekly = 4 runs/month
        const savingsPerMonth = Math.ceil(
          wf.estimatedDuration * (currentRuns - proposedRuns)
        )

        recommendations.push({
          type: 'frequency',
          workflow: workflowName,
          title: 'Reduce schedule frequency',
          description: `"${workflowName}" runs nightly (30x/month)`,
          action: 'Change to weekly schedule (4x/month)',
          potentialSavings: savingsPerMonth,
          savingsPerRun: 0,
          priority: savingsPerMonth > 500 ? 'high' : 'medium',
        })
      }

      if (hasSchedule && workflowName.includes('weekly')) {
        const currentRuns = 4 // Weekly = 4 runs/month
        const proposedRuns = 1 // Monthly = 1 run/month
        const savingsPerMonth = Math.ceil(
          wf.estimatedDuration * (currentRuns - proposedRuns)
        )

        if (savingsPerMonth > 50) {
          recommendations.push({
            type: 'frequency',
            workflow: workflowName,
            title: 'Reduce schedule frequency',
            description: `"${workflowName}" runs weekly (4x/month)`,
            action: 'Change to monthly schedule (1x/month)',
            potentialSavings: savingsPerMonth,
            savingsPerRun: 0,
            priority: 'low',
          })
        }
      }
    }

    // 4. Detect missing path filters
    if (workflow.on && typeof workflow.on === 'object') {
      const hasPush = workflow.on.push || workflow.on.pull_request
      const hasPathFilter =
        (workflow.on.push && workflow.on.push.paths) ||
        (workflow.on.pull_request && workflow.on.pull_request.paths)

      if (hasPush && !hasPathFilter && !workflowName.includes('release')) {
        // Estimate 20% of commits are docs-only
        const wastedRuns = commitsPerDay * 0.2 * 30
        const savingsPerMonth = Math.ceil(wf.estimatedDuration * wastedRuns)

        if (savingsPerMonth > 50) {
          recommendations.push({
            type: 'conditional',
            workflow: workflowName,
            title: 'Add path filters',
            description: `"${workflowName}" runs on all commits`,
            action:
              'Skip CI for docs-only changes (paths-ignore: ["**/*.md", "docs/**"])',
            potentialSavings: savingsPerMonth,
            savingsPerRun: 0,
            priority: 'medium',
          })
        }
      }
    }
  }

  // Sort by potential savings (highest first)
  recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings)

  return recommendations
}

/**
 * Generate cost analysis report for terminal output
 * @param {object} analysis - Complete cost analysis results
 */
function generateReport(analysis) {
  const { workflows, costs, commitStats, optimizations } = analysis

  console.log('\n📊 GitHub Actions Usage Analysis')
  console.log('━'.repeat(50))

  // Repository info
  try {
    // Safe: No user input, hardcoded git command
    const remoteUrl = execSync('git remote get-url origin', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()
    const repoName = remoteUrl.split('/').pop().replace('.git', '')
    console.log(`Repository: ${repoName}`)
  } catch {
    console.log('Repository: (local)')
  }

  console.log('')

  // Usage summary
  console.log(
    `Estimated usage: ${costs.minutesPerMonth.toLocaleString()} min/month`
  )
  console.log(
    `  Commit frequency: ~${commitStats.commitsPerDay.toFixed(1)} commits/day`
  )
  console.log(`  Workflows detected: ${workflows.length}`)
  console.log('')

  // Workflow breakdown
  if (costs.breakdown.length > 0) {
    console.log('Workflow breakdown:')
    for (const wf of costs.breakdown) {
      console.log(`  ├─ ${wf.name}:`)
      console.log(`     • ~${wf.minutesPerRun} min/run`)
      console.log(
        `     • ~${wf.runsPerMonth} runs/month = ${wf.minutesPerMonth} min/month`
      )
    }
    console.log('')
  }

  // Cost analysis
  console.log('💰 Cost Analysis')

  // Free tier
  if (costs.tiers.free.withinLimit) {
    console.log(
      `Free tier (${costs.tiers.free.limit.toLocaleString()} min): ✅ WITHIN LIMIT`
    )
    const remaining = costs.tiers.free.limit - costs.minutesPerMonth
    console.log(`  Remaining: ${remaining.toLocaleString()} min/month`)
  } else {
    console.log(
      `Free tier (${costs.tiers.free.limit.toLocaleString()} min): ⚠️  EXCEEDED by ${costs.tiers.free.overage.toLocaleString()} min`
    )
    console.log(`Overage cost: $${costs.tiers.free.cost.toFixed(2)}/month`)
    console.log('')
    console.log('Alternative options:')

    // Team tier comparison
    if (costs.tiers.team.withinLimit) {
      console.log(
        `  Team plan ($${costs.tiers.team.monthlyCost}/user/month): ✅ Stays within ${costs.tiers.team.limit.toLocaleString()} min limit`
      )
      const savings = costs.tiers.free.cost - costs.tiers.team.monthlyCost
      if (savings > 0) {
        console.log(`    Saves $${savings.toFixed(2)}/month per user`)
      }
    } else {
      console.log(
        `  Team plan ($${costs.tiers.team.monthlyCost}/user/month): Still exceeds (${costs.tiers.team.overage.toLocaleString()} min overage)`
      )
      console.log(
        `    Total cost: $${(costs.tiers.team.monthlyCost + costs.tiers.team.cost).toFixed(2)}/month`
      )
    }

    // Self-hosted option
    console.log('  Self-hosted runners: $0/min (but VPS costs ~$5-20/month)')
  }

  console.log('')

  // Optimization recommendations
  if (optimizations && optimizations.length > 0) {
    console.log('💡 Optimization Recommendations')
    console.log('')

    const totalPotentialSavings = optimizations.reduce(
      (sum, rec) => sum + rec.potentialSavings,
      0
    )
    const totalSavingsCost = totalPotentialSavings * 0.008

    console.log(
      `Found ${optimizations.length} optimization opportunities (potential savings: ${totalPotentialSavings.toLocaleString()} min/month = $${totalSavingsCost.toFixed(2)}/month)`
    )
    console.log('')

    // Group by priority
    const highPriority = optimizations.filter(r => r.priority === 'high')
    const mediumPriority = optimizations.filter(r => r.priority === 'medium')
    const lowPriority = optimizations.filter(r => r.priority === 'low')

    if (highPriority.length > 0) {
      console.log('🔴 High Priority:')
      for (const rec of highPriority) {
        console.log(`  ├─ ${rec.title} (${rec.workflow})`)
        console.log(`     • ${rec.description}`)
        console.log(`     • Action: ${rec.action}`)
        console.log(
          `     • Savings: ${rec.potentialSavings.toLocaleString()} min/month ($${(rec.potentialSavings * 0.008).toFixed(2)}/month)`
        )
      }
      console.log('')
    }

    if (mediumPriority.length > 0) {
      console.log('🟡 Medium Priority:')
      for (const rec of mediumPriority) {
        console.log(`  ├─ ${rec.title} (${rec.workflow})`)
        console.log(`     • ${rec.description}`)
        console.log(`     • Action: ${rec.action}`)
        console.log(
          `     • Savings: ${rec.potentialSavings.toLocaleString()} min/month ($${(rec.potentialSavings * 0.008).toFixed(2)}/month)`
        )
      }
      console.log('')
    }

    if (lowPriority.length > 0) {
      console.log('🟢 Low Priority:')
      for (const rec of lowPriority) {
        console.log(`  ├─ ${rec.title} (${rec.workflow})`)
        console.log(`     • ${rec.description}`)
        console.log(`     • Action: ${rec.action}`)
        console.log(
          `     • Savings: ${rec.potentialSavings.toLocaleString()} min/month ($${(rec.potentialSavings * 0.008).toFixed(2)}/month)`
        )
      }
      console.log('')
    }
  } else {
    console.log(
      '✅ No optimization opportunities detected - workflows look good!'
    )
    console.log('')
  }

  console.log('━'.repeat(50))
  console.log('')
}

/**
 * Main handler for --analyze-ci command
 */
async function handleAnalyzeCi() {
  const projectPath = process.cwd()

  // Check if Pro feature (FREE tier for now during development)
  // TODO: Enable Pro gating after testing
  // const license = getLicenseInfo()
  // if (!hasFeature('ciCostAnalysis')) {
  //   showUpgradeMessage('GitHub Actions cost analysis')
  //   process.exit(1)
  // }

  const spinner = showProgress('Analyzing GitHub Actions workflows...')

  try {
    // Step 1: Discover workflows
    const workflowFiles = discoverWorkflows(projectPath)

    if (workflowFiles.length === 0) {
      spinner.fail('No GitHub Actions workflows found')
      console.log('\n❌ No .github/workflows directory or workflow files found')
      console.log(
        '   Run this command in a repository with GitHub Actions configured'
      )
      process.exit(1)
    }

    // Step 2: Parse and analyze workflows
    const workflows = []
    for (const wf of workflowFiles) {
      try {
        const content = fs.readFileSync(wf.path, 'utf8')
        const parsed = yaml.load(content)

        const estimatedDuration = estimateWorkflowDuration(parsed)
        workflows.push({
          name: wf.name,
          path: wf.path,
          estimatedDuration,
          parsed,
        })
      } catch (error) {
        console.warn(`⚠️  Could not parse ${wf.name}: ${error.message}`)
      }
    }

    // Step 3: Get commit frequency
    const commitStats = getCommitFrequency(projectPath)

    // Step 4: Calculate costs
    const costs = calculateMonthlyCosts(workflows, commitStats.commitsPerDay)

    // Step 5: Analyze optimization opportunities
    const optimizations = analyzeOptimizations(
      workflows,
      commitStats.commitsPerDay
    )

    spinner.succeed('Analysis complete')

    // Step 6: Generate report
    generateReport({
      workflows,
      costs,
      commitStats,
      optimizations,
    })

    process.exit(0)
  } catch (error) {
    spinner.fail('Analysis failed')
    console.error(`\n❌ Error: ${error.message}`)
    if (process.env.DEBUG) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

module.exports = {
  handleAnalyzeCi,
  discoverWorkflows,
  estimateWorkflowDuration,
  getCommitFrequency,
  calculateMonthlyCosts,
  analyzeOptimizations,
}
