import assert from 'node:assert/strict';
import express from 'express';
import healthHandler from '../api/health.js';
import scanHandler from '../api/scan.js';
import investigateHandler from '../api/investigate.js';

// Setup local test server
const app = express();
app.use(express.json({ limit: '3mb' }));

function adapt(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (err) {
      next(err);
    }
  };
}

app.get('/api/health', adapt(healthHandler));
app.post('/api/scan', adapt(scanHandler));
app.post('/api/investigate', adapt(investigateHandler));

const server = app.listen(0);
const port = server.address().port;
const baseUrl = `http://localhost:${port}`;

async function request(path, opts = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// Minimal valid 1x1 JPEG buffer and base64
const validJpegBytes = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
  0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xd9,
]);
const validJpegBase64 = validJpegBytes.toString('base64');

async function runSmokeTests() {
  console.log(`Starting API Smoke Tests against in-memory test server on port ${port}...`);

  // 1. Health check
  console.log('1. Checking /api/health...');
  const health = await request('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.ok, true);
  assert.ok(health.data.ai);
  console.log('   ✓ /api/health is OK');

  // 2. Scan with 0 images
  console.log('2. Checking scan with 0 images (Expect 400 INVALID_INPUT)...');
  const emptyScan = await request('/api/scan', {
    method: 'POST',
    body: JSON.stringify({ images: [] }),
  });
  assert.equal(emptyScan.status, 400);
  assert.equal(emptyScan.data.error.code, 'INVALID_INPUT');
  console.log('   ✓ 0 images correctly rejected');

  // 3. Scan with 6 images (exceeds max 5)
  console.log('3. Checking scan with 6 images (Expect 400 INVALID_INPUT)...');
  const sixImages = Array(6).fill({
    role: 'label',
    mimeType: 'image/jpeg',
    data: validJpegBase64,
  });
  const overCountScan = await request('/api/scan', {
    method: 'POST',
    body: JSON.stringify({ images: sixImages }),
  });
  assert.equal(overCountScan.status, 400);
  assert.equal(overCountScan.data.error.code, 'INVALID_INPUT');
  console.log('   ✓ >5 images correctly rejected');

  // 4. Scan with invalid magic bytes
  console.log('4. Checking scan with invalid magic bytes (Expect 400 INVALID_IMAGE)...');
  const badMagicScan = await request('/api/scan', {
    method: 'POST',
    body: JSON.stringify({
      images: [
        {
          role: 'front',
          mimeType: 'image/jpeg',
          data: Buffer.from('NOT A REAL JPEG AT ALL').toString('base64'),
        },
      ],
    }),
  });
  assert.equal(badMagicScan.status, 400);
  assert.equal(badMagicScan.data.error.code, 'INVALID_IMAGE');
  console.log('   ✓ Invalid magic bytes correctly rejected');

  // 5. Valid scan (Runs canned demo mode or live)
  console.log('5. Checking valid scan with 1 image...');
  const validScan = await request('/api/scan', {
    method: 'POST',
    body: JSON.stringify({
      images: [
        {
          role: 'front',
          mimeType: 'image/jpeg',
          data: validJpegBase64,
        },
      ],
      ocr: [{ imageIndex: 0, text: 'MFG 15/11/2025 EXP 15/11/2026', meanConfidence: 0.95 }],
      hints: { category: 'food' },
    }),
  });
  assert.equal(validScan.status, 200);
  assert.ok(validScan.data.extraction);
  assert.ok(validScan.data.assessment);
  console.log('   ✓ Valid scan succeeded with status:', validScan.data.assessment.primaryStatus);

  // 6. Investigate with unclear identity
  console.log('6. Checking investigate with unclear identity (Expect SKIPPED_IDENTITY_UNCLEAR)...');
  const unclearInvestigate = await request('/api/investigate', {
    method: 'POST',
    body: JSON.stringify({
      identity: { brand: '', name: '', identityConfidence: 0.2 },
    }),
  });
  assert.equal(unclearInvestigate.status, 200);
  assert.equal(unclearInvestigate.data.investigation.status, 'SKIPPED_IDENTITY_UNCLEAR');
  console.log('   ✓ Unclear identity correctly gated');

  // 7. Security check: No secret keys leaked in any responses
  const allJson = JSON.stringify([health.data, emptyScan.data, validScan.data, unclearInvestigate.data]);
  assert.equal(/AIza[0-9A-Za-z_-]{20,}/.test(allJson), false);
  assert.equal(/tvly-[A-Za-z0-9_-]{16,}/.test(allJson), false);
  console.log('   ✓ Verified: Zero API keys or tokens leaked in responses');

  console.log('\nAll API Smoke Tests Passed Successfully!\n');
  server.close();
}

runSmokeTests().catch((err) => {
  console.error('Smoke test failed:', err);
  server.close();
  process.exit(1);
});

