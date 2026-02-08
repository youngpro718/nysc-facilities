/**
 * Title-Based Role Mapping System
 * 
 * SIMPLIFIED VERSION: Admin defines exact title matches in the database.
 * This system checks user's title against admin-defined rules.
 */

import { CourtRole } from "@/hooks/useRolePermissions";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface TitleRoleMapping {
  keywords: string[];
  role: CourtRole;
  description: string;
  accessDescription: string;
}

// Simple in-memory cache for title rules
let titleRulesCache: Array<{ title: string; role: CourtRole }> | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Comprehensive title-to-role mapping
 * Titles are matched case-insensitively against keywords
 * Simplified to 4 roles: admin, cmc, court_aide, standard
 */
export const TITLE_ROLE_MAPPINGS: TitleRoleMapping[] = [
  // ADMIN - Full system access
  {
    keywords: ["administrator", "admin", "system admin", "it admin", "director", "facilities manager", "facility manager", "building manager", "facilities director", "facilities coordinator", "facility coordinator"],
    role: "admin",
    description: "System Administrator",
    accessDescription: "Full access to all features and settings"
  },

  // CMC - Court Management Coordinator  
  {
    keywords: [
      "cmc",
      "court management",
      "management coordinator",
      "operations coordinator"
    ],
    role: "cmc",
    description: "Court Management Coordinator",
    accessDescription: "Access to court operations, scheduling, and key management"
  },

  // COURT AIDE - Supply/Inventory/Purchasing Staff
  {
    keywords: [
      "supply",
      "supplies",
      "inventory",
      "warehouse",
      "stock",
      "procurement",
      "quartermaster",
      "supply clerk",
      "inventory clerk",
      "warehouse clerk",
      "supply room",
      "storekeeper",
      "purchasing",
      "buyer",
      "procurement specialist",
      "purchasing agent",
      "court aide"
    ],
    role: "court_aide",
    description: "Court Aide / Supply Staff",
    accessDescription: "Full access to inventory and supply requests"
  },

  // STANDARD - Court operations and all other personnel
  {
    keywords: [
      "judge",
      "justice",
      "magistrate",
      "judicial",
      "honorable",
      "judicial aide",
      "court assistant",
      "clerk",
      "court clerk",
      "deputy clerk",
      "chief clerk",
      "judicial clerk",
      "sergeant",
      "court sergeant",
      "security sergeant",
      "captain",
      "court officer",
      "judicial officer",
      "peace officer",
      "bailiff",
      "court bailiff",
      "court reporter",
      "stenographer",
      "transcriptionist",
      "administrative assistant",
      "admin assistant",
      "executive assistant",
      "secretary",
      "office manager",
      "staff",
      "employee",
      "worker",
      "personnel",
      "member"
    ],
    role: "standard",
    description: "Standard User",
    accessDescription: "Basic access to issues and supply requests"
  }
];

/**
 * Fetch title rules from database (with caching)
 */
async function fetchTitleRules(): Promise<Array<{ title: string; role: CourtRole }>> {
  const now = Date.now();
  
  // Return cached rules if still valid
  if (titleRulesCache && (now - lastFetch) < CACHE_DURATION) {
    return titleRulesCache;
  }

  try {
    const { data, error } = await supabase
      .from("title_access_rules")
      .select("title, role");

    if (error) {
      logger.warn("[Title Mapping] Could not fetch rules from database:", error);
      return [];
    }

    titleRulesCache = data || [];
    lastFetch = now;
    return titleRulesCache;
  } catch (err) {
    logger.warn("[Title Mapping] Error fetching title rules:", err);
    return [];
  }
}

/**
 * Determines the appropriate role based on job title
 * SIMPLIFIED: Checks exact matches against admin-defined rules
 * @param title - The user's job title
 * @returns The matched role or 'standard' as default
 */
export async function getRoleFromTitleAsync(title: string | null | undefined): Promise<CourtRole> {
  if (!title || title.trim() === "") {
    return "standard";
  }

  const normalizedTitle = title.toLowerCase().trim();

  // Fetch rules from database
  const rules = await fetchTitleRules();

  // Check for exact match (case-insensitive)
  for (const rule of rules) {
    if (rule.title.toLowerCase() === normalizedTitle) {
      logger.debug(`[Title Mapping] Matched "${title}" to role "${rule.role}"`);
      return rule.role;
    }
  }

  // Fallback to keyword matching from predefined mappings
  for (const mapping of TITLE_ROLE_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (normalizedTitle.includes(keyword.toLowerCase())) {
        logger.debug(`[Title Mapping] Matched "${title}" to role "${mapping.role}" via keyword "${keyword}"`);
        return mapping.role;
      }
    }
  }

  // Default to standard if no match found
  logger.debug(`[Title Mapping] No match found for "${title}", defaulting to "standard"`);
  return "standard";
}

/**
 * Synchronous version for backward compatibility
 * Uses keyword matching only (no database lookup)
 */
export function getRoleFromTitle(title: string | null | undefined): CourtRole {
  if (!title || title.trim() === "") {
    return "standard";
  }

  const normalizedTitle = title.toLowerCase().trim();

  // Check cached rules first
  if (titleRulesCache) {
    for (const rule of titleRulesCache) {
      if (rule.title.toLowerCase() === normalizedTitle) {
        return rule.role;
      }
    }
  }

  // Find the first matching role based on keywords
  for (const mapping of TITLE_ROLE_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (normalizedTitle.includes(keyword.toLowerCase())) {
        logger.debug(`[Title Mapping] Matched "${title}" to role "${mapping.role}" via keyword "${keyword}"`);
        return mapping.role;
      }
    }
  }

  // Default to standard if no match found
  logger.debug(`[Title Mapping] No match found for "${title}", defaulting to "standard"`);
  return "standard";
}

/**
 * Gets the role description for a given title
 * @param title - The user's job title
 * @returns Description of the assigned role
 */
export function getRoleDescriptionFromTitle(title: string | null | undefined): string {
  const role = getRoleFromTitle(title);
  const mapping = TITLE_ROLE_MAPPINGS.find(m => m.role === role);
  return mapping?.description || "Standard User";
}

/**
 * Gets the access description for a given title
 * @param title - The user's job title
 * @returns Description of what the user can access
 */
export function getAccessDescriptionFromTitle(title: string | null | undefined): string {
  const role = getRoleFromTitle(title);
  const mapping = TITLE_ROLE_MAPPINGS.find(m => m.role === role);
  return mapping?.accessDescription || "Basic access to issues and supply requests";
}

/**
 * Validates if a title would grant specific permissions
 * @param title - The user's job title
 * @param requiredRole - The minimum role required
 * @returns Whether the title grants sufficient permissions
 */
export function titleGrantsRole(title: string | null | undefined, requiredRole: CourtRole): boolean {
  const assignedRole = getRoleFromTitle(title);
  
  // Admin has access to everything
  if (assignedRole === "admin") return true;
  
  // Exact match
  if (assignedRole === requiredRole) return true;
  
  return false;
}

/**
 * Gets suggested titles for a specific role (for UI autocomplete)
 * @param role - The target role
 * @returns Array of suggested titles
 */
export function getSuggestedTitlesForRole(role: CourtRole): string[] {
  const mapping = TITLE_ROLE_MAPPINGS.find(m => m.role === role);
  if (!mapping) return [];
  
  // Return the first 3 keywords as suggestions, capitalized
  return mapping.keywords.slice(0, 3).map(keyword => 
    keyword.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  );
}

/**
 * Gets all available roles with their descriptions
 * @returns Array of role information
 */
export function getAllRoleDescriptions(): Array<{
  role: CourtRole;
  description: string;
  accessDescription: string;
  exampleTitles: string[];
}> {
  return TITLE_ROLE_MAPPINGS.map(mapping => ({
    role: mapping.role,
    description: mapping.description,
    accessDescription: mapping.accessDescription,
    exampleTitles: mapping.keywords.slice(0, 3)
  }));
}
