import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.cwd(), 'test-assets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function createSvgLabel({ title, lines = [], badge = null, borderColor = '#334155', bg = '#FFFFFF' }) {
  const lineSvg = lines
    .map(
      (l, idx) =>
        `<text x="40" y="${120 + idx * 36}" font-family="sans-serif" font-size="22" font-weight="600" fill="#0F172A">${escapeXml(l)}</text>`
    )
    .join('');

  const badgeSvg = badge
    ? `<rect x="40" y="320" width="100" height="40" rx="8" fill="#4F46E5"/>
       <text x="90" y="346" font-family="sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escapeXml(badge)}</text>`
    : '';

  return Buffer.from(`
    <svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="450" fill="${bg}"/>
      <rect x="20" y="20" width="760" height="410" rx="16" fill="none" stroke="${borderColor}" stroke-width="4"/>
      <text x="40" y="65" font-family="sans-serif" font-size="28" font-weight="800" fill="#1E293B">${escapeXml(title)}</text>
      <line x1="40" y1="80" x2="760" y2="80" stroke="#CBD5E1" stroke-width="2"/>
      ${lineSvg}
      ${badgeSvg}
    </svg>
  `);
}

async function generate() {
  console.log('Generating synthetic test fixtures in test-assets/...');

  // 1. Clear printed EXP
  const f1 = createSvgLabel({
    title: 'Whole Grain Rolled Oats 1kg',
    lines: ['MFG: 15/11/2025', 'EXP: 15/11/2026', 'BATCH: HO-2025-OAT', 'Storage: Store cool and dry'],
  });
  await sharp(f1).jpeg({ quality: 90 }).toFile(path.join(outDir, 'fixture-1-printed-exp.jpg'));

  // 2. Missing EXP (MFG + batch only)
  const f2 = createSvgLabel({
    title: 'Hydra-Glow Vitamin C Serum 30ml',
    lines: ['MFG: 15/01/2026', 'LOT NO: DB-LOT-904', 'Net Vol: 30 ml'],
    badge: '12M',
  });
  await sharp(f2).jpeg({ quality: 90 }).toFile(path.join(outDir, 'fixture-2-missing-exp.jpg'));

  // 3. Ambiguous date
  const f3 = createSvgLabel({
    title: 'Almond Butter Crunch',
    lines: ['MFG: 01/01/2026', 'EXP: 03/04/2026', 'BATCH: ALM-44'],
  });
  await sharp(f3).jpeg({ quality: 90 }).toFile(path.join(outDir, 'fixture-3-ambiguous-date.jpg'));

  // 4. Label rule
  const f4 = createSvgLabel({
    title: 'Artisan Sourdough Crackers',
    lines: ['MFG DATE: 10/01/2026', 'Best before 9 months from manufacture', 'BATCH: CRK-901'],
  });
  await sharp(f4).jpeg({ quality: 90 }).toFile(path.join(outDir, 'fixture-4-label-rule.jpg'));

  // 5. Cosmetic with 12M PAO
  const f5 = createSvgLabel({
    title: 'Revitalizing Night Cream 50g',
    lines: ['MFG: 05/02/2026', 'BATCH: NYX-02', 'Period After Opening: 12 Months'],
    badge: '12M',
    bg: '#FDF2F8',
    borderColor: '#EC4899',
  });
  await sharp(f5).jpeg({ quality: 90 }).toFile(path.join(outDir, 'fixture-5-cosmetic-pao.jpg'));

  // 6. Damaged / Defective look
  const f6 = createSvgLabel({
    title: 'Canned Tomato Puree (Damage Sample)',
    lines: ['DEFECT: Broken Seal & Can Swelling', 'EXP: 20/12/2026', 'BATCH: CAN-88'],
    bg: '#FFF1F2',
    borderColor: '#E11D48',
  });
  await sharp(f6).jpeg({ quality: 90 }).toFile(path.join(outDir, 'fixture-6-damaged-pack.jpg'));

  console.log('Successfully generated 6 fixtures in test-assets/');
}

generate().catch(console.error);
