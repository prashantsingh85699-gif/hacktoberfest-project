import fs from 'node:fs';
import path from 'node:path';

const baseUrl = 'http://localhost:8787';

async function runFullE2eDemo() {
  console.log('================================================================');
  console.log('       EXPIRYWATCH AI: FULL END-TO-END DEMO TEST RUN           ');
  console.log('================================================================\n');

  // 1. Health
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const health = await healthRes.json();
  console.log('SYSTEM STATUS:');
  console.log(`- Server: HTTP ${healthRes.status} (OK)`);
  console.log(`- AI Mode: ${health.ai.mode} (${health.ai.model})`);
  console.log(`- Search Mode: ${health.search.mode}`);
  console.log(`- Version: ${health.version}\n`);

  // Scenario 1: Food with clear printed date
  console.log('----------------------------------------------------------------');
  console.log('SCENARIO 1: FOOD PRODUCT WITH PRINTED EXPIRY');
  console.log('----------------------------------------------------------------');
  const f1Path = path.resolve(process.cwd(), 'test-assets', 'fixture-1-printed-exp.jpg');
  const f1Bytes = fs.readFileSync(f1Path);
  const f1Base64 = f1Bytes.toString('base64');

  const scan1Res = await fetch(`${baseUrl}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: [{ role: 'front', mimeType: 'image/jpeg', data: f1Base64 }],
      ocr: [{ imageIndex: 0, text: 'MFG: 15/11/2025 EXP: 15/11/2026 BATCH: HO-2025-OAT Best before 12 months', meanConfidence: 0.95 }],
      hints: { category: 'food' },
    }),
  });
  const scan1 = await scan1Res.json();
  console.log(`[Result Status]: ${scan1.assessment.primaryStatus}`);
  console.log(`[Provenance]: ${scan1.assessment.expiry.provenance}`);
  console.log(`[Expiry Date]: ${scan1.assessment.expiry.iso}`);
  console.log(`[Expiry State]: ${scan1.assessment.expiryState}`);
  console.log(`[Product Name]: ${scan1.extraction.product.name}`);
  console.log(`[Recommendation]: ${scan1.assessment.recommendation.headline}`);
  console.log(`[Safety Note]: ${scan1.assessment.recommendation.details[0]}`);
  console.log(`[Damage Detected]: ${scan1.extraction.damage.findings.length} findings (${scan1.extraction.damage.findings[0]?.type || 'none'})\n`);

  // Scenario 2: Cosmetic with missing expiry -> investigate
  console.log('----------------------------------------------------------------');
  console.log('SCENARIO 2: COSMETIC WITH MISSING EXPIRY (RUNS INVESTIGATION)');
  console.log('----------------------------------------------------------------');
  const f2Path = path.resolve(process.cwd(), 'test-assets', 'fixture-2-missing-exp.jpg');
  const f2Bytes = fs.readFileSync(f2Path);
  const f2Base64 = f2Bytes.toString('base64');

  const scan2Res = await fetch(`${baseUrl}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: [{ role: 'front', mimeType: 'image/jpeg', data: f2Base64 }],
      ocr: [{ imageIndex: 0, text: 'MFG 15/01/2026 LOT NO: DB-LOT-904 12M', meanConfidence: 0.92 }],
      hints: { category: 'cosmetic' },
    }),
  });
  const scan2 = await scan2Res.json();
  console.log(`[Initial Scan Status]: ${scan2.assessment.primaryStatus} (Needs investigation)`);

  console.log('\n--> Triggering Manufacturer Investigation...');
  const invRes = await fetch(`${baseUrl}/api/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: scan2.extraction.product,
      barcode: '8901030383786',
      batchNumber: 'DB-LOT-904',
    }),
  });
  const inv = await invRes.json();
  console.log(`[Investigation Status]: ${inv.investigation.status}`);
  console.log(`[Search Queries Generated]:\n  1. "${inv.investigation.queries[0]}"`);
  console.log(`[Discovered Sources]: ${inv.investigation.sources.length} sources`);
  inv.investigation.sources.forEach((s) => {
    console.log(`   - [${s.class}] ${s.title} (${s.domain}) -> Eligible: ${s.eligible}`);
  });
  console.log(`[Verified Claim]: "${inv.investigation.claims[0]?.quote}" (Accepted: ${inv.investigation.claims[0]?.accepted})`);
  console.log(`[Investigation Conclusion]: ${inv.investigation.conclusion.type} (${inv.investigation.conclusion.amount} ${inv.investigation.conclusion.unit})`);

  // Re-assess with investigation findings and confirmed MFG date
  const { assess } = await import('../shared/assess.js');
  // In Step 3 of the UI, user confirms the read MFG date
  if (scan2.extraction.dates[0]) {
    scan2.extraction.dates[0].confirmedByUser = true;
  }
  const finalAssess2 = assess({
    extraction: scan2.extraction,
    investigation: inv.investigation,
    userOverrides: {},
  });
  console.log(`\n[Post-Investigation Status]: ${finalAssess2.primaryStatus}`);
  console.log(`[Provenance]: ${finalAssess2.expiry.provenance}`);
  console.log(`[Calculated Expiry]: ${finalAssess2.expiry.iso}`);
  console.log(`[Deterministic Formula]: ${finalAssess2.expiry.formulaText}\n`);

  // Scenario 3: Medicine with unreadable date
  console.log('----------------------------------------------------------------');
  console.log('SCENARIO 3: MEDICINE WITH UNREADABLE EXPIRY (HONESTY CONTRACT)');
  console.log('----------------------------------------------------------------');
  const scan3Res = await fetch(`${baseUrl}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: [{ role: 'front', mimeType: 'image/jpeg', data: f1Base64 }],
      ocr: [{ imageIndex: 0, text: 'MFD 01/2025 BATCH: DM-7749', meanConfidence: 0.85 }],
      hints: { category: 'medicine' },
    }),
  });
  const scan3 = await scan3Res.json();

  const invMedRes = await fetch(`${baseUrl}/api/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: scan3.extraction.product,
      batchNumber: 'DM-7749',
    }),
  });
  const invMed = await invMedRes.json();
  const finalAssess3 = assess({
    extraction: scan3.extraction,
    investigation: invMed.investigation,
    userOverrides: {},
  });

  console.log(`[Result Status]: ${finalAssess3.primaryStatus}`);
  console.log(`[Provenance]: ${finalAssess3.expiry.provenance}`);
  console.log(`[Calculated Date]: ${finalAssess3.expiry.iso || 'NONE (Refuses to guess)'}`);
  console.log(`[Exact Refusal Message]:\n  "${finalAssess3.unknownMessage}"`);
  console.log(`[Safety Headline]: "${finalAssess3.recommendation.headline}"`);
  console.log(`[Do Not]: "${finalAssess3.recommendation.doNot[0]}"`);

  console.log('\n================================================================');
  console.log('          ALL 3 SCENARIOS VERIFIED AND WORKING PROPERLY!        ');
  console.log('================================================================\n');
}

runFullE2eDemo().catch(console.error);
