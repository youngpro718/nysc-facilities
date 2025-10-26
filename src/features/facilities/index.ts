/**
 * Facilities Feature - Public API
 * 
 * This is the single entry point for the Facilities feature.
 * All exports from this feature should go through this file.
 * 
 * @module features/facilities
 */

// ============================================================================
// MODEL (Types, Enums, Business Logic)
// ============================================================================
export * from './model';

// ============================================================================
// HOOKS
// ============================================================================
export * from './hooks/useFacilities';
export * from './hooks/useFacilitiesMutations';

// ============================================================================
// SERVICES (Internal - only export if needed by other features)
// ============================================================================
export { facilitiesService } from './services/facilitiesService';

// ============================================================================
// COMPONENTS
// ============================================================================
export * from './components';
