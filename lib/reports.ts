interface ReportSection {
  title: string;
  content: string;
  isHtml?: boolean;
}

interface ReportOptions {
  title: string;
  subtitle?: string;
  date?: string;
  sections: ReportSection[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildHtml(opts: ReportOptions): string {
  const date = opts.date ?? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const sectionHtml = opts.sections
    .map(
      (s) => `
      <div class="section">
        <h2>${escapeHtml(s.title)}</h2>
        ${s.isHtml ? s.content : `<p>${escapeHtml(s.content).replace(/\n/g, '<br/>')}</p>`}
      </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(opts.title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system,'Helvetica Neue',Arial,sans-serif; color:#1a2035; background:#fff; font-size:11pt; line-height:1.5; }
  .cover { padding:60px 40px 40px; border-bottom:3px solid #1a2035; margin-bottom:32px; }
  .cover h1 { font-size:24pt; font-weight:700; color:#1a2035; margin-bottom:8px; }
  .cover .subtitle { font-size:13pt; color:#4a5568; margin-bottom:16px; }
  .cover .meta { font-size:10pt; color:#718096; display:flex; gap:24px; }
  .section { padding:24px 40px; border-bottom:1px solid #e2e8f0; }
  .section:last-child { border-bottom:none; }
  h2 { font-size:14pt; font-weight:700; color:#1a2035; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #3b82f6; }
  p { margin-bottom:10px; color:#2d3748; }
  table { width:100%; border-collapse:collapse; margin:12px 0; font-size:10pt; }
  th { background:#1a2035; color:#fff; padding:8px 12px; text-align:left; font-weight:600; }
  td { padding:7px 12px; border-bottom:1px solid #e2e8f0; }
  tr:nth-child(even) td { background:#f7fafc; }
  .gain { color:#10b981; font-weight:600; }
  .loss { color:#ef4444; font-weight:600; }
  .highlight { background:#eff6ff; border-left:4px solid #3b82f6; padding:12px 16px; margin:12px 0; border-radius:4px; }
  .risk { background:#fff5f5; border-left:4px solid #ef4444; padding:12px 16px; margin:12px 0; border-radius:4px; }
  ul,ol { padding-left:20px; margin:8px 0; }
  li { margin-bottom:4px; }
  .footer { padding:20px 40px; font-size:9pt; color:#a0aec0; text-align:center; border-top:1px solid #e2e8f0; }
  @media print { .footer { position:fixed; bottom:0; width:100%; } }
</style>
</head>
<body>
<div class="cover">
  <h1>${escapeHtml(opts.title)}</h1>
  ${opts.subtitle ? `<div class="subtitle">${escapeHtml(opts.subtitle)}</div>` : ''}
  <div class="meta">
    <span>Date: ${date}</span>
    <span>Confidential · Personal Investment Research</span>
  </div>
</div>
${sectionHtml}
<div class="footer">Personal investment research only. Not financial advice.</div>
</body>
</html>`;
}

export function buildThesisHtml(thesis: {
  ticker?: string;
  title: string;
  direction: string;
  conviction: number;
  hypothesis: string;
  keyAssumptions: { text: string; confidence: string; softnessFlag?: string }[];
  catalysts: string[];
  risks: string[];
  targetPrice?: number;
  timingRange?: string;
  notes: string;
  pressureTestNotes?: string;
}): string {
  const assumptionsHtml = `
    <table>
      <thead><tr><th>Assumption</th><th>Confidence</th><th>Softness Flag</th></tr></thead>
      <tbody>
        ${thesis.keyAssumptions
          .map(
            (a) =>
              `<tr><td>${escapeHtml(a.text)}</td><td>${escapeHtml(a.confidence)}</td><td>${escapeHtml(a.softnessFlag ?? '—')}</td></tr>`,
          )
          .join('')}
      </tbody>
    </table>`;

  const sections: ReportSection[] = [
    {
      title: 'Investment Thesis',
      content: `<div class="highlight"><strong>Direction:</strong> ${escapeHtml(thesis.direction.toUpperCase())} &nbsp;|&nbsp; <strong>Conviction:</strong> ${'★'.repeat(thesis.conviction)}${'☆'.repeat(5 - thesis.conviction)}</div><p>${escapeHtml(thesis.hypothesis)}</p>`,
      isHtml: true,
    },
    { title: 'Key Assumptions', content: assumptionsHtml, isHtml: true },
    {
      title: 'Catalysts & Timing',
      content: `<ul>${thesis.catalysts.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>${thesis.timingRange ? `<div class="highlight"><strong>Timing Range:</strong> ${escapeHtml(thesis.timingRange)}</div>` : ''}`,
      isHtml: true,
    },
    {
      title: 'Risk Factors',
      content: `<ul>${thesis.risks.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`,
      isHtml: true,
    },
  ];

  if (thesis.pressureTestNotes) {
    sections.push({ title: 'Pressure Test', content: `<div class="risk">${escapeHtml(thesis.pressureTestNotes).replace(/\n/g, '<br/>')}</div>`, isHtml: true });
  }

  if (thesis.notes) {
    sections.push({ title: 'Research Notes', content: thesis.notes });
  }

  return buildHtml({
    title: thesis.ticker ? `${thesis.ticker}: ${thesis.title}` : thesis.title,
    subtitle: `Investment Thesis — ${thesis.direction.toUpperCase()}${thesis.targetPrice ? ` | Target $${thesis.targetPrice}` : ''}`,
    sections,
  });
}
