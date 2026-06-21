export const SUPPLY_SLA_WARNING_DAYS = 5;
export const SUPPLY_SLA_CRITICAL_DAYS = 30;

const CLOSED_STATUSES = new Set(['completed', 'fulfilled', 'rejected', 'cancelled']);

export type SupplySlaLevel = 'ok' | 'warning' | 'critical';

export function getSupplyAgeDays(createdAt: string | Date, now = new Date()): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(createdAt).getTime()) / 86_400_000),
  );
}

export function getSupplySlaLevel(
  status: string | null | undefined,
  createdAt: string | Date,
  now = new Date(),
): SupplySlaLevel {
  if (!status || CLOSED_STATUSES.has(status)) return 'ok';
  const ageDays = getSupplyAgeDays(createdAt, now);
  if (ageDays > SUPPLY_SLA_CRITICAL_DAYS) return 'critical';
  if (ageDays > SUPPLY_SLA_WARNING_DAYS) return 'warning';
  return 'ok';
}

