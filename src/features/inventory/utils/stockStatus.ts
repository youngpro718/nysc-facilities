/**
 * Centralized stock-status rules. All inventory panels MUST use these
 * helpers so counts and badges stay consistent across the app.
 *
 * Definitions:
 *  - ok        : tracked (minimum_quantity > 0) and quantity >= minimum_quantity, OR not tracked
 *  - low       : tracked and 0 < quantity < minimum_quantity
 *  - critical  : low and quantity <= minimum_quantity * 0.5
 *  - out       : tracked and quantity <= 0
 */

export type StockStatus = "ok" | "low" | "critical" | "out";

export interface StockItem {
  quantity: number | null | undefined;
  minimum_quantity?: number | null | undefined;
}

const min = (i: StockItem) => Number(i.minimum_quantity ?? 0);
const qty = (i: StockItem) => Number(i.quantity ?? 0);

export const isTracked = (i: StockItem) => min(i) > 0;
export const isOutOfStock = (i: StockItem) => isTracked(i) && qty(i) <= 0;
export const isLowStock = (i: StockItem) =>
  isTracked(i) && qty(i) > 0 && qty(i) < min(i);
export const isCriticalStock = (i: StockItem) =>
  isLowStock(i) && qty(i) <= min(i) * 0.5;

export function getStockStatus(i: StockItem): StockStatus {
  if (!isTracked(i)) return "ok";
  if (qty(i) <= 0) return "out";
  if (qty(i) < min(i)) {
    return qty(i) <= min(i) * 0.5 ? "critical" : "low";
  }
  return "ok";
}

/** Items needing attention (low OR out). Use for alert counts. */
export const needsAttention = (i: StockItem) => isLowStock(i) || isOutOfStock(i);

export function countLowStock<T extends StockItem>(items: T[] | null | undefined): number {
  return (items ?? []).filter(needsAttention).length;
}
