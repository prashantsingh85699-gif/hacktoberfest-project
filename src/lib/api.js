export async function getHealth() {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
  return await res.json();
}

export async function postScan(payload) {
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || `Scan request failed with HTTP ${res.status}`;
    const code = data?.error?.code || 'SCAN_ERROR';
    const err = new Error(message);
    err.code = code;
    throw err;
  }
  return data;
}

export async function postInvestigate(payload) {
  const res = await fetch('/api/investigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || `Investigation failed with HTTP ${res.status}`;
    const err = new Error(message);
    err.code = data?.error?.code || 'INVESTIGATION_ERROR';
    throw err;
  }
  return data;
}

