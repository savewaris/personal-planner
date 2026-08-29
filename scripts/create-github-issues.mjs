#!/usr/bin/env node

/**
 * Universal GitHub Issues Creator CLI
 * 
 * Reusable across ANY GitHub repository to bulk-publish issues from Markdown roadmap files.
 * 
 * Usage:
 *   node scripts/create-github-issues.mjs
 *   node scripts/create-github-issues.mjs --file docs/github_issues_roadmap.md
 *   node scripts/create-github-issues.mjs --repo owner/repo --file docs/custom_issues.md
 *   node scripts/create-github-issues.mjs --token <GITHUB_PAT>
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

// 1. Parse CLI arguments
const args = process.argv.slice(2);
function getArg(flag, defaultValue = null) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return defaultValue;
}

// 2. Resolve Repository (owner/repo)
let targetRepo = getArg('--repo', process.env.GITHUB_REPO);
if (!targetRepo) {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (match) {
      targetRepo = `${match[1]}/${match[2]}`;
    }
  } catch (e) {
    // Ignore error if not in git directory
  }
}

if (!targetRepo) {
  console.error('❌ Error: Target GitHub repository not specified and could not be detected from git remote.');
  console.error('Please specify --repo <owner/repo> or set GITHUB_REPO environment variable.');
  process.exit(1);
}

// 3. Resolve GitHub Authentication Token
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
    // Fallback
  }
}

if (!token) {
  console.error('❌ Error: GitHub token not found. Please provide GITHUB_TOKEN or authenticate git credentials.');
  process.exit(1);
}

// 4. Resolve Issues Markdown File
const filePath = resolve(process.cwd(), getArg('--file', 'docs/github_issues_roadmap.md'));
if (!existsSync(filePath)) {
  console.error(`❌ Error: Issues markdown file not found at: ${filePath}`);
  process.exit(1);
}

console.log(`🚀 Universal GitHub Issues Creator`);
console.log(`📁 Target Repository: https://github.com/${targetRepo}`);
console.log(`📄 Issues File:       ${filePath}`);
console.log(`────────────────────────────────────────────────────────────\n`);

// 5. Parse Markdown Issues
const content = readFileSync(filePath, 'utf-8');
const issueBlocks = content.split(/^## (?:📌 )?Issue (?:#\d+:? )?/m).slice(1);

if (issueBlocks.length === 0) {
  console.error('❌ Error: No issue blocks starting with "## Issue" found in file.');
  process.exit(1);
}

const parsedIssues = issueBlocks.map((block, idx) => {
  const lines = block.trim().split('\n');
  const titleLine = lines[0].trim();
  
  let labels = [];
  const labelLine = lines.find((l) => l.includes('**Labels:**') || l.includes('Labels:'));
  if (labelLine) {
    const rawMatches = labelLine.match(/`([^`]+)`/g);
    if (rawMatches) {
      labels = rawMatches.map((m) => m.replace(/`/g, '').trim());
    } else {
      const parts = labelLine.replace(/\*\*Labels:\*\*|\*Labels:\*|Labels:/i, '').split(',');
      labels = parts.map((p) => p.trim()).filter(Boolean);
    }
  }

  const body = lines.slice(1).join('\n').trim();

  return {
    index: idx + 1,
    title: titleLine,
    labels,
    body,
  };
});

console.log(`Found ${parsedIssues.length} issues to create:\n`);

// 6. Ensure Labels Exist on Repo
const LABEL_COLORS = {
  feature: '0e8a16',
  refactor: 'd93f0b',
  frontend: '1d76db',
  backend: '5319e7',
  database: 'bfd4f2',
  'ui/ux': 'f9d0c4',
  bug: 'd73a4a',
  enhancement: 'a2eeef',
};

async function ensureLabel(owner, repo, name) {
  const color = LABEL_COLORS[name.toLowerCase()] || '6f42c1';
  try {
    await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'universal-issues-creator',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, color }),
    });
  } catch (e) {
    // Label may already exist
  }
}

// 7. Bulk Create Issues
async function createIssues() {
  const [owner, repo] = targetRepo.split('/');
  const createdIssues = [];

  for (const issue of parsedIssues) {
    console.log(`Creating Issue #${issue.index}: "${issue.title}"...`);

    for (const lbl of issue.labels) {
      await ensureLabel(owner, repo, lbl);
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'universal-issues-creator',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: issue.title,
          body: issue.body,
          labels: issue.labels,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        console.error(`❌ Failed to create "${issue.title}":`, errJson.message || res.statusText);
        continue;
      }

      const result = await res.json();
      console.log(`   ✅ Created successfully: ${result.html_url}`);
      createdIssues.push({
        title: result.title,
        url: result.html_url,
        number: result.number,
      });
    } catch (err) {
      console.error(`❌ Error creating "${issue.title}":`, err.message);
    }
  }

  console.log(`\n────────────────────────────────────────────────────────────`);
  console.log(`🎉 Done! Created ${createdIssues.length}/${parsedIssues.length} live GitHub Issues on https://github.com/${targetRepo}/issues`);
  return createdIssues;
}

createIssues().catch((err) => {
  console.error('Fatal script error:', err);
  process.exit(1);
});
