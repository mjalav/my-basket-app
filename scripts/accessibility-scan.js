/**
 * Accessibility scan for WCAG 2.1 Level AA.
 * Scans main (/), checkout (/checkout), orders (/orders) and generates an HTML report.
 * Usage: node scripts/accessibility-scan.js [baseUrl]
 * Default baseUrl: http://localhost:9002
 */

const { AxeBuilder } = require('@axe-core/playwright');
const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.argv[2] || 'http://localhost:9002';
const PAGES = [
  { path: '/', name: 'Main Page' },
  { path: '/checkout', name: 'Checkout Page' },
  { path: '/orders', name: 'My Order Page' },
];
const OUTPUT_DIR = path.join(__dirname, '..', 'accessibility-reports');

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function impactClass(impact) {
  const map = { critical: 'critical', serious: 'serious', moderate: 'moderate', minor: 'minor' };
  return map[impact] || 'minor';
}

function buildHtmlReport(allResults, outputPath) {
  const criticalAndSerious = [];
  allResults.forEach(({ url, name, results }) => {
    (results.violations || []).forEach((v) => {
      if (v.impact === 'critical' || v.impact === 'serious') {
        criticalAndSerious.push({ page: name, url, ...v });
      }
    });
  });

  const summaryCritical = criticalAndSerious.filter((v) => v.impact === 'critical');
  const summarySerious = criticalAndSerious.filter((v) => v.impact === 'serious');

  let violationsTableRows = '';
  allResults.forEach(({ url, name, results }) => {
    const violations = results.violations || [];
    violations.forEach((v) => {
      const nodes = (v.nodes || []).map((n) => escapeHtml(n.html)).join('</li><li>');
      violationsTableRows += `
        <tr class="impact-${impactClass(v.impact)}">
          <td>${escapeHtml(name)}</td>
          <td><code>${escapeHtml(url)}</code></td>
          <td><span class="badge impact-${impactClass(v.impact)}">${escapeHtml(v.impact)}</span></td>
          <td>${escapeHtml(v.id)}</td>
          <td>${escapeHtml(v.help)}</td>
          <td>${escapeHtml(v.description)}</td>
          <td><ul><li>${nodes}</li></ul></td>
          <td><a href="${escapeHtml(v.helpUrl)}" target="_blank" rel="noopener">Docs</a></td>
        </tr>`;
    });
  });

  const summarySection = `
    <section class="summary">
      <h2>Summary – Critical and Serious violations (WCAG 2.1 AA)</h2>
      <div class="summary-cards">
        <div class="card critical">
          <span class="count">${summaryCritical.length}</span>
          <span class="label">Critical</span>
        </div>
        <div class="card serious">
          <span class="count">${summarySerious.length}</span>
          <span class="label">Serious</span>
        </div>
      </div>
      <h3>Critical violations (${summaryCritical.length})</h3>
      <ul>
        ${summaryCritical.length ? summaryCritical.map((v) => `
          <li><strong>${escapeHtml(v.page)}</strong> – ${escapeHtml(v.help)} (${escapeHtml(v.id)})</li>
        `).join('') : '<li>None</li>'}
      </ul>
      <h3>Serious violations (${summarySerious.length})</h3>
      <ul>
        ${summarySerious.length ? summarySerious.map((v) => `
          <li><strong>${escapeHtml(v.page)}</strong> – ${escapeHtml(v.help)} (${escapeHtml(v.id)})</li>
        `).join('') : '<li>None</li>'}
      </ul>
    </section>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Scan Report – WCAG 2.1 AA</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; background: #1a1a2e; color: #eee; line-height: 1.5; }
    h1 { margin-top: 0; }
    h2 { border-bottom: 1px solid #444; padding-bottom: 8px; }
    h3 { margin-top: 24px; }
    a { color: #6eb8ff; }
    .meta { color: #888; margin-bottom: 24px; }
    .summary-cards { display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
    .card { padding: 16px 24px; border-radius: 8px; text-align: center; }
    .card .count { display: block; font-size: 2rem; font-weight: 700; }
    .card.critical { background: #4a1515; color: #ffb3b3; }
    .card.serious { background: #4a3a15; color: #ffe0b3; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #333; }
    th { background: #2a2a4a; }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: 0.85em; }
    .badge.critical { background: #8b2020; color: #fff; }
    .badge.serious { background: #8b7020; color: #fff; }
    .badge.moderate { background: #3a5a3a; color: #b8e0b8; }
    .badge.minor { background: #2a3a5a; color: #b8c8e0; }
    tr.impact-critical { background: rgba(139,32,32,0.15); }
    tr.impact-serious { background: rgba(139,112,32,0.15); }
    ul { padding-left: 20px; }
    li { margin: 4px 0; }
    code { background: #2a2a4a; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    section { margin-bottom: 32px; }
  </style>
</head>
<body>
  <h1>Accessibility Scan Report</h1>
  <p class="meta">WCAG 2.1 Level AA · Generated ${new Date().toISOString()} · Base URL: ${escapeHtml(BASE_URL)}</p>
  ${summarySection}
  <section>
    <h2>All violations by page</h2>
    <table>
      <thead>
        <tr>
          <th>Page</th>
          <th>URL</th>
          <th>Impact</th>
          <th>Rule ID</th>
          <th>Help</th>
          <th>Description</th>
          <th>Nodes</th>
          <th>Docs</th>
        </tr>
      </thead>
      <tbody>
        ${violationsTableRows || '<tr><td colspan="8">No violations found.</td></tr>'}
      </tbody>
    </table>
  </section>
  <section>
    <h2>Scan metadata</h2>
    <p>Pages scanned: ${allResults.map((r) => r.name).join(', ')}</p>
    <p>Total violations (all impacts): ${allResults.reduce((acc, r) => acc + (r.results.violations || []).length, 0)}</p>
  </section>
</body>
</html>`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, 'utf8');
  return { summaryCritical, summarySerious, outputPath };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const allResults = [];

  try {
    for (const { path: pagePath, name } of PAGES) {
      const url = `${BASE_URL.replace(/\/$/, '')}${pagePath}`;
      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();
        allResults.push({ url: pagePath || '/', name, results });
        console.log(`Scanned ${name} (${url}): ${(results.violations || []).length} violations`);
      } catch (err) {
        console.error(`Error scanning ${name} (${url}):`, err.message);
        allResults.push({
          url: pagePath || '/',
          name,
          results: { violations: [], passes: [], incomplete: [], inapplicable: [] },
          error: err.message,
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  const reportPath = path.join(OUTPUT_DIR, 'accessibility-report.html');
  const { summaryCritical, summarySerious, outputPath } = buildHtmlReport(allResults, reportPath);

  console.log('\n--- Summary: Critical and Serious violations (WCAG 2.1 AA) ---');
  console.log('Critical:', summaryCritical.length);
  summaryCritical.forEach((v) => console.log('  -', v.page, '–', v.help, '(' + v.id + ')'));
  console.log('Serious:', summarySerious.length);
  summarySerious.forEach((v) => console.log('  -', v.page, '–', v.help, '(' + v.id + ')'));
  console.log('\nHTML report written to:', path.resolve(outputPath));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
