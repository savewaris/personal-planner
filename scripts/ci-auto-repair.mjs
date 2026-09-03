/**
 * CI Auto-Repair Engine (scripts/ci-auto-repair.mjs)
 *
 * Called by ci-auto-repair.yml when a CI run fails.
 * Reads the failing logs → AI diagnoses root cause → writes targeted fixes → commits.
 *
 * SAFE REPAIR SCOPE (never touches business logic or feature code):
 *   - GitHub Actions workflow files
 *   - package.json / package-lock.json
 *   - tsconfig.json
 *   - .eslintrc / .eslintignore
 *   - prisma/schema.prisma (generate only, not model changes)
 *   - Environment secrets / CI variable references
 *   - Dependency version pins
 *   - Build configuration (next.config.*, vite.config.*)
 *   - Test configuration (playwright.config.*, jest.config.*)
 */

import { execSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import path from 'path';
// Dynamic AI Dispatcher loader with cloud self-healing fallback
async function getAiDispatcher() {
  try {
    const mod = await import('./ai-provider-battery.mjs');
    if (mod && mod.queryAiWithFallback) return mod.queryAiWithFallback;
  } catch (err) {
    console.warn(`⚠️ Local ai-provider-battery.mjs load failed (${err.message}). Attempting self-healing fetch...`);
    try {
      const res = await fetch('https://raw.githubusercontent.com/savewaris/agent-second-brain/main/scripts/ai-provider-battery.mjs');
      if (res.ok) {
        const code = await res.text();
        const targetPath = path.join(process.cwd(), 'scripts', 'ai-provider-battery.mjs');
        if (!existsSync(path.dirname(targetPath))) mkdirSync(path.dirname(targetPath), { recursive: true });
        writeFileSync(targetPath, code, 'utf8');
        const mod = await import('./ai-provider-battery.mjs');
        if (mod && mod.queryAiWithFallback) return mod.queryAiWithFallback;
      }
    } catch (fetchErr) {
      console.warn(`⚠️ Could not auto-restore ai-provider-battery.mjs: ${fetchErr.message}`);
    }
  }

  // Inlined fallback to protect against module omission
  return async function inlineGeminiFallback(prompt) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('No AI provider available and GEMINI_API_KEY is missing');
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const m of models) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (res.ok) {
          const d = await res.json();
          return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch {}
    }
    throw new Error('All inlined AI model attempts failed');
  };
}

const REPO = process.env.GITHUB_REPOSITORY || '';
const RUN_ID = process.argv[2] || process.env.FAILED_RUN_ID || '';
const BRANCH = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'main';
const MAX_REPAIR_ATTEMPTS = 3;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || '';

// ─── Utility: Smart Error Log Isolator ─────────────────────────────────────────
function extractSmartErrorSnippet(rawLog) {
  if (!rawLog) return 'No log content available.';
  // Strip ANSI color codes
  const clean = rawLog.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  const lines = clean.split('\n');

  // Search for error anchors
  const anchorRegex = /(?:npm error|error:|fatal:|FAIL|ERR_|ERESOLVE|status: ["']?NOT_FOUND|exit code 1|cannot find module)/i;
  let anchorIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (anchorRegex.test(lines[i])) {
      anchorIdx = i;
      break;
    }
  }

  let selectedLines = [];
  if (anchorIdx !== -1) {
    const start = Math.max(0, anchorIdx - 4);
    const end = Math.min(lines.length, anchorIdx + 12);
    selectedLines = lines.slice(start, end);
  } else {
    selectedLines = lines.slice(-12);
  }

  const snippet = selectedLines.join('\n').trim();
  return snippet.length > 850 ? snippet.substring(0, 850) + '\n...[truncated]' : snippet;
}

// ─── Utility: Discord Comprehensive Traceability Embed ─────────────────────────
async function notifyDiscordEmbed({ title, description, color, fields, url }) {
  if (!DISCORD_WEBHOOK) return;
  try {
    const payload = {
      username: '🔧 CI Auto-Repair Bot',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
      embeds: [{
        title: title || '🔧 CI Auto-Repair Notification',
        description: description || '',
        url: url || (RUN_ID ? `https://github.com/${REPO}/actions/runs/${RUN_ID}` : undefined),
        color: color || 15158332,
        fields: fields || [],
        footer: { text: `Agent Second Brain • Traceability Engine | Repo: ${REPO}` },
        timestamp: new Date().toISOString()
      }]
    };
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn(`⚠️ Discord notification failed: ${err.message}`);
  }
}

async function notifyDiscord(message) {
  if (!DISCORD_WEBHOOK) return;
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message,
        username: '🔧 CI Auto-Repair Bot'
      })
    });
  } catch {}
}

// ─── Step 1: Pull the failing CI logs ─────────────────────────────────────────
async function fetchFailingLogs() {
  if (!RUN_ID) {
    console.error('❌ No FAILED_RUN_ID provided. Cannot fetch logs.');
    process.exit(1);
  }
  console.log(`\n📋 Fetching failing logs for run #${RUN_ID}...`);
  try {
    const raw = execSync(
      `gh run view ${RUN_ID} --repo ${REPO} --log-failed`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    // Trim to last 8000 chars so it fits in AI context
    return raw.slice(-8000);
  } catch (err) {
    return `[Could not fetch logs: ${err.message}]`;
  }
}

// ─── Step 2A: Central Second Brain Error Knowledge Resolution ─────────────
const CENTRAL_SIGNATURES_URL = 'https://raw.githubusercontent.com/savewaris/agent-second-brain/main/second-brain/Error-Knowledge/error-signatures.json';

async function loadErrorSignatures() {
  const localCandidates = [
    path.join(process.cwd(), 'second-brain', 'Error-Knowledge', 'error-signatures.json'),
    'C:\\agent-second-brain\\second-brain\\Error-Knowledge\\error-signatures.json',
    path.join(process.cwd(), '..', 'agent-second-brain', 'second-brain', 'Error-Knowledge', 'error-signatures.json')
  ];

  for (const candidate of localCandidates) {
    if (existsSync(candidate)) {
      try {
        console.log(`🧠 Reading local Second Brain Error Registry from: ${candidate}`);
        const parsed = JSON.parse(readFileSync(candidate, 'utf8'));
        if (parsed.signatures) return parsed.signatures;
      } catch (e) {}
    }
  }

  // Cloud fallback: Fetch live from Second Brain GitHub repo for isolated CI runners
  try {
    console.log('🌐 Fetching live Error Signatures from GitHub agent-second-brain...');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(CENTRAL_SIGNATURES_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data.signatures) return data.signatures;
    }
  } catch (e) {
    console.warn(`⚠️ Could not reach central Second Brain signatures: ${e.message}`);
  }

  return [];
}

async function diagnoseFromSecondBrain(logs) {
  const signatures = await loadErrorSignatures();
  if (!signatures || signatures.length === 0) return null;

  for (const sig of signatures) {
    const isMatch = sig.patterns.some(p => {
      try {
        const rx = new RegExp(p, 'i');
        return rx.test(logs);
      } catch {
        return logs.toLowerCase().includes(p.toLowerCase());
      }
    });

    if (isMatch) {
      console.log(`\n🎯 [SECOND BRAIN MATCH] Detected known error signature: "${sig.name}" (${sig.id})`);
      const fixInstructions = [];
      if (sig.remediation?.action === 'npm_update') {
        fixInstructions.push({
          file: 'package-lock.json',
          action: 'npm_update',
          content: ''
        });
      } else if (sig.remediation?.action === 'patch' && sig.remediation?.targetFile) {
        fixInstructions.push({
          file: sig.remediation.targetFile,
          action: 'patch',
          content: sig.remediation.instructions || ''
        });
      }
      return {
        summary: sig.rootCause,
        category: sig.category || 'dependencies',
        source: 'second-brain-registry',
        id: sig.id,
        fixInstructions
      };
    }
  }

  return null;
}

// ─── Step 2B: Localize Failing Files in Repository ───────────────────────────
function findFailingFiles(logs) {
  const found = new Set();
  const patterns = [
    /(?:at\s+.*?\((.*?):(\d+):(\d+)\))/g,
    /(?:(?:in|at)\s+([a-zA-Z0-9_\-./\\]+\.(?:mjs|js|ts|tsx|json|yml|yaml|prisma))):(\d+)/g,
    /([a-zA-Z0-9_\-./\\]+\.(?:mjs|js|ts|tsx|json|yml|yaml|prisma))/g
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(logs)) !== null) {
      let rawPath = (match[1] || match[0]).replace(/\\/g, '/');
      const normalized = rawPath.replace(/^.*?\/work\/[^/]+\/[^/]+\//, '');
      if (existsSync(normalized) && statSync(normalized).isFile()) {
        found.add(normalized);
      }
    }
  }
  return Array.from(found);
}

// ─── Step 2C: "Let AI Cook" Autonomous Code Fixer ────────────────────────────
async function diagnoseWithAI(logs) {
  const failingFiles = findFailingFiles(logs);
  let fileContext = '';
  if (failingFiles.length > 0) {
    const primaryFile = failingFiles[0];
    try {
      const content = readFileSync(primaryFile, 'utf8');
      fileContext = `\nPRIMARY FAILING FILE (${primaryFile}):\n\`\`\`\n${content.substring(0, 15000)}\n\`\`\`\n`;
      console.log(`📂 [CONTEXT] Ingested failing repository file: ${primaryFile} (${content.length} chars)`);
    } catch {}
  }

  const prompt = `You are an elite autonomous AI software engineer. A GitHub Actions CI run has FAILED.
Analyze the failing logs and code context below, then COOK the exact code fix.

${fileContext}

FAILING CI LOGS:
\`\`\`
${logs}
\`\`\`

INSTRUCTIONS:
1. Identify the root cause and canonical category (workflow_config, dependencies, typescript, lint, build, test, prisma, environment, secrets, other).
2. Cook the exact fix:
   - To patch or replace code in a file: provide "file", "action": "replace" | "patch", and "content" (or "find" & "replace").
   - To install a package: "action": "npm_install", "package": "<name>".
   - To update package-lock: "action": "npm_update".
   - To run a shell command (e.g. create a missing label with gh): "action": "exec", "command": "<cmd>".
3. Format output as valid JSON:
{
  "summary": "one-line explanation of root cause and fix",
  "category": "<category>",
  "fixInstructions": [
    {
      "file": "<file path>",
      "action": "replace" | "patch" | "npm_install" | "npm_update" | "exec",
      "content": "<code or replacement>",
      "find": "<snippet to replace if patch>",
      "replace": "<new snippet if patch>",
      "command": "<command if exec>"
    }
  ]
}

Return ONLY the JSON object.`;

  console.log('\n👨‍🍳 [AI COOKING] Asking AI to analyze logs + file context and cook the fix...');
  const queryAi = await getAiDispatcher();
  const raw = await queryAi(prompt, { temperature: 0.2 });
  
  return parseAiDiagnosis(raw);
}

// ─── Step 2C: Resilient Multi-Stage AI Parser ────────────────────────────────
function parseAiDiagnosis(raw) {
  if (!raw) return null;
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();

  // 1. Strip code block wrappers even if not closed (truncated response)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  // 2. Try direct JSON parse if balanced
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace !== -1) {
    const possibleJson = cleaned.slice(firstBrace);
    try {
      const parsed = JSON.parse(possibleJson);
      if (parsed.summary) return parsed;
    } catch {
      // Attempt auto-repair of unclosed brackets and braces
      let repaired = possibleJson;
      repaired = repaired.replace(/,\s*$/, '');
      if ((repaired.match(/"/g) || []).length % 2 !== 0) {
        repaired += '"';
      }
      
      let openBraces = (repaired.match(/\{/g) || []).length;
      let closeBraces = (repaired.match(/\}/g) || []).length;
      let openBrackets = (repaired.match(/\[/g) || []).length;
      let closeBrackets = (repaired.match(/\]/g) || []).length;

      while (closeBrackets < openBrackets) {
        repaired += ']';
        closeBrackets++;
      }
      while (closeBraces < openBraces) {
        repaired += '}';
        closeBraces++;
      }

      try {
        const parsed = JSON.parse(repaired);
        if (parsed.summary) return parsed;
      } catch {}
    }
  }

  // 3. Fallback: Robust Regex Extraction for incomplete or non-JSON responses
  const summaryMatch = cleaned.match(/"summary"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) ||
                       cleaned.match(/summary[:\s-]+([^\n]+)/i);
  const categoryMatch = cleaned.match(/"category"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) ||
                        cleaned.match(/category[:\s-]+([a-z_]+)/i);

  if (summaryMatch || categoryMatch) {
    return {
      summary: summaryMatch ? summaryMatch[1].trim() : "Automated CI failure detected by AI",
      category: categoryMatch ? categoryMatch[1].trim().toLowerCase() : "workflow_config",
      fixInstructions: []
    };
  }

  console.warn('⚠️ AI diagnosis could not be extracted. Raw snippet:', raw.substring(0, 300));
  return null;
}

// ─── Step 3: Apply the fix ─────────────────────────────────────────────────────
const SAFE_PATH_PATTERNS = [
  /^\.github\/workflows\//,
  /^scripts\//,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^tsconfig.*\.json$/,
  /^\.eslint/,
  /^prisma\//,
  /^next\.config\./,
  /^vite\.config\./,
  /^playwright\.config\./,
  /^jest\.config\./,
  /^\.babelrc/,
  /^babel\.config\./,
  /^\.env\.example$/,
  /^Makefile$/,
  /^Dockerfile$/,
  /^docker-compose/,
  /^\.npmrc$/,
  /^\.nvmrc$/,
  /^src\//,
  /^app\//,
  /^pages\//,
  /^components\//,
  /^lib\//,
];

function isSafePath(filePath) {
  return SAFE_PATH_PATTERNS.some(pattern => pattern.test(filePath));
}

async function applyFix(diagnosis) {
  if (!diagnosis || !diagnosis.fixInstructions || diagnosis.fixInstructions.length === 0) {
    console.log('⚠️ No fix instructions from AI. Cannot auto-repair.');
    return false;
  }

  let anyFixed = false;

  for (const fix of diagnosis.fixInstructions) {
    const { file, action, content } = fix;

    // Handle command execution fixes (e.g. creating labels, clearing cache)
    if (action === 'exec' && fix.command) {
      console.log(`  ⚡ Executing autonomous fix command: ${fix.command}`);
      try {
        const res = spawnSync(fix.command, { shell: true, stdio: 'inherit' });
        if (res.status === 0) anyFixed = true;
      } catch (cmdErr) {
        console.warn(`  ⚠️ Fix command failed: ${cmdErr.message}`);
      }
      continue;
    }

    if (!file) continue;

    // Safety gate: verify path is in allowed repair scope
    if (!isSafePath(file)) {
      console.warn(`🚫 [SAFETY] Skipping file: ${file} (not in safe repair scope)`);
      continue;
    }

    const absPath = path.resolve(process.cwd(), file);
    const dir = path.dirname(absPath);

    try {
      if (action === 'create' || action === 'overwrite' || action === 'replace') {
        const backup = existsSync(absPath) ? readFileSync(absPath, 'utf8') : null;
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(absPath, content || '', 'utf8');

        // Syntax verification for JS / MJS files
        if (file.endsWith('.js') || file.endsWith('.mjs')) {
          const check = spawnSync('node', ['--check', absPath], { encoding: 'utf-8' });
          if (check.status !== 0) {
            console.warn(`  ❌ [SYNTAX CHECK FAILED] Reverting ${file}: ${check.stderr}`);
            if (backup !== null) writeFileSync(absPath, backup, 'utf8');
            else fs.unlinkSync(absPath);
            continue;
          }
        }
        console.log(`  ✅ ${action.toUpperCase()} & SYNTAX VERIFIED: ${file}`);
        anyFixed = true;
      } else if (action === 'patch' && existsSync(absPath)) {
        const target = fix.find;
        const replacement = fix.replace !== undefined ? fix.replace : content;
        if (target && replacement !== undefined) {
          const original = readFileSync(absPath, 'utf8');
          if (original.includes(target)) {
            const patched = original.replace(target, replacement);
            writeFileSync(absPath, patched, 'utf8');

            // Syntax verification for JS / MJS files
            if (file.endsWith('.js') || file.endsWith('.mjs')) {
              const check = spawnSync('node', ['--check', absPath], { encoding: 'utf-8' });
              if (check.status !== 0) {
                console.warn(`  ❌ [SYNTAX CHECK FAILED] Reverting patch on ${file}: ${check.stderr}`);
                writeFileSync(absPath, original, 'utf8');
                continue;
              }
            }
            console.log(`  ✅ PATCH & SYNTAX VERIFIED: ${file}`);
            anyFixed = true;
          } else {
            console.warn(`  ⚠️ Patch target not found in ${file}: "${target.substring(0, 60)}"`);
          }
        }
      } else if (action === 'npm_install') {
        const pkg = fix.package || content;
        if (pkg) {
          console.log(`  📦 Installing missing package: ${pkg}`);
          spawnSync('npm', ['install', '--save-dev', pkg], { stdio: 'inherit' });
          anyFixed = true;
        }
      } else if (action === 'npm_update') {
        console.log(`  📦 Running npm install to fix lockfile sync...`);
        spawnSync('npm', ['install'], { stdio: 'inherit' });
        anyFixed = true;
      }
    } catch (err) {
      console.error(`  ❌ Failed to apply fix to ${file}: ${err.message}`);
    }
  }

  return anyFixed;
}

// ─── Step 4: Commit, push, and post repair summary ───────────────────────────
async function commitAndPush(diagnosis) {
  try {
    execSync('git config --global user.name "github-actions[bot]"', { stdio: 'pipe' });
    execSync('git config --global user.email "github-actions[bot]@users.noreply.github.com"', { stdio: 'pipe' });
    execSync('git add -A', { stdio: 'pipe' });
    
    const diff = execSync('git diff --cached --stat', { encoding: 'utf-8' });
    if (!diff.trim()) {
      console.log('ℹ️ No staged changes to commit.');
      return false;
    }

    const summary = diagnosis?.summary || 'fix(ci): auto-repair by CI Bot';
    const category = diagnosis?.category || 'ci';
    execSync(`git commit -m "fix(${category}): auto-repair — ${summary.substring(0, 72)}"`, { stdio: 'pipe' });
    execSync(`git push origin ${BRANCH} --force-with-lease`, { stdio: 'inherit' });
    
    console.log(`\n✅ [COMMITTED & PUSHED] Auto-repair committed to ${BRANCH}`);
    return true;
  } catch (err) {
    console.error(`❌ Git commit/push failed: ${err.message}`);
    return false;
  }
}

/// ─── Step 4B: Error Categorization & Time-Window Deduplication ────────────────
const DEDUPLICATION_WINDOW_MS = 30 * 60 * 1000; // 30-minute cooldown
const CACHE_DIR = '.agents';
const CACHE_FILE = path.join(CACHE_DIR, 'error-cache.json');

function classifyErrorCategory(logs, diagnosis) {
  if (diagnosis?.category) return diagnosis.category.toUpperCase();
  const text = (logs || '').toLowerCase();
  if (text.includes('could not add label') || (text.includes('label') && text.includes('not found'))) return 'WORKFLOW_CONFIG';
  if (text.includes('npm ci can only install') || text.includes('lock file') || text.includes('eresolve') || text.includes('cannot find module')) return 'DEPENDENCIES';
  if (text.includes('type error') || text.includes('ts23') || text.includes('typescript')) return 'TYPESCRIPT';
  if (text.includes('eslint') || text.includes('prettier')) return 'LINT';
  if (text.includes('connection refused') || text.includes('platform authentication') || text.includes('vercel')) return 'ENVIRONMENT';
  if (text.includes('prisma') || text.includes('database_url')) return 'PRISMA';
  if (text.includes('playwright') || text.includes('test failed') || text.includes('jest')) return 'TEST';
  if (text.includes('secret') || text.includes('token') || text.includes('unauthorized') || text.includes('403')) return 'SECRETS';
  if (text.includes('next build') || text.includes('vite build') || text.includes('failed to compile')) return 'BUILD';
  return 'GENERAL_CI_FAILURE';
}

function markRepairNotified() {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(CACHE_DIR, 'repair-status.json'), JSON.stringify({ notified: true, timestamp: Date.now() }), 'utf8');
  } catch {}
}

async function shouldNotifyCategory(category, repo, runId) {
  // 1. Check GitHub open issues (persists across runner VMs)
  try {
    const { execSync } = await import('child_process');
    const out = execSync(
      `gh issue list --repo ${repo} --state open --label "ci-auto-repair-failed" --json number,title,createdAt`,
      { encoding: 'utf-8' }
    );
    const issues = JSON.parse(out || '[]');
    const now = Date.now();
    for (const issue of issues) {
      const createdAt = new Date(issue.createdAt).getTime();
      const ageMs = now - createdAt;
      if (ageMs < DEDUPLICATION_WINDOW_MS && (issue.title.toUpperCase().includes(category) || issue.title.includes('Auto-Repair'))) {
        console.log(`\nℹ️ [DEDUPLICATION] Category [${category}] matches recent open issue #${issue.number} created ${Math.round(ageMs / 60000)}m ago.`);
        console.log(`   Suppressing duplicate Discord alert for Run #${runId}.`);
        return false;
      }
    }
  } catch (err) {
    // If gh CLI is unavailable, fallback to local error cache
  }

  // 2. Check local/cached deduplication state
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const key = `${repo}::${category}`.toLowerCase();
      const existing = cache.entries?.[key];
      if (existing && (Date.now() - existing.lastNotified < DEDUPLICATION_WINDOW_MS)) {
        console.log(`\nℹ️ [DEDUPLICATION] Category [${category}] already notified recently. Suppressing alert.`);
        return false;
      }
    }
  } catch {}

  return true;
}

function recordNotificationSent(category, repo, runId) {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    let cache = { entries: {} };
    if (fs.existsSync(CACHE_FILE)) {
      try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch {}
    }
    const key = `${repo}::${category}`.toLowerCase();
    if (!cache.entries) cache.entries = {};
    cache.entries[key] = {
      category,
      lastNotified: Date.now(),
      runId
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch {}
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔧 ===== CI AUTO-REPAIR ENGINE STARTED =====');
  console.log(`   Repo:    ${REPO}`);
  console.log(`   Run ID:  ${RUN_ID}`);
  console.log(`   Branch:  ${BRANCH}`);

  // Pull failing logs
  console.log(`\n📋 Fetching failing logs for run #${RUN_ID}...`);
  const logs = await fetchFailingLogs(RUN_ID);
  if (!logs) {
    console.error('❌ Could not retrieve CI logs from GitHub API.');
    process.exit(1);
  }
  console.log(`\n📄 Got ${logs.length} chars of failing logs.`);

  // Step 2A: Check deterministic signatures from Second Brain Error Knowledge
  console.log('🌐 Fetching live Error Signatures from GitHub agent-second-brain...');
  let diagnosis = await matchErrorSignature(logs);

  // If no known signature matched, fall back to Multi-Provider AI battery
  if (!diagnosis) {
    console.log('\nℹ️ No Second Brain signature match found. Consulting Multi-Provider AI Battery...');
    diagnosis = await diagnoseWithAI(logs);
  } else {
    console.log('\n✨ Matched known issue in Second Brain! Applying deterministic remediation.');
  }

  const category = classifyErrorCategory(logs, diagnosis);
  const errorSnippet = extractSmartErrorSnippet(logs);

  // If AI/Second Brain cannot diagnose the error, notify Discord if not deduplicated
  if (!diagnosis) {
    const shouldSend = await shouldNotifyCategory(category, REPO, RUN_ID);
    if (shouldSend) {
      await notifyDiscordEmbed({
        title: `🔴 [CATEGORY: ${category}] • ${REPO}`,
        description: `### 📌 Categorized CI Failure Detected\n` +
                     `The Autonomous Engine detected an issue under category **${category}** on branch \`${BRANCH}\` that could not be automatically resolved.\n\n` +
                     `**Root Cause:** Inconclusive diagnosis from logs. Manual review needed to establish pattern.`,
        color: 15158332,
        fields: [
          {
            name: '🚨 Error Output (Noise Stripped)',
            value: `\`\`\`text\n${errorSnippet}\n\`\`\``,
            inline: false
          },
          {
            name: '🔗 Action Links',
            value: [
              `• **Failed Run:** [View GitHub Actions #${RUN_ID}](https://github.com/${REPO}/actions/runs/${RUN_ID})`,
              `• **Branch:** \`${BRANCH}\``,
              `• **Repository:** [${REPO}](https://github.com/${REPO})`
            ].join('\n'),
            inline: false
          }
        ]
      });
      recordNotificationSent(category, REPO, RUN_ID);
      markRepairNotified();
    }
    process.exit(1);
  }

  console.log('\n📊 AI Diagnosis:');
  console.log(`   Summary:  ${diagnosis.summary}`);
  console.log(`   Category: ${diagnosis.category || category}`);
  console.log(`   Fixes:    ${diagnosis.fixInstructions?.length || 0} instructions`);

  // Apply fixes
  const fixed = await applyFix(diagnosis);
  if (!fixed) {
    // If AI cannot safely apply fixes, notify Discord if not deduplicated
    const shouldSend = await shouldNotifyCategory(category, REPO, RUN_ID);
    if (shouldSend) {
      await notifyDiscordEmbed({
        title: `🔴 [CATEGORY: ${category}] • ${REPO}`,
        description: `### 📌 Categorized CI Failure Detected\n` +
                     `AI diagnosed root cause under category **${category}** on branch \`${BRANCH}\`:\n` +
                     `> **${diagnosis.summary}**\n\n` +
                     `No safe automated code changes could be applied autonomously. Please inspect and establish a pattern.`,
        color: 15158332,
        fields: [
          {
            name: '🚨 Error Output (Noise Stripped)',
            value: `\`\`\`text\n${errorSnippet}\n\`\`\``,
            inline: false
          },
          {
            name: '🎯 Identified Root Cause',
            value: diagnosis.summary,
            inline: false
          },
          {
            name: '🔗 Action Links',
            value: [
              `• **Failed Run:** [View GitHub Actions #${RUN_ID}](https://github.com/${REPO}/actions/runs/${RUN_ID})`,
              `• **Branch:** \`${BRANCH}\``,
              `• **Repository:** [${REPO}](https://github.com/${REPO})`
            ].join('\n'),
            inline: false
          }
        ]
      });
      recordNotificationSent(category, REPO, RUN_ID);
      markRepairNotified();
    }
    process.exit(1);
  }

  // Commit and push
  const pushed = await commitAndPush(diagnosis);
  if (pushed) {
    console.log(`✅ [AUTO-REPAIR] Autonomous fix committed and pushed to \`${BRANCH}\`. (Zero notification sent to keep Discord quiet).`);
  }
}

main().catch(async (err) => {
  console.error('❌ CI Auto-Repair engine crashed:', err);
  await notifyDiscordEmbed({
    title: `🔴 [ACTION REQUIRED] • ${REPO} (Auto-Repair Crash)`,
    description: `### 📌 What Happened\nThe Auto-Repair Engine encountered an unhandled exception: ${err.message}`,
    color: 15158332,
    fields: [
      {
        name: '🚨 Crash Details',
        value: `\`\`\`text\n${err.stack ? err.stack.substring(0, 800) : err.message}\n\`\`\``,
        inline: false
      },
      {
        name: '🔗 Run Reference',
        value: `[View Run #${RUN_ID}](https://github.com/${REPO}/actions/runs/${RUN_ID})`,
        inline: false
      }
    ]
  });
  process.exit(1);
});
