#!/usr/bin/env node

/**
 * Agent Doctor — Automated Health Check for AI Agent Repository Setup
 * Validates agent configuration, rules, skills, subagents, and stack integrity.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const AGENTS_DIR = path.join(ROOT_DIR, '.agents');
const RULES_DIR = path.join(AGENTS_DIR, 'rules');
const SKILLS_DIR = path.join(AGENTS_DIR, 'skills');

console.log('\n======================================================');
console.log('🩺 RUNNING AGENT DOCTOR HEALTH CHECK');
console.log('======================================================\n');

let passedChecks = 0;
let failedChecks = 0;

function check(label, condition, errorMessage) {
  if (condition) {
    console.log(`  ✅ [PASS] ${label}`);
    passedChecks++;
  } else {
    console.error(`  ❌ [FAIL] ${label}`);
    if (errorMessage) console.error(`     ↳ ${errorMessage}`);
    failedChecks++;
  }
}

// 1. Check Root Entrypoints
console.log('📂 1. Verifying Entrypoint Files...');
check('AGENTS.md exists at project root', existsSync(path.join(ROOT_DIR, 'AGENTS.md')));
check('.agents/subagents.json exists', existsSync(path.join(AGENTS_DIR, 'subagents.json')));

// 2. Check Subagents Configuration
console.log('\n🤖 2. Verifying Subagents Configuration...');
try {
  const subagentsRaw = readFileSync(path.join(AGENTS_DIR, 'subagents.json'), 'utf8');
  const subagentsData = JSON.parse(subagentsRaw);
  const count = subagentsData.subagents?.length || 0;
  check(`Loaded ${count} subagent definitions (expected >= 5)`, count >= 5);
} catch (err) {
  check('subagents.json is valid JSON', false, err.message);
}

// 3. Check Rules Directory
console.log('\n📜 3. Verifying Rule Files in .agents/rules/...');
if (existsSync(RULES_DIR)) {
  const rules = readdirSync(RULES_DIR).filter(f => f.endsWith('.md'));
  check(`Found ${rules.length} rule files in .agents/rules/`, rules.length >= 3);
  for (const rule of rules) {
    const rulePath = path.join(RULES_DIR, rule);
    check(`Rule: ${rule}`, readFileSync(rulePath, 'utf8').length > 50);
  }
} else {
  check('Rules directory exists', false, '.agents/rules not found');
}

// 4. Check State & Concurrency Tools
console.log('\n🔒 4. Verifying State & Concurrency Assets...');
check('Agent state manager (scripts/agent-state.mjs)', existsSync(path.join(ROOT_DIR, 'scripts', 'agent-state.mjs')));
check('State directory (.agents/state/)', existsSync(path.join(AGENTS_DIR, 'state')));

// 5. Database Schema (if Prisma exists)
if (existsSync(path.join(ROOT_DIR, 'prisma', 'schema.prisma'))) {
  console.log('\n🗄️ 5. Validating Prisma Database Schema...');
  try {
    const envVars = { ...process.env };
    const envPath = path.join(ROOT_DIR, '.env');
    if (existsSync(envPath)) {
      const lines = readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, ...v] = trimmed.split('=');
          const val = v.join('=').replace(/^["']|["']$/g, '');
          envVars[k.trim()] = val;
        }
      }
    }
    execSync('npx prisma validate', { stdio: 'pipe', env: envVars });
    check('Prisma schema validation (npx prisma validate)', true);
  } catch (err) {
    check('Prisma schema validation (npx prisma validate)', false, err.message);
  }
}

// 6. TypeScript Compilation Check (if tsconfig exists)
if (existsSync(path.join(ROOT_DIR, 'tsconfig.json'))) {
  console.log('\n🔍 6. Running TypeScript Compilation Check...');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    check('TypeScript check (npx tsc --noEmit: 0 errors)', true);
  } catch (err) {
    check('TypeScript check (npx tsc --noEmit: 0 errors)', false, err.message);
  }
}

// Summary
console.log('\n======================================================');
if (failedChecks === 0) {
  console.log(`🎉 ALL CHECKS PASSED (${passedChecks}/${passedChecks}) — AI AGENT SYSTEM FULLY OPERATIONAL!`);
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.error(`⚠️  ${failedChecks} CHECKS FAILED (${passedChecks} passed). Please address issues above.`);
  console.log('======================================================\n');
  process.exit(1);
}
