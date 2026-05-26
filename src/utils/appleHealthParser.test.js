import { describe, it, expect } from 'vitest';
import { parseAppleHealthExport, dedupeByDate } from './appleHealthParser.js';

const sample = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData>
  <Record type="HKQuantityTypeIdentifierBodyMass" unit="kg" value="80.5" startDate="2025-01-01 08:00:00 +0000"/>
  <Record type="HKQuantityTypeIdentifierBodyMass" unit="kg" value="80.0" startDate="2025-01-01 20:00:00 +0000"/>
  <Record type="HKQuantityTypeIdentifierBodyMass" unit="lb" value="178" startDate="2025-01-02 08:00:00 +0000"/>
  <Record type="HKQuantityTypeIdentifierActiveEnergyBurned" unit="kcal" value="120" startDate="2025-01-01 09:00:00 +0000"/>
  <Record type="HKQuantityTypeIdentifierActiveEnergyBurned" unit="kcal" value="80" startDate="2025-01-01 18:00:00 +0000"/>
  <Record type="HKQuantityTypeIdentifierStepCount" unit="count" value="5000" startDate="2025-01-01 12:00:00 +0000"/>
  <Record type="HKQuantityTypeIdentifierStepCount" unit="count" value="3000" startDate="2025-01-01 20:00:00 +0000"/>
  <Record type="HKQuantityTypeIdentifierHeartRate" unit="count/min" value="72" startDate="2025-01-01 08:00:00 +0000"/>
</HealthData>`;

describe('parseAppleHealthExport', () => {
  it('extracts body mass with deduplication (latest per day wins)', () => {
    const r = parseAppleHealthExport(sample);
    expect(r.weight).toHaveLength(2);
    const d1 = r.weight.find((w) => w.date === '2025-01-01');
    expect(d1.weight_kg).toBe(80);
  });

  it('converts lb to kg', () => {
    const r = parseAppleHealthExport(sample);
    const d2 = r.weight.find((w) => w.date === '2025-01-02');
    expect(d2.weight_kg).toBeCloseTo(80.74, 1);
  });

  it('aggregates active energy burned per day', () => {
    const r = parseAppleHealthExport(sample);
    const e = r.energy.find((x) => x.date === '2025-01-01');
    expect(e.calories_burned).toBe(200);
  });

  it('aggregates step counts per day', () => {
    const r = parseAppleHealthExport(sample);
    const s = r.steps.find((x) => x.date === '2025-01-01');
    expect(s.steps).toBe(8000);
  });

  it('ignores unsupported record types', () => {
    const r = parseAppleHealthExport(sample);
    expect(r.weight).toHaveLength(2);
    expect(r.energy).toHaveLength(1);
  });

  it('handles malformed XML gracefully', () => {
    const r = parseAppleHealthExport('<not-valid');
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('handles empty input', () => {
    const r = parseAppleHealthExport('');
    expect(r.errors.length).toBeGreaterThan(0);
  });
});

describe('dedupeByDate', () => {
  it('drops records whose date already exists', () => {
    const incoming = [{ date: '2025-01-01' }, { date: '2025-01-02' }, { date: '2025-01-03' }];
    const result = dedupeByDate(incoming, ['2025-01-02']);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.date)).toEqual(['2025-01-01', '2025-01-03']);
  });
  it('handles empty existing set', () => {
    expect(dedupeByDate([{ date: '2025-01-01' }], [])).toHaveLength(1);
  });
});
