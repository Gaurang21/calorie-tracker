// Parses Apple Health `export.xml` client-side.
// Extracts: BodyMass, ActiveEnergyBurned, StepCount.
// Returns daily-aggregated, deduplicated records ready for Supabase upsert.

const TYPE_MAP = {
  HKQuantityTypeIdentifierBodyMass: 'weight',
  HKQuantityTypeIdentifierActiveEnergyBurned: 'energy',
  HKQuantityTypeIdentifierStepCount: 'steps',
};

function toDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function kgFromUnit(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (!unit) return n;
  if (unit === 'kg') return n;
  if (unit === 'lb') return +(n / 2.20462).toFixed(2);
  if (unit === 'g') return +(n / 1000).toFixed(2);
  return n;
}

export function parseAppleHealthExport(xmlString) {
  const result = { weight: [], energy: [], steps: [], errors: [] };
  if (!xmlString || typeof xmlString !== 'string') {
    result.errors.push('Empty or invalid input');
    return result;
  }

  let doc;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(xmlString, 'application/xml');
    const errNode = doc.querySelector('parsererror');
    if (errNode) {
      result.errors.push('Malformed XML');
      return result;
    }
  } catch (e) {
    result.errors.push('Failed to parse XML');
    return result;
  }

  const records = doc.getElementsByTagName('Record');
  const weightByDate = new Map();
  const energyByDate = new Map();
  const stepsByDate = new Map();

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const type = rec.getAttribute('type');
    const kind = TYPE_MAP[type];
    if (!kind) continue;

    const date = toDateOnly(rec.getAttribute('startDate') || rec.getAttribute('creationDate'));
    if (!date) continue;
    const value = Number(rec.getAttribute('value'));
    if (!Number.isFinite(value)) continue;
    const unit = rec.getAttribute('unit');

    if (kind === 'weight') {
      const kg = kgFromUnit(value, unit);
      if (kg == null) continue;
      // Latest entry per day wins
      const existing = weightByDate.get(date);
      if (!existing || new Date(rec.getAttribute('startDate') || 0) >= new Date(existing._ts || 0)) {
        weightByDate.set(date, { date, weight_kg: kg, _ts: rec.getAttribute('startDate') });
      }
    } else if (kind === 'energy') {
      energyByDate.set(date, (energyByDate.get(date) || 0) + value);
    } else if (kind === 'steps') {
      stepsByDate.set(date, (stepsByDate.get(date) || 0) + value);
    }
  }

  for (const v of weightByDate.values()) {
    delete v._ts;
    result.weight.push(v);
  }
  for (const [date, total] of energyByDate.entries()) {
    result.energy.push({
      date,
      activity_type: 'Apple Health',
      calories_burned: Math.round(total),
      duration_mins: null,
      notes: 'Imported from Apple Health',
    });
  }
  for (const [date, total] of stepsByDate.entries()) {
    result.steps.push({ date, steps: Math.round(total) });
  }

  result.weight.sort((a, b) => a.date.localeCompare(b.date));
  result.energy.sort((a, b) => a.date.localeCompare(b.date));
  result.steps.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

// Deduplicate against existing records (e.g. previously uploaded) by date.
export function dedupeByDate(newRecords, existingDates) {
  const set = new Set(existingDates || []);
  return newRecords.filter((r) => !set.has(r.date));
}
