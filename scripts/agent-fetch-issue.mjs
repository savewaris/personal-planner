#!/usr/bin/env node

/**
 * Universal GitHub Issue Fetcher & Agent Workspace Initializer
 * 
 * Fetches a GitHub issue by number, parses specifications, initializes a feature branch,
 * and sets up the execution context for an autonomous AI coding agent.
 * 
 * Usage:
 *   node scripts/agent-fetch-issue.mjs 42
 *   node scripts/agent-fetch-issue.mjs --issue 42
 *   node scripts/agent-fetch-issue.mjs --issue 42 --branch-prefix feat
 *   npm run agent:issue 42
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);

function getArg(flag, defaultValue = null) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return defaultValue;
}

// 1. Resolve Issue Number
let issueNumber = getArg('--issue');
if (!issueNumber) {
  const positional = args.find((a) => !a.startsWith('--') && !isNaN(parseInt(a, 10)));
  if (positional) {
    issueNumber = positional;
  }
}

if (!issueNumber) {
  console.error('❌ Error: Issue number not provided.');
  console.log('Usage: node scripts/agent-fetch-issue.mjs <issue_number>');
  console.log('       npm run agent:issue <issue_number>');
  process.exit(1);
}

// 2. Resolve Repository (owner/repo)
let targetRepo = getArg('--repo', process.env.GITHUB_REPO);
if (!targetRepo) {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (match) {
      targetRepo = `${match[1]}/${match[2].replace(/\.git$/, '')}`;
    }
  } catch (e) {
    // Ignore error
  }
}

if (!targetRepo) {
  console.error('❌ Error: Target GitHub repository could not be detected from git remote.');
  console.error('Please specify --repo <owner/repo> or set GITHUB_REPO environment variable.');
  process.exit(1);
}

// 3. Fetch Issue Data (gh CLI with REST API fallback)
let issueData = null;

// Try GitHub CLI first
try {
  const ghOutput = execSync(`gh issue view ${issueNumber} --repo ${targetRepo} --json number,title,body,labels,state,url,author`, {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  issueData = JSON.parse(ghOutput);
} catch (e) {
  // Fallback to fetch via GitHub API
}

if (!issueData) {
  let token = getArg('--token', process.env.GITHUB_TOKEN);
  if (!token) {
    try {
      const credOutput = execSync('git credential fill', {
        input: 'protocol=https\nhost=github.com\n',
        encoding: 'utf-8',
      });
      const match = credOutput.match(/password=(.+)/);
      if (match) {
        token = match[1].trim();
      }
    } catch (e) {
      // Ignore
    }
  }

  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'agent-fetch-issue',
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${targetRepo}/issues/${issueNumber}`, { headers });
    if (!res.ok) {
      console.error(`❌ GitHub API Error (${res.status}): ${res.statusText}`);
      process.exit(1);
    }
    const raw = await res.json();
    issueData = {
      number: raw.number,
      title: raw.title,
      body: raw.body || '',
      labels: (raw.labels || []).map((l) => (typeof l === 'string' ? l : l.name)),
      state: raw.state,
      url: raw.html_url,
      author: raw.user?.login || 'unknown',
    };
  } catch (err) {
    console.error('❌ Failed to fetch issue data:', err.message);
    process.exit(1);
  }
}

console.log(`\n======================================================`);
console.log(`🤖 AGENT ISSUE HANDOFF: #${issueData.number} - ${issueData.title}`);
console.log(`======================================================`);
console.log(`🔗 URL:     ${issueData.url}`);
console.log(`🏷️ Labels:  ${issueData.labels.join(', ') || 'none'}`);
console.log(`──────────────────────────────────────────────────────\n`);

// 4. Parse Sections from Issue Body
function parseSection(body, headers) {
  for (const h of headers) {
    const regex = new RegExp(`(?:###?\\s+.*${h}.*\\n)([\\s\\S]*?)(?=(?:\\n###?\\s+)|$)`, 'i');
    const match = body.match(regex);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  }
  return null;
}

const objective = parseSection(issueData.body, ['Objective', 'Description', 'Problem', 'Summary']) || issueData.title;
const targetFiles = parseSection(issueData.body, ['Target Files', 'Scope', 'Boundaries']) || 'Not explicitly specified in issue body';
const nonGoals = parseSection(issueData.body, ['Non-Goals', 'Invariants', 'Constraints']) || 'Standard quality and non-regression invariants';
const technicalRequirements = parseSection(issueData.body, ['Technical Requirements', 'Requirements', 'Implementation Details']) || issueData.body;
const verification = parseSection(issueData.body, ['Acceptance Criteria', 'Verification', 'Validation']) || '- [ ] TypeScript clean (`npx tsc --noEmit`)\n- [ ] Automated tests pass (`npm run test:ui`)\n- [ ] Production build succeeds (`npm run build`)';

// 5. Prepare .agents/ directory and current_issue.json
const projectRoot = process.cwd();
const agentsDir = join(projectRoot, '.agents');
if (!existsSync(agentsDir)) {
  mkdirSync(agentsDir, { recursive: true });
}

const executionContext = {
  issueNumber: issueData.number,
  title: issueData.title,
  url: issueData.url,
  labels: issueData.labels,
  fetchedAt: new Date().toISOString(),
  objective,
  targetFiles,
  nonGoals,
  technicalRequirements,
  verificationChecklist: verification,
};

writeFileSync(join(agentsDir, 'current_issue.json'), JSON.stringify(executionContext, null, 2), 'utf-8');
console.log('✅ Stored execution context in .agents/current_issue.json');

// 6. Update task.md for Real-Time Visibility
const taskMdPath = join(projectRoot, 'task.md');
const taskContent = `# Task: Issue #${issueData.number} — ${issueData.title}

**Issue Link:** [GitHub #${issueData.number}](${issueData.url})  
**Status:** In Progress  
**Started:** ${new Date().toISOString()}

## 🎯 Objective
${objective}

## 📁 Target Scope
${targetFiles}

## 📋 Technical Requirements
${technicalRequirements}

## ✅ Acceptance Criteria & Verification
${verification}
`;

writeFileSync(taskMdPath, taskContent, 'utf-8');
console.log('✅ Generated task.md with issue verification checklist');

// 7. Create or Checkout Feature Branch
const slug = issueData.title
  .toLowerCase()
  .replace(/\[[^\]]+\]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 35);

const branchName = `feat/issue-${issueData.number}-${slug}`;

try {
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  if (currentBranch !== branchName) {
    try {
      execSync(`git checkout -b ${branchName}`, { stdio: 'ignore' });
      console.log(`✅ Created and checked out new branch: ${branchName}`);
    } catch (e) {
      execSync(`git checkout ${branchName}`, { stdio: 'ignore' });
      console.log(`✅ Checked out existing branch: ${branchName}`);
    }
  } else {
    console.log(`ℹ️ Already on branch: ${branchName}`);
  }
} catch (e) {
  console.log(`⚠️ Git branch creation skipped: ${e.message}`);
}

// 8. Register in Agent State Ledger if script exists
const agentStateScript = join(projectRoot, 'scripts', 'agent-state.mjs');
if (existsSync(agentStateScript)) {
  try {
    execSync(`node scripts/agent-state.mjs --start ISSUE-${issueData.number}`, { stdio: 'ignore' });
    execSync(`node scripts/agent-state.mjs --step "Started autonomous execution of Issue #${issueData.number}: ${issueData.title.replace(/"/g, '')}"`, { stdio: 'ignore' });
    console.log(`✅ Updated .agents/state/action_ledger.json`);
  } catch (e) {
    // Ignore error
  }
}

console.log(`\n🚀 READY FOR AI AGENT EXECUTION!`);
console.log(`The AI agent can now read .agents/current_issue.json or task.md to execute this task.\n`);
