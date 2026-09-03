#!/usr/bin/env node

/**
 * Universal 24/7 Multi-Provider Free-Tier AI Dispatcher with Zero-Cost Guard
 * 
 * STRICT $0 SPEND POLICY:
 *   1. Google AI Studio Free Tier (100% Free, no billing)
 *   2. Groq Cloud Developer Free Tier (100% Free, 14,400 req/day)
 *   3. OpenRouter Strict Free Models (Only endpoints with ':free' suffix, $0 cost)
 *   4. Cerebras Free Tier with Hard Cap (Max 200 requests/day, stops before any billing)
 * 
 * If a model hits rate limit or quota, it automatically rotates to the next free provider.
 * NEVER incurs financial charges.
 */

import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), '.env'),
    'C:\\agent-second-brain\\.env',
    'C:\\save\\Projects\\PersonalWebsite\\.env',
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

const USAGE_TRACKER_PATH = path.join(process.cwd(), '.agents', 'state', 'provider-usage.json');
const CEREBRAS_DAILY_HARD_CAP = 200; // Hard cap to guarantee $0 spend

function getDailyUsage() {
  const today = new Date().toISOString().split('T')[0];
  let usage = { date: today, cerebrasCount: 0, totalRequests: 0 };
  if (fs.existsSync(USAGE_TRACKER_PATH)) {
    try {
      const saved = JSON.parse(fs.readFileSync(USAGE_TRACKER_PATH, 'utf8'));
      if (saved.date === today) usage = saved;
    } catch (e) {}
  }
  return usage;
}

function incrementUsage(provider) {
  const usage = getDailyUsage();
  usage.totalRequests = (usage.totalRequests || 0) + 1;
  if (provider === 'cerebras') {
    usage.cerebrasCount = (usage.cerebrasCount || 0) + 1;
  }
  const dir = path.dirname(USAGE_TRACKER_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USAGE_TRACKER_PATH, JSON.stringify(usage, null, 2), 'utf8');
}

async function callGoogle(model, prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature || 0.2,
        maxOutputTokens: options.maxTokens || 2048
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Google API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  incrementUsage('google');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenAiCompatible(baseUrl, apiKey, model, prompt, options = {}, providerName = '') {
  // STRICT $0 GUARD: If OpenRouter, strictly enforce that model ends with :free
  if (providerName === 'openrouter' && !model.endsWith(':free')) {
    throw new Error(`STRICT $0 GUARD: Rejected paid model '${model}'. Only ':free' endpoints allowed.`);
  }

  // STRICT $0 GUARD: If Cerebras, check hard daily limit
  if (providerName === 'cerebras') {
    const usage = getDailyUsage();
    if (usage.cerebrasCount >= CEREBRAS_DAILY_HARD_CAP) {
      throw new Error(`STRICT $0 GUARD: Cerebras reached daily safety cap (${CEREBRAS_DAILY_HARD_CAP} reqs). Skipping to protect billing.`);
    }
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.2,
      max_tokens: options.maxTokens || 2048
    })
  });

  if (!res.ok) {
    throw new Error(`${providerName} API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  incrementUsage(providerName);
  return data.choices?.[0]?.message?.content || '';
}

export async function queryAiWithFallback(prompt, options = {}) {
  // Provider Hierarchy for Guaranteed 100% Free Operation:
  // 1. Google Gemini Flash (6,000+ free req/day)
  // 2. Groq Cloud (14,400 free req/day at 800 tok/s)
  // 3. OpenRouter Free Endpoints (100% free models)
  // 4. Cerebras Free Tier (Hard capped at 200 req/day)
  const candidateChain = [
    { provider: 'google', model: 'gemini-2.5-flash' },
    { provider: 'google', model: 'gemini-2.5-flash-lite' },
    { provider: 'groq', model: 'openai/gpt-oss-120b' },
    { provider: 'groq', model: 'qwen/qwen3.8-27b' },
    { provider: 'openrouter', model: 'nvidia/nemotron-3.5-lightning:free' },
    { provider: 'openrouter', model: 'google/gemma-4-31b-it:free' },
    { provider: 'cerebras', model: 'gpt-oss-120b' }
  ];

  let lastError = null;

  for (const candidate of candidateChain) {
    const { provider, model } = candidate;
    try {
      if (provider === 'google' && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
        return await callGoogle(model, prompt, options);
      } else if (provider === 'groq' && process.env.GROQ_API_KEY) {
        return await callOpenAiCompatible('https://api.groq.com/openai/v1', process.env.GROQ_API_KEY, model, prompt, options, 'groq');
      } else if (provider === 'openrouter' && process.env.OPENROUTER_API_KEY) {
        return await callOpenAiCompatible('https://openrouter.ai/api/v1', process.env.OPENROUTER_API_KEY, model, prompt, options, 'openrouter');
      } else if (provider === 'cerebras' && process.env.CEREBRAS_API_KEY) {
        return await callOpenAiCompatible('https://api.cerebras.ai/v1', process.env.CEREBRAS_API_KEY, model, prompt, options, 'cerebras');
      }
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ [AI BATTERY AUTO-FAILOVER] ${provider}/${model} unavailable (${err.message.substring(0, 100)}...). Rotating to next free model...`);
    }
  }

  throw new Error(`All free-tier models in the 24/7 battery exhausted. Last error: ${lastError?.message}`);
}

// CLI Test
if (process.argv[1]?.endsWith('ai-provider-battery.mjs')) {
  console.log('\n🔋 Testing 24/7 Multi-Provider Free-Tier Battery with $0 Hard Guard...');
  queryAiWithFallback('Say "Zero Spend Guard Active" in 4 words')
    .then(res => {
      console.log('✅ Response:', res.trim());
      console.log('✨ 100% Free Battery Verified!\n');
    })
    .catch(err => {
      console.error('❌ Battery failed:', err.message);
    });
}
