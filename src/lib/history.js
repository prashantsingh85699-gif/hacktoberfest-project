import { get, set, del, keys } from 'idb-keyval';

const HISTORY_PREFIX = 'expirywatch:scan:';

export async function saveScanRecord(record) {
  if (!record || !record.id) return;
  const key = `${HISTORY_PREFIX}${record.id}`;
  const data = {
    ...record,
    savedAt: record.savedAt || new Date().toISOString(),
  };
  await set(key, data);
  return data;
}

export async function getScanRecord(id) {
  if (!id) return null;
  const key = `${HISTORY_PREFIX}${id}`;
  return await get(key);
}

export async function listScanRecords() {
  try {
    const allKeys = await keys();
    const scanKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(HISTORY_PREFIX));
    const records = [];
    for (const k of scanKeys) {
      const rec = await get(k);
      if (rec) records.push(rec);
    }
    // Sort descending by savedAt
    records.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    return records;
  } catch (err) {
    console.error('Failed to load scan history:', err);
    return [];
  }
}

export async function deleteScanRecord(id) {
  if (!id) return;
  const key = `${HISTORY_PREFIX}${id}`;
  await del(key);
}

export async function clearAllScanRecords() {
  const allKeys = await keys();
  const scanKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(HISTORY_PREFIX));
  for (const k of scanKeys) {
    await del(k);
  }
}

export function exportHistoryAsJson(records = []) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `expirywatch-history-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

