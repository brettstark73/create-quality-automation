/**
 * GitHub API Integration for QA Architect
 * Enables Dependabot alerts and security features via GitHub API
 */

const https = require('https')
const { execSync } = require('child_process')

/**
 * Get GitHub token from environment or gh CLI
 */
function getGitHubToken() {
  // Check environment variable first
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN
  }

  // Try to get from gh CLI
  try {
    const token = execSync('gh auth token', { encoding: 'utf8' }).trim()
    if (token) return token
  } catch {
    // gh CLI not available or not authenticated
  }

  return null
}

/**
 * Get repository info from git remote
 */
function getRepoInfo(projectPath = '.') {
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      cwd: projectPath,
      encoding: 'utf8',
    }).trim()

    // Parse GitHub URL (https or ssh format)
    const httpsMatch = remoteUrl.match(
      /github\.com[/:]([^/]+)\/([^/.]+)(\.git)?$/
    )
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Make GitHub API request
 */
function githubRequest(method, path, token, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'qa-architect',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }

    if (data) {
      options.headers['Content-Type'] = 'application/json'
    }

    const req = https.request(options, res => {
      let body = ''
      res.on('data', chunk => (body += chunk))
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null,
          })
        } else if (res.statusCode === 204) {
          resolve({ status: 204, data: null })
        } else {
          reject(
            new Error(
              `GitHub API error: ${res.statusCode} - ${body || res.statusMessage}`
            )
          )
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

/**
 * Check if Dependabot alerts are enabled
 */
async function checkDependabotStatus(owner, repo, token) {
  try {
    await githubRequest(
      'GET',
      `/repos/${owner}/${repo}/vulnerability-alerts`,
      token
    )
    return true // 204 means enabled
  } catch (error) {
    if (error.message.includes('404')) {
      return false // Not enabled
    }
    throw error
  }
}

/**
 * Enable Dependabot alerts for a repository
 */
async function enableDependabotAlerts(owner, repo, token) {
  try {
    await githubRequest(
      'PUT',
      `/repos/${owner}/${repo}/vulnerability-alerts`,
      token
    )
    return { success: true, message: 'Dependabot alerts enabled' }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

/**
 * Enable Dependabot security updates
 */
async function enableDependabotSecurityUpdates(owner, repo, token) {
  try {
    await githubRequest(
      'PUT',
      `/repos/${owner}/${repo}/automated-security-fixes`,
      token
    )
    return { success: true, message: 'Dependabot security updates enabled' }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

/**
 * Full setup: Enable all Dependabot features
 */
async function setupDependabot(projectPath = '.', options = {}) {
  const { verbose = false } = options
  const results = {
    success: false,
    repoInfo: null,
    alerts: null,
    securityUpdates: null,
    errors: [],
  }

  // Get token
  const token = getGitHubToken()
  if (!token) {
    results.errors.push(
      'No GitHub token found. Set GITHUB_TOKEN env var or run `gh auth login`'
    )
    return results
  }

  // Get repo info
  const repoInfo = getRepoInfo(projectPath)
  if (!repoInfo) {
    results.errors.push('Could not determine GitHub repository from git remote')
    return results
  }
  results.repoInfo = repoInfo

  if (verbose) {
    console.log(`📦 Repository: ${repoInfo.owner}/${repoInfo.repo}`)
  }

  // Check current status
  try {
    const isEnabled = await checkDependabotStatus(
      repoInfo.owner,
      repoInfo.repo,
      token
    )
    if (isEnabled) {
      if (verbose) console.log('✅ Dependabot alerts already enabled')
      results.alerts = { success: true, message: 'Already enabled' }
    } else {
      // Enable alerts
      results.alerts = await enableDependabotAlerts(
        repoInfo.owner,
        repoInfo.repo,
        token
      )
      if (verbose) {
        console.log(
          results.alerts.success
            ? '✅ Dependabot alerts enabled'
            : `❌ Failed to enable alerts: ${results.alerts.message}`
        )
      }
    }
  } catch (error) {
    results.errors.push(`Alerts check failed: ${error.message}`)
  }

  // Enable security updates
  try {
    results.securityUpdates = await enableDependabotSecurityUpdates(
      repoInfo.owner,
      repoInfo.repo,
      token
    )
    if (verbose) {
      console.log(
        results.securityUpdates.success
          ? '✅ Dependabot security updates enabled'
          : `⚠️ Security updates: ${results.securityUpdates.message}`
      )
    }
  } catch (error) {
    results.errors.push(`Security updates failed: ${error.message}`)
  }

  results.success = results.alerts?.success && results.errors.length === 0

  return results
}

module.exports = {
  getGitHubToken,
  getRepoInfo,
  checkDependabotStatus,
  enableDependabotAlerts,
  enableDependabotSecurityUpdates,
  setupDependabot,
}
