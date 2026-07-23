/**
 * New/used condition only means something for durable goods (furniture) —
 * consumables like pens or paper are never "used" in a way worth tracking.
 * Gate the condition UI on category name so it doesn't show up everywhere.
 */
const CONDITION_TRACKED_CATEGORY = "Furniture";

export function categoryTracksCondition(categoryName?: string | null): boolean {
  return categoryName === CONDITION_TRACKED_CATEGORY;
}
