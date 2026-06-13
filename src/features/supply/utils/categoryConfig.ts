/**
 * Shared category visuals + derivation for the supply order form.
 * Used by both the mobile (QuickSupplyRequest) and desktop (QuickOrderGrid)
 * experiences so categories and icons stay consistent, and so the list is
 * driven by the inventory that actually exists rather than a hardcoded
 * allow-list.
 */

export interface CategoryVisual {
  icon: string;
  gradient: string;
  description: string;
}

const CONFIG: Record<string, CategoryVisual> = {
  'Office Supplies': {
    icon: '📎',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    description: 'Pens, paper, filing & desk items',
  },
  'Furniture': {
    icon: '🪑',
    gradient: 'from-amber-500/20 to-orange-500/10',
    description: 'Chairs, easels, racks, mats',
  },
  'Electronics': {
    icon: '🔌',
    gradient: 'from-purple-500/20 to-violet-500/10',
    description: 'Cables, clocks, devices',
  },
  'Cleaning Supplies': {
    icon: '🧹',
    gradient: 'from-green-500/20 to-emerald-500/10',
    description: 'Wipes, sanitizer, dusters',
  },
  'Safety Equipment': {
    icon: '🦺',
    gradient: 'from-red-500/20 to-rose-500/10',
    description: 'PPE, first aid, fire safety',
  },
  'Miscellaneous': {
    icon: '📦',
    gradient: 'from-gray-500/20 to-slate-500/10',
    description: 'Courtroom & break-room items',
  },
};

const DEFAULT_VISUAL: CategoryVisual = {
  icon: '📦',
  gradient: 'from-gray-500/20 to-slate-500/10',
  description: 'Supplies',
};

/** Visual config for a category name, with a safe default for unknown categories. */
export function getCategoryVisual(name?: string | null): CategoryVisual {
  return (name && CONFIG[name]) || DEFAULT_VISUAL;
}

interface ItemWithCategory {
  inventory_categories?: { name?: string | null } | null;
}

/**
 * Distinct category names present in the given items, with ≥1 item each.
 * Ordered with "Office Supplies" first (the bulk), then alphabetical.
 * This replaces the old hardcoded ALLOWED_CATEGORIES so the picker only ever
 * shows categories the facility actually stocks.
 */
export function deriveCategories(items: ItemWithCategory[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const name = item.inventory_categories?.name;
    if (name) set.add(name);
  }
  return [...set].sort((a, b) => {
    if (a === 'Office Supplies') return -1;
    if (b === 'Office Supplies') return 1;
    return a.localeCompare(b);
  });
}
