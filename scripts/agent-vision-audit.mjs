#!/usr/bin/env node
/**
 * Autonomous Multimodal AI Vision Audit & Sentry Analyzer
 * Powered by Google Gemini API (gemini-2.5-flash) & Playwright Evidence
 * Stamped by Agent Second Brain
 * 
 * Capabilities:
 * 1. Reads UI screenshots (.agents/audit-screenshots) and runtime logs (.agents/reports/ui-audit-summary.json)
 * 2. Transmits multi-viewport images and console errors to Gemini Flash Multimodal API
 * 3. Evaluates layout integrity, hydration glitches, responsive overflows, and visual bugs
 * 4. Generates comprehensive diagnosis report (.agents/reports/ai-vision-diagnosis.md)
 * 5. Dispatches instant alert embed to Discord (DISCORD_WEBHOOK_URL)
 * 6. Sets exit code (0 for PASS, 1 for FAIL) to block broken deployments
 * 
 * Usage:
 *   node scripts/agent-vision-audit.mjs
 *   node scripts/agent-vision-audit.mjs --notify
 *   node scripts/agent-vision-audit.mjs --summary path/to/summary.json
 */

import fs from 'node:fs';
import path from 'node:path';

const ARGS = process.argv.slice(2);

function getArg(name, defaultValue) {
  const idx = ARGS.indexOf(`--${name}`);
  if (idx !== -1 && ARGS[idx + 1] && !ARGS[idx + 1].startsWith('--')) {
    return ARGS[idx + 1];
  }
  return defaultValue;
}

const hasFlag = (name) => ARGS.includes(`--${name}`);

const SUMMARY_FILE = getArg('summary', path.join(process.cwd(), '.agents', 'reports', 'ui-audit-summary.json'));
const SCREENSHOTS_DIR = getArg('screenshots-dir', path.join(process.cwd(), '.agents', 'audit-screenshots'));
const REPORT_DIR = path.join(process.cwd(), '.agents', 'reports');
const DIAGNOSIS_FILE = path.join(REPORT_DIR, 'ai-vision-diagnosis.md');
const SHOULD_NOTIFY = hasFlag('notify') || !hasFlag('no-notify');

// Load environment variables from .env if present
function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local'),
    'C:\\agent-second-brain\\.env'
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, ...rest] = trimmed.split('=');
          const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[k.trim()]) {
            process.env[k.trim()] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

async function sendDiscordNotification({ summaryData, diagnosisText, isAiPassed, verdict }) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('ℹ️ [DISCORD] DISCORD_WEBHOOK_URL not configured. Skipping webhook alert.');
    return;
  }

  const isPassing = verdict === 'PASS';
  const color = isPassing ? 3066993 : (verdict === 'WARN' ? 16753920 : 15158332);

  // Extract Tier-1 Scorecard, Vital Findings, and Next-Step Recommendations from diagnosisText
  let execSummary = '';
  const scoreCardMatch = diagnosisText.match(/### 📊 Tier-1 Design & Quality Scorecard[\s\S]*?(?=### 📱|$)/i);
  if (scoreCardMatch) {
    execSummary = scoreCardMatch[0].trim();
  } else {
    const summaryMatch = diagnosisText.match(/### 🔍 Executive Summary[\s\S]*?(?=###|$)/i);
    execSummary = summaryMatch ? summaryMatch[0].trim() : (isPassing ? 'All visual fidelity and responsive checks passed.' : 'Defects detected during autonomous browser audit.');
  }

  // Git Context
  const gitBranch = process.env.GITHUB_REF_NAME || 'main';
  const gitCommit = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : 'local';
  const repoName = process.env.GITHUB_REPOSITORY || path.basename(process.cwd());
  const prNumber = process.env.PR_NUMBER || process.env.GITHUB_REF?.match(/refs\/pull\/(\d+)\/merge/)?.[1];
  const prUrl = prNumber 
    ? `https://github.com/${repoName}/pull/${prNumber}` 
    : (process.env.GITHUB_REPOSITORY ? `https://github.com/${repoName}` : summaryData.targetUrl);

  // Locate screenshots
  let desktopScreenshot = null;
  let mobileScreenshot = null;

  if (fs.existsSync(SCREENSHOTS_DIR)) {
    const files = fs.readdirSync(SCREENSHOTS_DIR);
    const desktopFile = files.find(f => f.includes('1440x900') || f.includes('desktop'));
    const mobileFile = files.find(f => f.includes('375x812') || f.includes('mobile'));
    if (desktopFile) desktopScreenshot = path.join(SCREENSHOTS_DIR, desktopFile);
    if (mobileFile) mobileScreenshot = path.join(SCREENSHOTS_DIR, mobileFile);
  }

  const feedbackUrl = prUrl.includes('/pull/') ? `${prUrl}#issuecomment-new` : prUrl;

  const actionButtonsMarkdown = [
    '### 🔘 1-Tap Quick Actions',
    `> 🚀 **[APPROVE & MERGE PULL REQUEST](${prUrl})**`,
    `> 🔗 **[OPEN LIVE PREVIEW ENVIRONMENT](${summaryData.targetUrl})**`,
    `> 💬 **[REQUEST CHANGES & LEAVE FEEDBACK](${feedbackUrl})**`,
    '',
    '──────────────────────────────────────'
  ].join('\n');

  const mainEmbed = {
    title: `${isPassing ? '🚦 [AI APPROVAL REQUEST]' : '🚨 [DEPLOYMENT DEFECT]'} ${repoName}`,
    description: `${actionButtonsMarkdown}\n\n${execSummary}`,
    color,
    fields: [
      { name: 'Git Context', value: `\`${gitBranch}\` (\`${gitCommit}\`)`, inline: true },
      { name: 'AI Verdict', value: `**${verdict}**`, inline: true },
      { name: 'Decision', value: isPassing ? '✅ Ready to promote' : '⚠️ Action required', inline: true },
      { name: 'Console Errors', value: `${summaryData.totalErrors || 0}`, inline: true },
      { name: 'Layout Overflows', value: `${summaryData.totalOverflows || 0}`, inline: true },
      { name: 'Hydration / Warns', value: `${summaryData.totalWarnings || 0}`, inline: true }
    ],
    footer: {
      text: 'Agent Second Brain • Human-in-the-Loop Gate'
    },
    timestamp: new Date().toISOString()
  };

  const embeds = [mainEmbed];

  if (desktopScreenshot) {
    mainEmbed.image = { url: 'attachment://desktop_preview.png' };
  }

  if (mobileScreenshot) {
    embeds.push({
      title: '📱 Mobile Responsive Viewport (iPhone 13 - 375x812)',
      color,
      image: { url: 'attachment://mobile_preview.png' },
      footer: { text: 'Mobile Ergonomics & Touch Layout' }
    });
  }

  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: 'Approve & Merge PR',
          emoji: { name: '🚀' },
          url: prUrl
        },
        {
          type: 2,
          style: 5,
          label: 'Open Live Preview',
          emoji: { name: '🔗' },
          url: summaryData.targetUrl
        },
        {
          type: 2,
          style: 5,
          label: 'Request Changes',
          emoji: { name: '💬' },
          url: prUrl.includes('/pull/') ? `${prUrl}#issuecomment-new` : prUrl
        }
      ]
    }
  ];

  try {
    let res;
    if (desktopScreenshot || mobileScreenshot) {
      const formData = new FormData();
      formData.append('payload_json', JSON.stringify({
        username: 'Agent UI/UX Quality Sentry',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/2583/2583163.png',
        embeds,
        components
      }));

      let fileIdx = 0;
      if (desktopScreenshot && fs.existsSync(desktopScreenshot)) {
        formData.append(`files[${fileIdx++}]`, new Blob([fs.readFileSync(desktopScreenshot)], { type: 'image/png' }), 'desktop_preview.png');
      }
      if (mobileScreenshot && fs.existsSync(mobileScreenshot)) {
        formData.append(`files[${fileIdx++}]`, new Blob([fs.readFileSync(mobileScreenshot)], { type: 'image/png' }), 'mobile_preview.png');
      }

      res = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        body: formData
      });
    } else {
      res = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Agent UI/UX Quality Sentry',
          avatar_url: 'https://cdn-icons-png.flaticon.com/512/2583/2583163.png',
          embeds,
          components
        })
      });
    }

    if (res.ok) {
      console.log('📢 [DISCORD] Visual Approval Card & Screenshots delivered successfully.');
    } else {
      console.warn(`⚠️ [DISCORD] Failed to send notification: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`⚠️ [DISCORD] Error dispatching webhook: ${err.message}`);
  }
}

async function analyzeWithGemini(summaryData, imageParts) {
  const promptText = `
You are an expert Autonomous Principal QA & Design Systems Lead auditing a web deployment against Tier-One standards (inspired by Stripe, Linear, Apple, Vercel, and Raycast).

Here is the runtime summary and metrics from the browser audit:
${JSON.stringify(summaryData, null, 2)}

Inspect the attached screenshots across viewports (Mobile 375px, Tablet 768px, Desktop 1440px) and evaluate:
1. Visual Polish & Hierarchy: Contrast, typography balance, spatial rhythm, glassmorphism/depth, whitespace.
2. Responsive Integrity: Adapts naturally across mobile, tablet, and desktop without horizontal overflow.
3. Ergonomics & Accessibility (WCAG 2.2 AA): Interactive touch targets (>= 44x44px), readable text, visible focus.
4. Runtime & Hydration: Any uncaught errors or hydration glitches.

Format your response in GitHub Flavored Markdown adhering strictly to this structure:

## 🚦 AI Visual Audit Verdict: [PASS | WARN | FAIL]

### 📊 Tier-1 Design & Quality Scorecard
- 🎨 **Visual Polish & Hierarchy**: [Grade: A/B/C/D/F] — [1-sentence rating]
- 📱 **Responsive Adaptation**: [Grade: A/B/C/D/F] — [1-sentence rating]
- ♿ **WCAG 2.2 AA & Touch Ergonomics**: [Grade: A/B/C/D/F] — [1-sentence rating]
- ⚡ **Runtime & Sentry Health**: [Grade: A/B/C/D/F] — [1-sentence rating]

### 🔍 Executive Summary & Vital Findings
**🎯 What Works Cleanly**:
- [Concrete visual or structural strength observed on the page]
- [Responsive or typographic positive]

**⚠️ Sub-Standard Flaws & Deficiencies**:
- [Specific defect, undersized target, contrast flaw, or runtime warning, or "None detected."]

### 🚀 Next-Step Standards Recommendations (How to Reach Tier-1 UX/UI)
- 💡 **Micro-Interactions & Tactile Feedback**: [Actionable tip on hover glows, subtle scale springs, or active state transitions]
- 💡 **Touch & Spatial Ergonomics**: [Actionable tip on 44x44px minimum tap targets, 8pt spatial grid, or padding adjustments]
- 💡 **Visual Depth & Hierarchy**: [Actionable tip on dark-mode glassmorphism, subtle semi-transparent borders, or fluid clamp() typography]

### 📱 Multi-Viewport Analysis
- **Mobile (375px)**: [Findings on mobile responsiveness & touch layout]
- **Tablet (768px)**: [Findings on tablet grid & navigation]
- **Desktop (1440px)**: [Findings on desktop widescreen & typography]

### 🛠️ Actionable Remediation Code
[Step-by-step CSS/TSX code instructions for developers or AI agents to implement the fixes]
`;

  const contents = [
    {
      parts: [
        { text: promptText },
        ...imageParts
      ]
    }
  ];

  const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.7-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`🤖 Calling Google Gemini (${model}) with ${imageParts.length} viewport screenshots...`);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${model} - HTTP ${res.status}): ${errText}`);
      }

      const json = await res.json();
      const answer = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!answer) {
        throw new Error(`${model} returned an empty response.`);
      }

      return answer;
    } catch (err) {
      console.warn(`⚠️ [RETRY] ${err.message}. Attempting fallback model...`);
      lastError = err;
    }
  }

  // Fallback to 24/7 Free AI Battery (Groq / OpenRouter) if visual endpoints have temporary high-demand
  console.log('🔄 Multimodal visual endpoints busy. Falling back to 24/7 AI Battery for text/DOM diagnosis...');
  try {
    const { queryAiWithFallback } = await import('./ai-provider-battery.mjs');
    return await queryAiWithFallback(promptText, { tier: 'balanced' });
  } catch (batteryErr) {
    throw lastError || batteryErr;
  }
}

async function runVisionAudit() {
  console.log('\n👁️  ========================================================');
  console.log('🔍 AUTONOMOUS MULTIMODAL AI VISION & SENTRY AUDIT');
  console.log('========================================================\n');

  if (!fs.existsSync(SUMMARY_FILE)) {
    console.error(`❌ [ERROR] Summary file not found at: ${SUMMARY_FILE}`);
    console.error('👉 Please run `node scripts/agent-ui-audit.mjs` first to generate screenshots and logs.');
    process.exit(1);
  }

  const summaryRaw = fs.readFileSync(SUMMARY_FILE, 'utf8');
  const summaryData = JSON.parse(summaryRaw);

  console.log(`[AUDIT] Target URL     : ${summaryData.targetUrl}`);
  console.log(`[AUDIT] Total Errors   : ${summaryData.totalErrors || 0}`);
  console.log(`[AUDIT] Total Warnings : ${summaryData.totalWarnings || 0}`);
  console.log(`[AUDIT] Total Overflows: ${summaryData.totalOverflows || 0}`);

  // Gather screenshots
  const imageParts = [];
  if (fs.existsSync(SCREENSHOTS_DIR)) {
    const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    console.log(`📸 Found ${files.length} screenshot artifacts in ${SCREENSHOTS_DIR}`);

    // Take up to 6 most relevant screenshots (mobile, tablet, desktop for primary routes)
    for (const file of files.slice(0, 6)) {
      const filePath = path.join(SCREENSHOTS_DIR, file);
      const fileData = fs.readFileSync(filePath);
      const base64Data = fileData.toString('base64');
      imageParts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
    }
  }

  let diagnosisText = '';
  let isAiPassed = true;

  if (!GEMINI_API_KEY) {
    console.warn('\n⚠️ [NOTICE] GEMINI_API_KEY is not set.');
    console.warn('   Running heuristic fallback evaluation without Vision AI.');
    console.warn('   💡 Tip: Set GEMINI_API_KEY in .env or GitHub Secrets for full multimodal visual analysis.\n');

    isAiPassed = (summaryData.totalErrors === 0 && (summaryData.totalOverflows || 0) === 0);
    diagnosisText = `## 🚦 AI Visual Audit Verdict: ${isAiPassed ? 'PASS' : 'FAIL'} (Heuristic Mode)

> [!NOTE]
> GEMINI_API_KEY was not configured. This evaluation is based on automated Playwright DOM metrics and console sentry logs.

### 🔍 Executive Summary
- Target Tested: ${summaryData.targetUrl}
- Total Runtime Errors: ${summaryData.totalErrors || 0}
- Hydration / Warnings: ${summaryData.totalWarnings || 0}
- Horizontal Overflows: ${summaryData.totalOverflows || 0}

### 🚨 Critical Issues & Detected Bugs
${summaryData.totalErrors > 0 ? '❌ Runtime JavaScript or network errors detected during page evaluation.' : '✅ 0 runtime console errors detected.'}
${summaryData.totalOverflows > 0 ? '❌ Horizontal scroll overflow detected on one or more viewports.' : '✅ No horizontal layout overflows detected.'}

### 🛠️ Actionable Remediation Plan
${isAiPassed ? 'Build satisfies baseline browser stability. Ready for production promotion.' : 'Review `.agents/reports/ui-audit-report.html` to inspect failing console traces and layout dimensions.'}
`;
  } else {
    try {
      diagnosisText = await analyzeWithGemini(summaryData, imageParts);
      isAiPassed = diagnosisText.includes('Verdict: PASS') && summaryData.totalErrors === 0;
    } catch (err) {
      console.error(`❌ [AI ERROR] Multimodal analysis failed: ${err.message}`);
      diagnosisText = `## 🚦 AI Visual Audit Verdict: FAIL (AI Service Error)\n\nError: ${err.message}`;
      isAiPassed = false;
    }
  }

  // Save diagnosis report
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(DIAGNOSIS_FILE, diagnosisText, 'utf8');
  console.log(`\n📝 AI Diagnosis saved to: ${DIAGNOSIS_FILE}\n`);
  console.log(diagnosisText);

  // Send Discord Alert if requested
  if (SHOULD_NOTIFY) {
    const verdictMatch = diagnosisText.match(/Verdict:\s*([A-Z]+)/i);
    const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : (isAiPassed ? 'PASS' : 'FAIL');

    await sendDiscordNotification({
      summaryData,
      diagnosisText,
      isAiPassed,
      verdict
    });
  }

  // ================================================================
  // AI VERDICT FAIL → AUTONOMOUS GITHUB ISSUE AUTO-CREATOR
  // ================================================================
  if (!isAiPassed) {
    const repoName = process.env.GITHUB_REPOSITORY || '';
    const issueTitle = `fix(visual-audit): AI Vision Quality Gate FAIL detected on ${new Date().toISOString().split('T')[0]}`;

    if (repoName) {
      try {
        const { execSync } = await import('child_process');

        // Check if an issue already exists for this audit
        const existingJson = execSync(
          `gh issue list --repo ${repoName} --state open --search "fix(visual-audit): AI Vision Quality Gate FAIL" --json number`,
          { encoding: 'utf-8' }
        );
        const existing = JSON.parse(existingJson || '[]');

        if (existing.length === 0) {
          const issueBody = `## 🤖 Autonomous Visual Audit — AI Verdict: FAIL\n\n` +
            `The Headless Browser & AI Vision Quality Gate detected defects on **${new Date().toISOString()}**.\n\n` +
            `### 📋 Diagnosis Report\n\`\`\`\n${diagnosisText.substring(0, 2000)}\n\`\`\`\n\n` +
            `### 🛠️ Required Actions\n` +
            `1. Review the screenshots in \`.agents/audit-screenshots/\`\n` +
            `2. Apply all recommended fixes from the diagnosis above\n` +
            `3. Ensure Playwright tests pass on all ${summaryData.routes?.length || 'all'} discovered routes\n\n` +
            `*Auto-created by Autonomous Vision Sentry. The Issue Solver will attempt to fix this automatically.*`;

          const tempFile = `/tmp/vision-fail-issue-${Date.now()}.md`;
          const { writeFileSync } = await import('fs');
          writeFileSync(tempFile, issueBody, 'utf8');

          const issueUrl = execSync(
            `gh issue create --repo ${repoName} --title "${issueTitle.replace(/"/g, '\\"')}" --body-file "${tempFile}" --label "bug,ai-audit"`,
            { encoding: 'utf-8' }
          ).trim();

          console.log(`\n🎫 [AUTO-ISSUE CREATED] AI Verdict FAIL → Issue opened: ${issueUrl}`);
          console.log(`   The Autonomous Issue Solver will pick this up and attempt to fix it automatically.\n`);
        } else {
          console.log(`\nℹ️ [AUTO-ISSUE SKIPPED] Active visual audit issue already exists: #${existing[0].number}\n`);
        }
      } catch (issueErr) {
        console.warn(`⚠️ [AUTO-ISSUE WARN] Could not auto-create issue: ${issueErr.message}`);
      }
    }

    console.error('\n❌ [QUALITY GATE FAILED] Deployment rejected by Autonomous Visual Audit.');
    console.error('👉 Visitors will not see this version. Fix reported errors and try again.\n');
    process.exit(1);
  } else {
    console.log('\n✅ [QUALITY GATE PASSED] Visual and runtime verification successful!\n');
    process.exit(0);
  }
}

runVisionAudit().catch(err => {
  console.error('Fatal vision audit error:', err);
  process.exit(1);
});
