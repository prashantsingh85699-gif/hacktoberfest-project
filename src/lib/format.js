import { PRIMARY_STATUS, STATUS_CONFIG, PROVENANCE } from '../../shared/constants.js';

export function getStatusDetails(status) {
  return STATUS_CONFIG[status] || {
    label: status,
    color: 'slate',
    meaning: 'Status not recognized',
  };
}

export function formatProvenanceBadge(provenance) {
  switch (provenance) {
    case PROVENANCE.PRINTED:
      return { label: 'PRINTED ON PACK', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case PROVENANCE.LABEL_RULE:
      return { label: 'LABEL RULE', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    case PROVENANCE.MANUFACTURER_CONFIRMED:
      return { label: 'MANUFACTURER CONFIRMED', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    case PROVENANCE.CALCULATED:
      return { label: 'CALCULATED', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
    default:
      return { label: 'UNKNOWN PROVENANCE', color: 'bg-slate-100 text-slate-700 border-slate-300' };
  }
}

export function formatIsoDate(iso) {
  if (!iso) return 'Not available';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

