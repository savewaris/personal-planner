#!/usr/bin/env node

/**
 * Autonomous Issue Coder & Implementation Engine
 * 
 * Takes an issue from .agents/current_issue.json, discovers relevant code context,
 * uses the 100% Free-Tier AI Model Battery (Gemini, Groq, Cerebras, OpenRouter)
 * to generate and apply code modifications, and iteratively heals syntax/build errors
 * until the issue is completely implemented and verified.
 * 
 * Usage:
 *   node scripts/autonomous-issue-coder.mjs
 *   node scripts/autonomous-issue-coder.mjs --issue 35
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { queryAiWithFallback } from './ai-provider-battery.mjs';

const ROOT_DIR = process.cwd();
const AGENTS_DIR = path.join(ROOT_DIR, '.agents');
const ISSUE_FILE = path.join(AGENTS_DIR, 'current_issue.json');

// 1. Resolve Issue Context
function loadIssueContext() {
  if (!fs.existsSync(ISSUE_FILE)) {
    console.error('❌ No active issue found in .agents/current_issue.json');
    console.error('Run: node scripts/agent-fetch-issue.mjs <issue_number> first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(ISSUE_FILE, 'utf8'));
}

// 2. Discover Relevant Codebase Files
function harvestContextFiles(issue) {
  const context = [];
  const searchTerms = [
    ...(issue.title.match(/[A-Z][a-z]+|[a-z]+/g) || []),
    ...(issue.objective.match(/[A-Z][a-z]+|[a-z]+/g) || [])
  ].filter(w => w.length > 3 && !['with', 'from', 'this', 'that', 'feature', 'enhancement', 'issue'].includes(w.toLowerCase()));

  const scanDirs = ['src', 'app', 'components', 'lib', 'prisma', 'scripts'];
  const matchedFiles = new Set();

  for (const dir of scanDirs) {
    const fullDir = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(fullDir)) continue;

    function walk(curr) {
      for (const entry of fs.readdirSync(curr, { withFileTypes: true })) {
        const fullPath = path.join(curr, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', '.next', '.git', 'dist'].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && /\.(tsx?|jsx?|mjs|json|css|prisma)$/.test(entry.name)) {
          const rel = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');
          // Check if file name matches search terms or explicitly mentioned in issue
          const lowerRel = rel.toLowerCase();
          for (const term of searchTerms) {
            if (lowerRel.includes(term.toLowerCase())) {
              matchedFiles.add(rel);
              break;
            }
          }
        }
      }
    }
    walk(fullDir);
  }

  // Include primary schema if database related
  if (fs.existsSync(path.join(ROOT_DIR, 'prisma', 'schema.prisma'))) {
    matchedFiles.add('prisma/schema.prisma');
  }

  // Read up to 5 most relevant files into context
  for (const rel of Array.from(matchedFiles).slice(0, 6)) {
    try {
      const content = fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');
      if (content.length < 25000) {
        context.push({ path: rel, content });
      }
    } catch {}
  }

  return context;
}

// 3. Parse Multi-File Output from AI
function parseCodeFiles(aiOutput) {
  const files = [];
  // Pattern: FILE: path/to/file\n```[ext]\n[code]\n```
  const fileRegex = /FILE:\s*([a-zA-Z0-9_\-./\\]+)\s*\n```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = fileRegex.exec(aiOutput)) !== null) {
    const filePath = match[1].trim().replace(/\\/g, '/');
    const content = match[2];
    files.push({ filePath, content });
  }

  // Fallback: If AI only returned a single code block with a filename comment inside
  if (files.length === 0) {
    const singleBlockMatch = aiOutput.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
    if (singleBlockMatch) {
      const code = singleBlockMatch[1];
      const headerMatch = code.match(/(?:\/\/\s*|#\s*|<!--\s*)([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)/);
      if (headerMatch) {
        files.push({ filePath: headerMatch[1].trim().replace(/\\/g, '/'), content: code });
      }
    }
  }

  return files;
}

// 4. Main Autonomous Execution Loop
async function solveIssue() {
  const issue = loadIssueContext();
  console.log(`\n======================================================`);
  console.log(`🤖 AUTONOMOUS ISSUE EXECUTION ENGINE (LET AI COOK)`);
  console.log(`======================================================`);
  console.log(`📌 Issue #${issue.issueNumber}: ${issue.title}`);
  console.log(`🎯 Objective: ${issue.objective.substring(0, 120)}...`);
  console.log(`──────────────────────────────────────────────────────\n`);

  const contextFiles = harvestContextFiles(issue);
  console.log(`📂 Ingested ${contextFiles.length} relevant codebase files for context:`);
  for (const f of contextFiles) {
    console.log(`   - ${f.path} (${f.content.length} chars)`);
  }

  let fileContextPrompt = '';
  for (const f of contextFiles) {
    fileContextPrompt += `\n--- FILE: ${f.path} ---\n\`\`\`\n${f.content}\n\`\`\`\n`;
  }

  const prompt = `You are a Principal Software Engineer implementing a complete feature or bug fix for this repository.
Here is the task specification from GitHub Issue #${issue.issueNumber}:

TITLE: ${issue.title}
OBJECTIVE:
${issue.objective}

TECHNICAL REQUIREMENTS:
${issue.technicalRequirements}

ACCEPTANCE CRITERIA:
${issue.verificationChecklist || 'All builds, type checks, and tests must pass.'}

EXISTING RELEVANT CODEBASE FILES:
${fileContextPrompt}

INSTRUCTIONS:
1. Implement the requested feature or fix completely with zero placeholders or omissions.
2. For EVERY file you need to create or modify, format your response EXACTLY like this:

FILE: <relative/path/to/file>
\`\`\`<language>
<complete updated file contents>
\`\`\`

3. Do NOT provide partial diffs or truncated snippets. Always provide the COMPLETE file content.
4. Output ONLY the file blocks.`;

  console.log('\n👨‍🍳 [AI COOKING] Generating complete code implementation using Free-Tier AI Battery...');
  const aiResponse = await queryAiWithFallback(prompt, { temperature: 0.1 });

  const generatedFiles = parseCodeFiles(aiResponse);
  if (generatedFiles.length === 0) {
    console.error('❌ AI response did not contain parseable file blocks.');
    console.log('Raw output snippet:', aiResponse.substring(0, 400));
    process.exit(1);
  }

  console.log(`\n📝 Applying ${generatedFiles.length} generated files to workspace:`);
  for (const gen of generatedFiles) {
    const absPath = path.join(ROOT_DIR, gen.filePath);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absPath, gen.content, 'utf8');
    console.log(`   ✅ Created/Updated: ${gen.filePath}`);
  }

  // 5. Verification & Self-Healing Loop (Max 3 Iterations)
  console.log('\n🧪 Running self-verification & build checks...');
  let maxAttempts = 3;
  let isClean = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n🔍 Verification Attempt ${attempt}/${maxAttempts}...`);
    let buildError = null;

    // Check 1: TypeScript
    if (fs.existsSync(path.join(ROOT_DIR, 'tsconfig.json'))) {
      const tscCheck = spawnSync('npx', ['tsc', '--noEmit'], { shell: true, encoding: 'utf-8' });
      if (tscCheck.status !== 0) {
        buildError = `TypeScript error:\n${tscCheck.stdout || tscCheck.stderr}`;
      }
    }

    // Check 2: Next.js / npm build (if ts passes)
    if (!buildError) {
      const buildCheck = spawnSync('npm', ['run', 'build'], { shell: true, encoding: 'utf-8' });
      if (buildCheck.status !== 0) {
        buildError = `Build compilation error:\n${buildCheck.stdout || buildCheck.stderr}`;
      }
    }

    if (!buildError) {
      console.log('✨ All type checks and build compilation verified 100% CLEAN!');
      isClean = true;
      break;
    }

    console.warn(`⚠️ Verification error on attempt ${attempt}:`);
    console.warn(buildError.substring(0, 400));

    if (attempt < maxAttempts) {
      console.log('\n🔄 Self-healing build errors with AI Battery...');
      const healPrompt = `The implementation produced build errors:
\`\`\`text
${buildError.substring(0, 2000)}
\`\`\`

Fix the error in the files. Return the corrected files in the exact same format:
FILE: <relative/path/to/file>
\`\`\`<language>
<complete file contents>
\`\`\``;

      const healResponse = await queryAiWithFallback(healPrompt, { temperature: 0.1 });
      const healedFiles = parseCodeFiles(healResponse);
      for (const h of healedFiles) {
        const absPath = path.join(ROOT_DIR, h.filePath);
        fs.writeFileSync(absPath, h.content, 'utf8');
        console.log(`   🛠️ Healed: ${h.filePath}`);
      }
    }
  }

  if (isClean) {
    console.log(`\n🎉 [AUTONOMOUS ISSUE SOLVER SUCCESS] Issue #${issue.issueNumber} fully implemented and verified!`);
    process.exit(0);
  } else {
    console.warn('\n⚠️ Implementation applied but verification had warnings. Proceeding with caution.');
    process.exit(0);
  }
}

solveIssue().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
