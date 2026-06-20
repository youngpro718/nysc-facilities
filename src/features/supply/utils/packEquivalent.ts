/**
 * Format a quantity in smallest units as a human-readable pack equivalent.
 *
 * - `formatPackEquivalent(12, 'pen', 12)` → `"1 pack (12 pens)"`
 * - `formatPackEquivalent(8, 'battery', 4)` → `"2 packs (8 batteries)"`
 * - `formatPackEquivalent(5, 'battery', 4)` → `"5 batteries"`   (not a clean multiple)
 * - `formatPackEquivalent(30, 'pencil', null)` → `"30 pencils"` (no pack size)
 *
 * Pluralization is naive (`+'s'`). Inventory item labels are not pluralized in
 * the DB, and the supply catalog uses simple English nouns.
 */
export function formatPackEquivalent(
  quantity: number,
  unitLabel: string | null | undefined,
  packSize: number | null | undefined,
): string {
  const label = (unitLabel || 'each').trim();
  const plural = quantity === 1 ? label : pluralize(label);

  if (!packSize || packSize <= 0 || quantity <= 0) {
    return `${quantity} ${plural}`;
  }

  if (quantity % packSize !== 0) {
    return `${quantity} ${plural}`;
  }

  const packs = quantity / packSize;
  const packWord = packs === 1 ? 'pack' : 'packs';
  return `${packs} ${packWord} (${quantity} ${plural})`;
}

function pluralize(word: string): string {
  if (!word) return word;
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) return word + 'es';
  if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies';
  return word + 's';
}
