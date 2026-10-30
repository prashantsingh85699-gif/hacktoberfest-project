import fs from 'node:fs';
import path from 'node:path';

const baseUrl = 'http://localhost:8787';

async function testLiveApis() {
  console.log('Testing Live Gemini & Tavily APIs...');

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const health = await healthRes.json();
  console.log('Health check:', health);

  // 2. Test Live Gemini Vision Scan with fixture image
  console.log('\nTesting Live Gemini Vision /api/scan...');
  const f1Path = path.resolve(process.cwd(), 'test-assets', 'fixture-1-printed-exp.jpg');
  const f1Base64 = fs.readFileSync(f1Path).toString('base64');

  const scanRes = await fetch(`${baseUrl}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: [{ role: 'front', mimeType: 'image/jpeg', data: f1Base64 }],
      ocr: [{ imageIndex: 0, text: 'MFG 15/11/2025 EXP 15/11/2026 BATCH HO-2025-OAT', meanConfidence: 0.95 }],
      hints: { category: 'food', productHint: 'Whole Grain Rolled Oats' },
    }),
  });

  const scanData = await scanRes.json();
  console.log('Scan Status:', scanRes.status);
  console.log('Meta:', scanData.meta);
  console.log('Extracted Product:', scanData.extraction?.product);
  console.log('Extracted Dates:', scanData.extraction?.dates);
  console.log('Assessment Primary Status:', scanData.assessment?.primaryStatus);
  console.log('Assessment Expiry:', scanData.assessment?.expiry);

  // 3. Test Live Tavily Search Investigation
  console.log('\nTesting Live Tavily Search /api/investigate...');
  const invRes = await fetch(`${baseUrl}/api/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: {
        category: 'food',
        brand: 'Quaker',
        name: 'Rolled Oats',
        variant: 'Whole Grain',
        identityConfidence: 0.95,
      },
      barcode: '8901030383786',
    }),
  });

  const invData = await invRes.json();
  console.log('Investigate Status:', invRes.status);
  console.log('Investigation Queries:', invData.investigation?.queries);
  console.log('Discovered Sources Count:', invData.investigation?.sources?.length);
  if (invData.investigation?.sources?.length > 0) {
    console.log('Sample Source 1:', {
      domain: invData.investigation.sources[0].domain,
      class: invData.investigation.sources[0].class,
      eligible: invData.investigation.sources[0].eligible,
    });
  }
  console.log('Claims Found:', invData.investigation?.claims?.length);
  console.log('Conclusion:', invData.investigation?.conclusion);

  console.log('\nLive API Testing Complete!');
}

testLiveApis().catch(console.error);

