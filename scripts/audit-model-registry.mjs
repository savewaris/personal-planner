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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const SHOULD_UPDATE = process.argv.includes('--update');
const SHOULD_NOTIFY = process.argv.includes('--notify');

const REGISTRY_PATH = path.join(process.cwd(), 'config', 'model-registry.json');
const REPORT_DIR = path.join(process.cwd(), '.agents', 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'model-drift-report.md');

async function auditModels() {
  console.log('\n[MODEL SENTRY] AUTONOMOUS AI MODEL REGISTRY AUDIT');

  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error('Error: Model registry not found at: ' + REGISTRY_PATH);
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  if (!GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY not configured.');
    process.exit(1);
  }

  console.log('Fetching live models from Google AI API...');
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + GEMINI_API_KEY;
  let liveModels = [];
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + await res.text());
    const data = await res.json();
    liveModels = (data.models || []).map(m => m.name.replace(/^models\//, ''));
    console.log('Discovered ' + liveModels.length + ' active models on Google Cloud.\n');
  } catch (err) {
    console.error('Failed to query Google AI API: ' + err.message);
    process.exit(1);
  }

  const issues = [];
  const activeFrontierModels = liveModels.filter(m => m.includes('flash') || m.includes('pro'));
  let updatedAny = false;

  console.log('Auditing Registered Tiers:');
  for (const [tierKey, tier] of Object.entries(registry.tiers)) {
    const isPrimaryHealthy = liveModels.includes(tier.model);
    console.log('  Tier [' + tierKey.toUpperCase() + ']: ' + tier.model + ' -> ' + (isPrimaryHealthy ? 'HEALTHY' : 'DEPRECATED'));
    if (!isPrimaryHealthy) {
      issues.push({ tier: tierKey, type: 'DEPRECATION', model: tier.model, message: 'Model ' + tier.model + ' missing from live API.' });
      const healthyFallback = tier.fallbacks.find(fb => liveModels.includes(fb));
      if (healthyFallback && SHOULD_UPDATE) {
        console.log('    Auto-healing: Promoting ' + healthyFallback + ' to primary.');
        tier.fallbacks = [tier.model, ...tier.fallbacks.filter(fb => fb !== healthyFallback)];
        tier.model = healthyFallback;
        updatedAny = true;
      }
    }
  }

  const knownRegistered = new Set(Object.values(registry.tiers).flatMap(t => [t.model, ...t.fallbacks]));
  const newFrontierCandidates = activeFrontierModels.filter(m => !knownRegistered.has(m) && !registry.deprecated_models?.includes(m));
  console.log('\nNewly Discovered Frontier Models: ' + newFrontierCandidates.length);
  newFrontierCandidates.slice(0, 5).forEach(m => console.log('   + ' + m));

  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportLines = [
    '# Model Registry and Drift Audit Report',
    'Audited At: ' + new Date().toISOString(),
    'Active Provider: Google AI Studio / Gemini API',
    '',
    '## Tier Health Summary',
    ...Object.entries(registry.tiers).map(([k, t]) => '- [' + k.toUpperCase() + '] ' + t.name + ': ' + t.model + ' (' + (liveModels.includes(t.model) ? 'Live and Healthy' : 'Deprecated') + ')'),
    '',
    '## Detected Issues',
    issues.length === 0 ? '- Zero model drift detected.' : issues.map(i => '- ' + i.type + ': ' + i.message).join('\n'),
    '',
    '## Newly Available Frontier Candidates',
    newFrontierCandidates.length === 0 ? '- No new uncataloged models.' : newFrontierCandidates.map(m => '- ' + m).join('\n'),
    '',
    '## Maintenance Status',
    SHOULD_UPDATE && updatedAny ? '- Registry updated autonomously with healthy models.' : '- Registry remains on current baseline.'
  ];
  fs.writeFileSync(REPORT_PATH, reportLines.join('\n'), 'utf8');
  console.log('\nModel Drift Report saved to: ' + REPORT_PATH);

  if (SHOULD_UPDATE && updatedAny) {
    registry.last_audited = new Date().toISOString();
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');
    console.log('Updated ' + REGISTRY_PATH + ' successfully.\n');
  }

  if (SHOULD_NOTIFY && DISCORD_WEBHOOK_URL) {
    const hasCritical = issues.some(i => i.type === 'DEPRECATION');
    const title = hasCritical ? '[AI DRIFT WARNING] Model Deprecation Detected' : '[AI MAINTENANCE] Model Registry Healthy';
    const color = hasCritical ? 15158332 : (newFrontierCandidates.length > 0 ? 16753920 : 3066993);
    const payload = {
      username: 'Second Brain AI Model Sentry',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/8649/8649595.png',
      embeds: [{
        title,
        description: hasCritical ? 'Model issues detected:\n' + issues.map(i => i.message).join('\n') : 'All AI model tiers verified live and healthy.\n\nDiscovered ' + newFrontierCandidates.length + ' new candidates.',
        color,
        fields: [
          { name: 'Fast Tier', value: registry.tiers.fast.model, inline: true },
          { name: 'Balanced Tier', value: registry.tiers.balanced.model, inline: true },
          { name: 'Pro Tier', value: registry.tiers.pro.model, inline: true },
          { name: 'New Frontier Candidates', value: newFrontierCandidates.slice(0, 3).join(', ') || 'None', inline: false }
        ],
        footer: { text: 'Agent Second Brain • Weekly Maintenance Protocol' },
        timestamp: new Date().toISOString()
      }]
    };
    try {
      const res = await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) console.log('Model maintenance notification sent to Discord.');
    } catch (e) {
      console.warn('Notification failed: ' + e.message);
    }
  }
  console.log('Model Registry audit complete!\n');
}

auditModels();
