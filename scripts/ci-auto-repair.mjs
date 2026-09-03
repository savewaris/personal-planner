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
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
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

// ─── Utility: Discord notification ────────────────────────────────────────────
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

// ─── Step 2B: AI Root-Cause Diagnosis (Fallback) ─────────────────────────────
async function diagnoseWithAI(logs) {
  const prompt = `You are an expert CI/CD repair engineer. A GitHub Actions CI run has FAILED.
Analyze the logs below and provide:
1. ONE-LINE SUMMARY of the root cause
2. CATEGORY (one of: workflow_config | dependencies | typescript | lint | build | test | prisma | secrets | playwright | other)
3. EXACT FIX INSTRUCTIONS — describe precisely what file to change and how

CRITICAL RULES:
- Only suggest changes to SAFE FILES: .github/workflows/*, package.json, tsconfig.json, .eslintrc*, prisma/schema.prisma, next.config.*, vite.config.*, playwright.config.*, jest.config.*
- NEVER suggest changing src/ app/ pages/ components/ or any business logic
- If the fix requires a secret/env variable to be added to GitHub, list it
- Format your response as valid JSON with keys: summary, category, fixInstructions (array of objects with fields: file, action, content)

FAILING CI LOGS:
\`\`\`
${logs}
\`\`\`

Respond with only the JSON object, no markdown wrapping.`;

  console.log('\n🤖 Asking AI to diagnose root cause...');
  const queryAi = await getAiDispatcher();
  const raw = await queryAi(prompt, { temperature: 0.2 });
  
  let cleaned = (raw || '').trim();
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
  if (cleaned.includes('```')) {
    const codeFenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeFenceMatch) cleaned = codeFenceMatch[1].trim();
  }

  // Extract JSON
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn('⚠️ AI did not return valid JSON. Raw response:', raw.substring(0, 500));
    return null;
  }
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.warn('⚠️ JSON parse failed:', e.message);
    return null;
  }
}

// ─── Step 3: Apply the fix ─────────────────────────────────────────────────────
const SAFE_PATH_PATTERNS = [
  /^\.github\/workflows\//,
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
    if (!file) continue;

    // Safety gate: only touch approved files
    if (!isSafePath(file)) {
      console.warn(`🚫 [SAFETY] Skipping unsafe file: ${file} (not in safe repair scope)`);
      continue;
    }

    const absPath = path.resolve(process.cwd(), file);
    const dir = path.dirname(absPath);

    try {
      if (action === 'create' || action === 'overwrite') {
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(absPath, content || '', 'utf8');
        console.log(`  ✅ ${action.toUpperCase()}: ${file}`);
        anyFixed = true;
      } else if (action === 'patch' && existsSync(absPath)) {
        // AI provides patch as a find/replace in JSON: { find: "...", replace: "..." }
        if (fix.find && fix.replace !== undefined) {
          let src = readFileSync(absPath, 'utf8');
          if (src.includes(fix.find)) {
            src = src.replace(fix.find, fix.replace);
            writeFileSync(absPath, src, 'utf8');
            console.log(`  ✅ PATCH: ${file}`);
            anyFixed = true;
          } else {
            console.warn(`  ⚠️ Patch target not found in ${file}: "${fix.find.substring(0, 60)}"`);
          }
        }
      } else if (action === 'npm_install') {
        // Install missing package
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

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔧 ===== CI AUTO-REPAIR ENGINE STARTED =====');
  console.log(`   Repo:    ${REPO}`);
  console.log(`   Run ID:  ${RUN_ID}`);
  console.log(`   Branch:  ${BRANCH}`);

  // Pull failing logs
  const logs = await fetchFailingLogs();
  console.log(`\n📄 Got ${logs.length} chars of failing logs.`);

  // Step 2: First check central Second Brain Error Registry
  let diagnosis = await diagnoseFromSecondBrain(logs);

  // If no known signature matched, fall back to Multi-Provider AI battery
  if (!diagnosis) {
    console.log('\nℹ️ No Second Brain signature match found. Consulting Multi-Provider AI Battery...');
    diagnosis = await diagnoseWithAI(logs);
  } else {
    console.log('\n✨ Matched known issue in Second Brain! Applying deterministic remediation.');
  }

  if (!diagnosis) {
    await notifyDiscord(
      `⚠️ **CI Auto-Repair** in \`${REPO}\` — could not diagnose root cause for run #${RUN_ID}.\n` +
      `Manual inspection needed: https://github.com/${REPO}/actions/runs/${RUN_ID}`
    );
    process.exit(1);
  }

  console.log('\n📊 AI Diagnosis:');
  console.log(`   Summary:  ${diagnosis.summary}`);
  console.log(`   Category: ${diagnosis.category}`);
  console.log(`   Fixes:    ${diagnosis.fixInstructions?.length || 0} instructions`);

  await notifyDiscord(
    `🔧 **CI Auto-Repair Started** in \`${REPO}\`\n` +
    `📋 **Root Cause:** ${diagnosis.summary}\n` +
    `🗂️ **Category:** ${diagnosis.category}\n` +
    `🛠️ Applying ${diagnosis.fixInstructions?.length || 0} fixes automatically...`
  );

  // Apply fixes
  const fixed = await applyFix(diagnosis);
  if (!fixed) {
    await notifyDiscord(
      `⚠️ **CI Auto-Repair** in \`${REPO}\` — no safe fixes could be applied.\n` +
      `Category: \`${diagnosis.category}\`\n` +
      `This may require manual intervention: https://github.com/${REPO}/actions/runs/${RUN_ID}`
    );
    process.exit(1);
  }

  // Commit and push
  const pushed = await commitAndPush(diagnosis);
  if (pushed) {
    await notifyDiscord(
      `✅ **CI Auto-Repair Complete** in \`${REPO}\`\n` +
      `🩹 Fixed: ${diagnosis.summary}\n` +
      `🔄 Pushed to \`${BRANCH}\` — CI re-run triggered automatically.\n` +
      `If CI still fails, another repair cycle will begin (up to ${MAX_REPAIR_ATTEMPTS} attempts).`
    );
  }
}

main().catch(async (err) => {
  console.error('❌ CI Auto-Repair engine crashed:', err);
  await notifyDiscord(`❌ **CI Auto-Repair crashed** in \`${REPO}\`: ${err.message}`);
  process.exit(1);
});
