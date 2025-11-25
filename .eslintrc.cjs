/**
 * ESLint Configuration
 * 
 * Enforces architectural guardrails:
 * - Ban Supabase imports outside src/services/
 * - Enforce clean architecture patterns
 */

module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    
    // ========================================================================
    // ARCHITECTURAL GUARDRAILS
    // ========================================================================
    
    /*
     * Ban @supabase/supabase-js imports outside src/services/
     * 
     * Rationale: All database access must go through the service layer
     * to maintain clean architecture and make testing easier.
     * 
     * Allowed: src/services/ and src/lib/
     * Forbidden: src/pages/, src/components/, src/hooks/
     */
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@supabase/supabase-js',
            message: '❌ Direct Supabase imports are not allowed outside src/services/. Use service layer instead (e.g., import { facilitiesService } from "@features/facilities").',
          },
        ],
        patterns: [
          {
            group: ['**/lib/supabase'],
            message: '❌ Direct Supabase client imports are not allowed outside src/services/. Use service layer instead.',
          },
        ],
      },
    ],
  },
  
  // Override rules for specific directories
  overrides: [
    {
      // Allow Supabase imports in services directory
      files: ['src/services/**/*.ts', 'src/services/**/*.tsx'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    {
      // Allow Supabase imports in feature services
      files: ['src/features/**/services/**/*.ts'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    {
      // Allow Supabase imports in lib directory (core infrastructure)
      files: ['src/lib/**/*.ts', 'src/lib/**/*.tsx'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    {
      // Allow Supabase imports in hooks (data fetching layer)
      files: ['src/hooks/**/*.ts', 'src/hooks/**/*.tsx'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    {
      // Allow Supabase imports in providers (context/state management)
      files: ['src/providers/**/*.ts', 'src/providers/**/*.tsx'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    {
      // Allow Supabase imports in component-local services
      files: ['src/components/**/services/**/*.ts', 'src/components/**/services/**/*.tsx'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    {
      // Allow Supabase imports in component-local hooks (data fetching)
      files: ['src/components/**/hooks/**/*.ts', 'src/components/**/hooks/**/*.tsx'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};
