import type { ISODate } from '../types/db';

export function localISO(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayLocalISO(): ISODate {
  return localISO(new Date());
}

export function daysAgoLocalISO(n: number): ISODate {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localISO(d);
}

export function mondayOfLocal(date: Date = new Date()): ISODate {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return localISO(d);
}
