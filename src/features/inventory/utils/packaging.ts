/**
 * Packaging helpers — a shared single source of truth for how an inventory item's
 * smallest unit rolls up into packs and cases. Used by the Stock editor preview,
 * the Order Supplies buttons, and the "= 1 box" equivalents so they never disagree.
 *
 * Tiers: single (unit) -> pack (pack_size singles) -> case (case_size packs).
 */

export interface PackagingInfo {
  unit?: string | null;        // smallest unit label, e.g. "battery"
  pack_label?: string | null;  // middle tier label, e.g. "pack" / "box"
  pack_size?: number | null;   // singles per pack, e.g. 4
  case_label?: string | null;  // top tier label, e.g. "case"
  case_size?: number | null;   // packs per case, e.g. 26
}

const label = (value: string | null | undefined, fallback: string): string => {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : fallback;
};

/** Pluralize an English noun well enough for supply labels (battery -> batteries, box -> boxes). */
export function pluralize(word: string): string {
  const w = (word ?? "").trim();
  if (!w) return w;
  if (/[^aeiou]y$/i.test(w)) return w.replace(/y$/i, "ies");
  if (/(s|x|z|ch|sh)$/i.test(w)) return `${w}es`;
  return `${w}s`;
}

const plural = (n: number, word: string): string => `${n} ${n === 1 ? word : pluralize(word)}`;

/** Singles in one pack, or null if no pack tier is defined. */
export function singlesPerPack(p: PackagingInfo): number | null {
  return p.pack_size && p.pack_size > 0 ? p.pack_size : null;
}

/** Singles in one case, or null if the case tier isn't fully defined. */
export function singlesPerCase(p: PackagingInfo): number | null {
  const pack = singlesPerPack(p);
  if (pack && p.case_size && p.case_size > 0) return pack * p.case_size;
  return null;
}

/** True when the item has any packaging tier beyond the single unit. */
export function hasPackaging(p: PackagingInfo): boolean {
  return singlesPerPack(p) !== null;
}

/**
 * Human description of the full ladder, e.g.
 * "1 pack = 4 batteries · 1 case = 26 packs = 104 batteries".
 * Returns null when only singles are defined.
 */
export function describePackaging(p: PackagingInfo): string | null {
  const unit = label(p.unit, "unit");
  const parts: string[] = [];
  const pack = singlesPerPack(p);
  if (pack) {
    parts.push(`1 ${label(p.pack_label, "pack")} = ${plural(pack, unit)}`);
  }
  const perCase = singlesPerCase(p);
  if (perCase && p.case_size) {
    parts.push(
      `1 ${label(p.case_label, "case")} = ${plural(p.case_size, label(p.pack_label, "pack"))} = ${plural(perCase, unit)}`,
    );
  }
  return parts.length ? parts.join(" · ") : null;
}

/**
 * Describe a raw quantity (in singles) in packaging terms when it lands exactly
 * on a tier, e.g. describeQuantity(12, pens) -> "12 pens = 1 box".
 */
export function describeQuantity(qty: number, p: PackagingInfo): string {
  const unit = label(p.unit, "unit");
  const base = plural(qty, unit);
  if (qty <= 0) return base;

  const perCase = singlesPerCase(p);
  if (perCase && qty % perCase === 0) {
    return `${base} = ${plural(qty / perCase, label(p.case_label, "case"))}`;
  }
  const pack = singlesPerPack(p);
  if (pack && qty % pack === 0) {
    return `${base} = ${plural(qty / pack, label(p.pack_label, "pack"))}`;
  }
  return base;
}

/** Auto-generated packaging_note from the structured tiers (kept as the display string). */
export function buildPackagingNote(p: PackagingInfo): string | null {
  return describePackaging(p);
}

/** Quick "+1 single / +1 pack / +1 case" step sizes available for an item. */
export function quickAddSteps(p: PackagingInfo): Array<{ label: string; singles: number }> {
  const steps: Array<{ label: string; singles: number }> = [
    { label: `1 ${label(p.unit, "unit")}`, singles: 1 },
  ];
  const pack = singlesPerPack(p);
  if (pack) steps.push({ label: `1 ${label(p.pack_label, "pack")}`, singles: pack });
  const perCase = singlesPerCase(p);
  if (perCase) steps.push({ label: `1 ${label(p.case_label, "case")}`, singles: perCase });
  return steps;
}
