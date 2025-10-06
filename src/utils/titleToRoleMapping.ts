/**
 * Title-Based Role Mapping System
 * 
 * This system automatically assigns user roles and permissions based on their job title
 * during the onboarding process. This ensures proper access control from the start.
 */

import { CourtRole } from "@/hooks/useRolePermissions";

export interface TitleRoleMapping {
  keywords: string[];
  role: CourtRole;
  description: string;
  accessDescription: string;
}

/**
 * Comprehensive title-to-role mapping
 * Titles are matched case-insensitively against keywords
 */
export const TITLE_ROLE_MAPPINGS: TitleRoleMapping[] = [
  // ADMIN - Full system access
  {
    keywords: ["administrator", "admin", "system admin", "it admin", "director"],
    role: "admin",
    description: "System Administrator",
    accessDescription: "Full access to all features and settings"
  },

  // FACILITIES MANAGER - Building management
  {
    keywords: [
      "facilities manager",
      "facility manager",
      "building manager",
      "facilities director",
      "facilities coordinator",
      "facility coordinator"
    ],
    role: "facilities_manager",
    description: "Facilities Manager",
    accessDescription: "Full access to spaces, issues, maintenance, keys, and lighting"
  },

  // SUPPLY ROOM STAFF - Inventory and supply management
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
      "storekeeper"
    ],
    role: "supply_room_staff",
    description: "Supply Room Staff",
    accessDescription: "Full access to inventory and supply requests"
  },

  // COURT OPERATIONS - Judges and court personnel
  {
    keywords: [
      "judge",
      "justice",
      "magistrate",
      "judicial",
      "honorable"
    ],
    role: "judge",
    description: "Judge/Justice",
    accessDescription: "Access to court operations, issues, supply requests, and keys"
  },

  {
    keywords: [
      "court aide",
      "judicial aide",
      "court assistant"
    ],
    role: "court_aide",
    description: "Court Aide",
    accessDescription: "Access to spaces, issues, occupants, inventory, and supply requests"
  },

  {
    keywords: [
      "clerk",
      "court clerk",
      "deputy clerk",
      "chief clerk",
      "judicial clerk"
    ],
    role: "clerk",
    description: "Court Clerk",
    accessDescription: "Access to issues, occupants, supply requests, and keys"
  },

  {
    keywords: [
      "sergeant",
      "court sergeant",
      "security sergeant",
      "captain"
    ],
    role: "sergeant",
    description: "Sergeant/Security",
    accessDescription: "Full access to keys, spaces, issues, and operations"
  },

  {
    keywords: [
      "court officer",
      "judicial officer",
      "peace officer"
    ],
    role: "court_officer",
    description: "Court Officer",
    accessDescription: "Access to issues, occupants, keys, and operations"
  },

  {
    keywords: [
      "bailiff",
      "court bailiff"
    ],
    role: "bailiff",
    description: "Bailiff",
    accessDescription: "Access to issues, occupants, supply requests, and keys"
  },

  {
    keywords: [
      "court reporter",
      "stenographer",
      "transcriptionist"
    ],
    role: "court_reporter",
    description: "Court Reporter",
    accessDescription: "Access to issues and supply requests"
  },

  // ADMINISTRATIVE STAFF
  {
    keywords: [
      "administrative assistant",
      "admin assistant",
      "executive assistant",
      "secretary",
      "office manager"
    ],
    role: "administrative_assistant",
    description: "Administrative Assistant",
    accessDescription: "Full access to occupants, issues, supply requests, and keys"
  },

  // DEFAULT - Standard user
  {
    keywords: ["staff", "employee", "worker", "personnel", "member"],
    role: "standard",
    description: "Standard User",
    accessDescription: "Basic access to issues and supply requests"
  }
];

/**
 * Determines the appropriate role based on job title
 * @param title - The user's job title
 * @returns The matched role or 'standard' as default
 */
export function getRoleFromTitle(title: string | null | undefined): CourtRole {
  if (!title || title.trim() === "") {
    return "standard";
  }

  const normalizedTitle = title.toLowerCase().trim();

  // Find the first matching role based on keywords
  for (const mapping of TITLE_ROLE_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (normalizedTitle.includes(keyword.toLowerCase())) {
        console.log(`[Title Mapping] Matched "${title}" to role "${mapping.role}" via keyword "${keyword}"`);
        return mapping.role;
      }
    }
  }

  // Default to standard if no match found
  console.log(`[Title Mapping] No match found for "${title}", defaulting to "standard"`);
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
  
  // Facilities manager has elevated permissions
  if (assignedRole === "facilities_manager" && 
      ["standard", "clerk", "bailiff", "court_reporter"].includes(requiredRole)) {
    return true;
  }
  
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
