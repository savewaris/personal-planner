#!/usr/bin/env node

/**
 * Agent State Manager — Multi-CLI Task Synchronizer & Real-Time Action Ledger
 * Reads, displays, and updates .agents/state/progress.json, SESSION_LOG.md, LIVE_STEP_LOG.md, and locks.json
 */

import { appendFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const STATE_DIR = path.join(ROOT_DIR, '.agents', 'state');
const STATE_FILE = path.join(STATE_DIR, 'progress.json');
const SESSION_LOG_FILE = path.join(STATE_DIR, 'SESSION_LOG.md');
const LIVE_STEP_LOG_FILE = path.join(STATE_DIR, 'LIVE_STEP_LOG.md');
const LOCKS_FILE = path.join(STATE_DIR, 'locks.json');

function ensureStateDir() {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
}

function loadState() {
  ensureStateDir();
  if (!existsSync(STATE_FILE)) {
    const defaultState = {
      currentMilestone: 'v1.0 — Initial Setup',
      activeTask: null,
      queue: [],
      completedTasks: [],
      lastDoctorCheck: { passed: true, totalChecks: 10 }
    };
    writeFileSync(STATE_FILE, JSON.stringify(defaultState, null, 2) + '\n', 'utf8');
    return defaultState;
  }
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch (err) {
    console.error('❌ Error parsing progress.json:', err.message);
    process.exit(1);
  }
}

function saveState(state) {
  ensureStateDir();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function loadLocks() {
  ensureStateDir();
  if (!existsSync(LOCKS_FILE)) {
    return { version: '1.0', activeLocks: [] };
  }
  try {
    return JSON.parse(readFileSync(LOCKS_FILE, 'utf8'));
  } catch {
    return { version: '1.0', activeLocks: [] };
  }
}

function saveLocks(locks) {
  ensureStateDir();
  writeFileSync(LOCKS_FILE, JSON.stringify(locks, null, 2) + '\n', 'utf8');
}

function ensureLogFiles() {
  ensureStateDir();
  if (!existsSync(SESSION_LOG_FILE)) {
    writeFileSync(SESSION_LOG_FILE, `# Agent Session Handover Ledger\n\n`, 'utf8');
  }
  if (!existsSync(LIVE_STEP_LOG_FILE)) {
    writeFileSync(LIVE_STEP_LOG_FILE, `# Real-Time Agent Action Ledger\n\n> Live chronological log of micro-actions performed by active agents.\n\n`, 'utf8');
  }
  if (!existsSync(LOCKS_FILE)) {
    saveLocks({ version: '1.0', activeLocks: [] });
  }
}

function logLiveStep(status, description) {
  ensureLogFiles();
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const state = loadState();
  const activeTaskId = state.activeTask?.id || 'GENERAL';
  const assigned = (state.activeTask?.assignedAgents || ['agent']).join('+');
  
  let icon = '🟡';
  let tag = '[IN_PROGRESS]';
  if (status === 'DONE') {
    icon = '🟢';
    tag = '[DONE]       ';
  } else if (status === 'FAILED') {
    icon = '🔴';
    tag = '[FAILED]     ';
  } else if (status === 'LOCK') {
    icon = '🔒';
    tag = '[LOCKED]     ';
  } else if (status === 'UNLOCK') {
    icon = '🔓';
    tag = '[UNLOCKED]   ';
  }

  const logLine = `- ${icon} **${tag}** \`${timestamp}\` | \`${assigned}\` | **${activeTaskId}**: ${description}\n`;
  appendFileSync(LIVE_STEP_LOG_FILE, logLine, 'utf8');
  console.log(`\n${icon} [LIVE LOGGED] ${tag} ${description}\n`);
}

function logSessionCheckpoint(summary) {
  ensureLogFiles();
  const timestamp = new Date().toISOString().slice(0, 10);
  const state = loadState();
  
  const checkpointEntry = `\n## Session Checkpoint: ${timestamp}
- **Active Milestone**: \`${state.currentMilestone}\`
- **Active Task**: \`${state.activeTask ? state.activeTask.id + ' — ' + state.activeTask.title : 'None (Queue Ready)'}\`
- **Summary / Key Handoff Notes**:
  - ${summary}
- **Queue Status**: ${state.queue.length} tasks remaining in queue.
- **Recent Completed**: ${(state.completedTasks || []).slice(-3).map(t => t.id).join(', ') || 'None'}
`;
  appendFileSync(SESSION_LOG_FILE, checkpointEntry, 'utf8');
  console.log(`\n📌 [CHECKPOINT SAVED] Recorded session handover to .agents/state/SESSION_LOG.md\n`);
}

const args = process.argv.slice(2);

// Handle CLI flags
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  npm run agent:state                                # Display active dashboard, locks & live steps
  npm run agent:state -- --start <ID>                # Start task (e.g. ISSUE-1)
  npm run agent:state -- --done <ID>                 # Complete task (e.g. ISSUE-1)
  npm run agent:state -- --add <Title>               # Append new task to queue
  npm run agent:state -- --step "<Description>"      # Log in-progress micro-step
  npm run agent:state -- --step-done "<Description>" # Log completed micro-step
  npm run agent:state -- --step-fail "<Description>" # Log failed micro-step
  npm run agent:state -- --checkpoint "<Summary>"    # Save session handover checkpoint
  npm run agent:state -- --lock <files...>           # Acquire lock on files (optional: --reason, --by)
  npm run agent:state -- --unlock <files...>         # Release file locks
  npm run agent:state -- --locks                     # List all active file locks
`);
  process.exit(0);
}

ensureLogFiles();
const state = loadState();
const locksData = loadLocks();

// Lock Management Commands
if (args.includes('--lock')) {
  const lockIndex = args.indexOf('--lock');
  let rawFiles = [];
  let reason = 'Modifying file';
  let lockedBy = state.activeTask?.id || 'CLI-Session';
  let agent = (state.activeTask?.assignedAgents || ['developer']).join('+');

  for (let i = lockIndex + 1; i < args.length; i++) {
    if (args[i] === '--reason' && args[i + 1]) {
      reason = args[i + 1];
      i++;
    } else if (args[i] === '--by' && args[i + 1]) {
      lockedBy = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      rawFiles.push(args[i]);
    }
  }

  if (rawFiles.length === 0) {
    console.error('❌ Please specify at least one file path to lock.');
    process.exit(1);
  }

  const acquired = [];
  const blocked = [];

  for (const file of rawFiles) {
    const existing = locksData.activeLocks.find(l => l.file.toLowerCase() === file.toLowerCase());
    if (existing && existing.lockedBy !== lockedBy) {
      blocked.push({ file, lockedBy: existing.lockedBy, reason: existing.reason });
    } else {
      if (!existing) {
        locksData.activeLocks.push({
          file,
          lockedBy,
          agent,
          reason,
          acquiredAt: new Date().toISOString()
        });
      }
      acquired.push(file);
    }
  }

  saveLocks(locksData);

  if (acquired.length > 0) {
    logLiveStep('LOCK', `Acquired lock on ${acquired.join(', ')} (${reason})`);
    console.log(`🔒 [LOCK ACQUIRED] ${acquired.join(', ')} (Owner: ${lockedBy})`);
  }

  if (blocked.length > 0) {
    console.error(`⚠️  [LOCK BLOCKED] The following files are locked by another session:`);
    for (const b of blocked) {
      console.error(`   ↳ ${b.file} is locked by ${b.lockedBy} ("${b.reason}")`);
    }
  }
  process.exit(0);
}

if (args.includes('--unlock')) {
  const unlockIndex = args.indexOf('--unlock');
  let rawFiles = [];
  for (let i = unlockIndex + 1; i < args.length; i++) {
    if (!args[i].startsWith('--')) rawFiles.push(args[i]);
  }

  if (rawFiles.length === 0) {
    const currentOwner = state.activeTask?.id || 'CLI-Session';
    locksData.activeLocks = locksData.activeLocks.filter(l => l.lockedBy !== currentOwner);
    saveLocks(locksData);
    logLiveStep('UNLOCK', `Released all locks for owner ${currentOwner}`);
    console.log(`🔓 [UNLOCKED ALL] Cleared locks owned by ${currentOwner}`);
    process.exit(0);
  }

  const released = [];
  for (const file of rawFiles) {
    const initialLen = locksData.activeLocks.length;
    locksData.activeLocks = locksData.activeLocks.filter(l => l.file.toLowerCase() !== file.toLowerCase());
    if (locksData.activeLocks.length < initialLen) released.push(file);
  }

  saveLocks(locksData);
  if (released.length > 0) {
    logLiveStep('UNLOCK', `Released locks on ${released.join(', ')}`);
    console.log(`🔓 [UNLOCKED] Released locks on ${released.join(', ')}`);
  } else {
    console.log(`ℹ️  No matching active locks found for ${rawFiles.join(', ')}`);
  }
  process.exit(0);
}

if (args.includes('--locks')) {
  console.log('\n======================================================');
  console.log('🔒 CURRENT ACTIVE FILE LOCKS (.agents/state/locks.json)');
  console.log('======================================================');
  if (locksData.activeLocks && locksData.activeLocks.length > 0) {
    for (const l of locksData.activeLocks) {
      console.log(`  🔒 ${l.file.padEnd(35)} Owner: ${l.lockedBy} (${l.agent}) | "${l.reason}"`);
    }
  } else {
    console.log('  (No active file locks — all files free for editing)');
  }
  console.log('======================================================\n');
  process.exit(0);
}

if (args.includes('--step')) {
  const desc = args.slice(args.indexOf('--step') + 1).join(' ');
  if (!desc) {
    console.error('❌ Please specify step description');
    process.exit(1);
  }
  logLiveStep('IN_PROGRESS', desc);
  process.exit(0);
}

if (args.includes('--step-done')) {
  const desc = args.slice(args.indexOf('--step-done') + 1).join(' ');
  if (!desc) {
    console.error('❌ Please specify step description');
    process.exit(1);
  }
  logLiveStep('DONE', desc);
  process.exit(0);
}

if (args.includes('--step-fail')) {
  const desc = args.slice(args.indexOf('--step-fail') + 1).join(' ');
  if (!desc) {
    console.error('❌ Please specify error description');
    process.exit(1);
  }
  logLiveStep('FAILED', desc);
  process.exit(1);
}

if (args.includes('--checkpoint')) {
  const summary = args.slice(args.indexOf('--checkpoint') + 1).join(' ');
  if (!summary) {
    console.error('❌ Please specify checkpoint summary');
    process.exit(1);
  }
  logSessionCheckpoint(summary);
  process.exit(0);
}

if (args.includes('--start')) {
  const targetId = args[args.indexOf('--start') + 1];
  if (!targetId) {
    console.error('❌ Please specify task ID (e.g. --start ISSUE-1)');
    process.exit(1);
  }
  const taskIndex = state.queue.findIndex(t => t.id.toLowerCase() === targetId.toLowerCase() || t.title.toLowerCase().includes(targetId.toLowerCase()));
  if (taskIndex === -1) {
    console.error(`❌ Task '${targetId}' not found in queue.`);
    process.exit(1);
  }
  const task = state.queue[taskIndex];
  task.status = 'IN_PROGRESS';
  state.activeTask = {
    ...task,
    startedAt: new Date().toISOString(),
  };
  saveState(state);
  logLiveStep('IN_PROGRESS', `Locked & Started task ${task.id}: ${task.title}`);
  console.log(`\n🚀 [LOCKED & STARTED] ${task.id}: ${task.title}`);
  process.exit(0);
}

if (args.includes('--done')) {
  const targetId = args[args.indexOf('--done') + 1] || state.activeTask?.id;
  if (!targetId) {
    console.error('❌ No active task and no task ID specified.');
    process.exit(1);
  }
  const title = state.activeTask?.title || targetId;
  state.queue = state.queue.filter(t => t.id.toLowerCase() !== targetId.toLowerCase());
  state.completedTasks.push({
    id: targetId,
    title,
    completedAt: new Date().toISOString(),
  });
  state.activeTask = null;
  locksData.activeLocks = locksData.activeLocks.filter(l => l.lockedBy !== targetId);
  saveLocks(locksData);
  saveState(state);
  logLiveStep('DONE', `Task ${targetId} (${title}) marked as COMPLETED and unlocked`);
  console.log(`\n🎉 [COMPLETED] Task ${targetId} marked as done and unlocked!\n`);
  process.exit(0);
}

if (args.includes('--add')) {
  const title = args.slice(args.indexOf('--add') + 1).join(' ');
  if (!title) {
    console.error('❌ Please specify task title');
    process.exit(1);
  }
  const nextNum = state.queue.length + state.completedTasks.length + 1;
  const newId = `ISSUE-${nextNum}`;
  state.queue.push({
    id: newId,
    title,
    priority: 'Medium',
    status: 'TODO',
    assignedAgents: ['roadmap-executor']
  });
  saveState(state);
  console.log(`\n➕ [ADDED TO QUEUE] ${newId}: ${title}\n`);
  process.exit(0);
}

// Default Dashboard View
console.log('\n======================================================');
console.log('📊 ACTIVE AGENT & TASK STATE');
console.log('======================================================');
console.log(`🎯 Active Milestone:  ${state.currentMilestone}`);

if (state.activeTask) {
  console.log(`🔄 Active Task:       ${state.activeTask.id} — ${state.activeTask.title}`);
  console.log(`🤖 Assigned Agents:   ${(state.activeTask.assignedAgents || []).join(', ')}`);
  console.log(`🕒 Started At:        ${state.activeTask.startedAt}`);
} else {
  console.log('⏳ Active Task:       None (Queue Ready)');
}

console.log('\n------------------------------------------------------');
console.log('📋 TASK QUEUE:');
if (state.queue && state.queue.length > 0) {
  for (const item of state.queue) {
    const icon = item.status === 'IN_PROGRESS' ? '🔄 [IN_PROGRESS]' : '⏳ [TODO]       ';
    console.log(`  ${icon} ${item.id.padEnd(8)} ${item.title}`);
  }
} else {
  console.log('  (Queue is currently empty)');
}

console.log('\n------------------------------------------------------');
console.log('🔒 ACTIVE FILE LOCKS (.agents/state/locks.json):');
if (locksData.activeLocks && locksData.activeLocks.length > 0) {
  for (const l of locksData.activeLocks) {
    console.log(`  🔒 ${l.file.padEnd(30)} Owner: ${l.lockedBy} | "${l.reason}"`);
  }
} else {
  console.log('  (No active file locks — all files free)');
}

console.log('\n------------------------------------------------------');
console.log('✅ RECENTLY COMPLETED:');
for (const item of (state.completedTasks || []).slice(-3)) {
  console.log(`  ✅ [DONE]        ${(item.id || '').padEnd(8)} ${item.title}`);
}
console.log('======================================================\n');
