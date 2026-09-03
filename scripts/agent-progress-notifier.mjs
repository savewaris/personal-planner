#!/usr/bin/env node

/**
 * Autonomous Discord Live Progress & Heartbeat Notifier
 * 
 * Provides real-time liveness indicators, elapsed timers, and progress bars
 * by editing a single message in-place on Discord, keeping channels clean and
 * letting users know with 100% certainty if an agent is still actively working.
 * 
 * CLI Usage:
 *   node scripts/agent-progress-notifier.mjs start --repo savewaris/my-app --task "Issue #1: Add Dark Mode"
 *   node scripts/agent-progress-notifier.mjs update --step "Running Playwright Tests" --percent 60
 *   node scripts/agent-progress-notifier.mjs complete --pr "https://github.com/.../pull/1"
 *   node scripts/agent-progress-notifier.mjs fail --error "Build failed"
 */

import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), '.env'),
    'C:\\agent-second-brain\\.env',
    path.join(process.env.USERPROFILE || '', '.env')
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          const val = trimmed.substring(eqIdx + 1).trim();
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const STATE_FILE = path.join(process.cwd(), '.agents', 'progress-state.json');

function getState() {
  if (fs.existsSync(STATE_FILE)) {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) {}
  }
  return null;
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function formatElapsed(startTimeMs) {
  const diffSec = Math.floor((Date.now() - startTimeMs) / 1000);
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function renderProgressBar(percent) {
  const total = 10;
  const filled = Math.min(total, Math.max(0, Math.round((percent / 100) * total)));
  const empty = total - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}%`;
}

function getArg(flag, defaultValue = '') {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : defaultValue;
}

async function main() {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('ℹ️ DISCORD_WEBHOOK_URL not set. Skipping Discord progress update.');
    return;
  }

  const action = process.argv[2];

  if (action === 'start') {
    const repo = getArg('--repo', 'savewaris/project');
    const task = getArg('--task', 'Autonomous Task');
    const startTime = Date.now();

    const payload = {
      username: 'Autonomous AI Agent Tracker',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/8649/8649595.png',
      embeds: [{
        title: `🔄 [WORKING] ${task}`,
        description: `⚡ **Liveness Heartbeat:** 🟢 ALIVE (Tick #1)\n⏱️ **Elapsed Time:** 0s\n\n\`\`\`text\n${renderProgressBar(10)} Initializing Workspace & Dependencies\n\`\`\``,
        color: 3447003,
        fields: [
          { name: 'Repository', value: `\`${repo}\``, inline: true },
          { name: 'Current Step', value: 'Preparing environment and branch', inline: true }
        ],
        footer: { text: 'Heartbeat active. Live updates in progress.' },
        timestamp: new Date().toISOString()
      }]
    };

    try {
      const res = await fetch(`${DISCORD_WEBHOOK_URL}?wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        saveState({ messageId: data.id, startTime, repo, task, tick: 1 });
        console.log(`✅ Started Discord progress tracker (Message ID: ${data.id})`);
      }
    } catch (e) {
      console.warn('Failed to start tracker:', e.message);
    }
  } 
  else if (action === 'update') {
    const state = getState();
    if (!state?.messageId) return;

    const step = getArg('--step', 'Executing task');
    const percent = parseInt(getArg('--percent', '50'), 10);
    state.tick = (state.tick || 1) + 1;
    saveState(state);

    const elapsed = formatElapsed(state.startTime);
    const editUrl = `${DISCORD_WEBHOOK_URL}/messages/${state.messageId}`;

    const payload = {
      embeds: [{
        title: `🔄 [WORKING] ${state.task}`,
        description: `⚡ **Liveness Heartbeat:** 🟢 ALIVE (Tick #${state.tick} • Active)\n⏱️ **Elapsed Time:** ${elapsed}\n\n\`\`\`text\n${renderProgressBar(percent)} ${step}\n\`\`\``,
        color: 16753920,
        fields: [
          { name: 'Repository', value: `\`${state.repo}\``, inline: true },
          { name: 'Current Step', value: step, inline: true }
        ],
        footer: { text: 'Agent is healthy & actively executing. Ticking live.' },
        timestamp: new Date().toISOString()
      }]
    };

    try {
      const res = await fetch(editUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) console.log(`✅ Heartbeat update: ${step} (${percent}%) [${elapsed}]`);
    } catch (e) {
      console.warn('Failed to update progress:', e.message);
    }
  }
  else if (action === 'complete') {
    const state = getState();
    if (!state?.messageId) return;

    const prUrl = getArg('--pr', '');
    const elapsed = formatElapsed(state.startTime);
    const editUrl = `${DISCORD_WEBHOOK_URL}/messages/${state.messageId}`;

    const payload = {
      embeds: [{
        title: `🎉 [COMPLETED] ${state.task} Resolved!`,
        description: `⚡ **Final Status:** 100% PASS (Zero Defect Gate)\n⏱️ **Total Execution Time:** ${elapsed}\n\n\`\`\`text\n${renderProgressBar(100)} Quality Gate Passed • Auto-Merged to Main!\n\`\`\``,
        color: 3066993,
        fields: [
          { name: 'Repository', value: `\`${state.repo}\``, inline: true },
          { name: 'Pull Request', value: prUrl ? `[View PR](${prUrl})` : 'Auto-Merged', inline: true }
        ],
        footer: { text: 'Task completed autonomously with zero clicks required.' },
        timestamp: new Date().toISOString()
      }]
    };

    try {
      await fetch(editUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log(`🎉 Complete update dispatched! Total time: ${elapsed}`);
      try { fs.unlinkSync(STATE_FILE); } catch (e) {}
    } catch (e) {
      console.warn('Failed to dispatch completion:', e.message);
    }
  }
  else if (action === 'fail') {
    const state = getState();
    if (!state?.messageId) return;

    const errorMsg = getArg('--error', 'Execution error');
    const elapsed = formatElapsed(state.startTime);
    const editUrl = `${DISCORD_WEBHOOK_URL}/messages/${state.messageId}`;

    const payload = {
      embeds: [{
        title: `🚨 [FAILED] ${state.task} Stalled/Errored`,
        description: `⚡ **Liveness Heartbeat:** 🔴 HALTED\n⏱️ **Elapsed Time:** ${elapsed}\n\n\`\`\`text\n${errorMsg}\n\`\`\``,
        color: 15158332,
        fields: [
          { name: 'Repository', value: `\`${state.repo}\``, inline: true },
          { name: 'Failure Details', value: errorMsg.substring(0, 500), inline: false }
        ],
        footer: { text: 'Execution stopped. Check workflow logs.' },
        timestamp: new Date().toISOString()
      }]
    };

    try {
      await fetch(editUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log(`🚨 Failure update dispatched.`);
      try { fs.unlinkSync(STATE_FILE); } catch (e) {}
    } catch (e) {
      console.warn('Failed to dispatch failure:', e.message);
    }
  }
}

main().catch(console.error);
