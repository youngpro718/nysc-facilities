// ============================================================================
// API & SUPABASE
// ============================================================================
export const API_CONFIG = {
  supabase: {
    url: (import.meta.env.VITE_SUPABASE_URL as string) || 'https://fmymhtuiqzhupjyopfvi.supabase.co',
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE',
  },
} as const;

// ============================================================================
// STORAGE BUCKETS
// ============================================================================
export const STORAGE_BUCKETS = {
  courtroomPhotos: 'courtroom-photos',
  roomPhotos: 'room-photos',
  inventoryPhotos: 'inventory-photos',
  issuePhotos: 'issue-photos',
  avatars: 'avatars',
  termPdfs: 'term-pdfs',
} as const;

// ============================================================================
// TIMEOUTS (ms)
// ============================================================================
export const TIMEOUTS = {
  sessionFetch: 5000,
  profileFetch: 8000,
  roleFetch: 5000,
  mfaCheck: 5000,
  safetyGuard: 5000,
  verificationRedirect: 1500,
  copyConfirmation: 3000,
  submitDelay: 3000,
  cacheControlHeader: 3600,
} as const;

// ============================================================================
// POLLING INTERVALS (ms)
// ============================================================================
export const POLLING = {
  approvalCheck: 30000,
  verificationCheck: 3000,
} as const;

// ============================================================================
// QUERY CACHE STRATEGY (ms)
// ============================================================================
export const QUERY_CONFIG = {
  globalRetry: 3,

  stale: {
    realtime:  30_000,
    short:     60_000,
    medium:   300_000,
    long:     600_000,
  },

  gc: {
    short:    300_000,
    medium:   600_000,
    long:     900_000,
    veryLong: 1_800_000,
  },

  refetch: {
    realtime: 30_000,
    frequent: 60_000,
  },
} as const;

// ============================================================================
// RETRY COUNTS
// ============================================================================
export const RETRY = {
  none: false as const,
  once: 1,
  default: 2,
  aggressive: 3,
  loginMaxAttempts: 10,
  securityMaxAttempts: 5,
  backoffMaxDelay: 30_000,
} as const;

// ============================================================================
// PAGINATION LIMITS
// ============================================================================
export const LIMITS = {
  roomsDropdown: 200,
  profilesDropdown: 100,
  adminDefault: 100,
  courtRecentActivity: 8,
  cmcDashboard: 3,
  occupancyComparison: 5,
  formIntake: 10,
  activityLogExpanded: 200,
  activityLogCollapsed: 50,
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================
export const Z = {
  base: 0,
  hallway: 2,
  flow: 100,
  select: 200,
  selectNested1: 100,
  selectNested2: 90,
  selectNested3: 80,
  popover: 100,
  popoverElevated: 110,
  sheetOverlay: 99,
  sheet: 100,
  dialogOverlay: 104,
  dialog: 105,
  toast: 110,
  help: 60,
  tour: 10_000,
  dev: 9_999,
} as const;

// ============================================================================
// 3D SCENE
// ============================================================================
export const SCENE_3D = {
  camera: { near: 1, far: 5000 },
  controls: {
    maxDistanceDefault: 3000,
    maxDistanceManager: 1000,
    maxDistanceBlueprint: 2000,
    maxDistanceViewer: 2000,
  },
  canvas: { min: -10_000, max: 10_000 },
  pixelsPerSqm: 10_000,
} as const;

// ============================================================================
// NOTIFICATIONS
// ============================================================================
export const TOAST_DURATION = {
  highUrgency: 10_000,
  normal: 6_000,
} as const;

// ============================================================================
// DEBUG / FEATURE FLAGS
// ============================================================================
export const DEBUG = {
  logLevel: import.meta.env.VITE_LOG_LEVEL ?? 'info',
  disableModuleGates: import.meta.env.VITE_DISABLE_MODULE_GATES === 'true',
} as const;
