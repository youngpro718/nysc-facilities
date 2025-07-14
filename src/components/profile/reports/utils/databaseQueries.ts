import { supabase } from "@/integrations/supabase/client";
import { ReportCallback } from '../types';
import { handleReportError, validateReportData, createRetryableQuery } from './reportErrorHandler';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

export interface QueryResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

export async function executeQuery<T = any>(
  queryBuilder: any,
  tableName: string,
  progressCallback: ReportCallback
): Promise<QueryResult<T>> {
  try {
    progressCallback({
      status: 'generating',
      progress: 10,
      message: `Querying ${tableName} table...`
    });

    const queryFn = async () => {
      const { data, error, count } = await queryBuilder;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return { data, count };
    };

    const result = await createRetryableQuery(queryFn);
    const validatedData = validateReportData<T>(result.data, tableName, progressCallback);
    
    progressCallback({
      status: 'generating',
      progress: 30,
      message: `Found ${validatedData.length} ${tableName} records`
    });

    return {
      data: validatedData,
      count: result.count || validatedData.length,
      hasMore: validatedData.length === 1000
    };
  } catch (error) {
    handleReportError(error, progressCallback, `executeQuery(${tableName})`);
  }
}

export async function executeCustomQuery<T = any>(
  query: any,
  queryName: string,
  progressCallback: ReportCallback
): Promise<T[]> {
  try {
    progressCallback({
      status: 'generating',
      progress: 10,
      message: `Executing ${queryName} query...`
    });

    const queryFn = async () => {
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      return data;
    };

    const data = await createRetryableQuery(queryFn);
    const validatedData = validateReportData<T>(data, queryName, progressCallback);
    
    progressCallback({
      status: 'generating',
      progress: 30,
      message: `Query completed: ${validatedData.length} records`
    });

    return validatedData;
  } catch (error) {
    handleReportError(error, progressCallback, `executeCustomQuery(${queryName})`);
  }
}

export async function checkTableExists(tableName: string): Promise<boolean> {
  // List of known tables that should exist
  const knownTables = [
    'issues', 'rooms', 'occupants', 'keys', 'lighting_fixtures',
    'buildings', 'floors', 'profiles', 'user_roles'
  ];
  
  return knownTables.includes(tableName);
}

export async function getTableSchema(tableName: string): Promise<any[]> {
  // Return basic schema info for known tables
  const schemas: Record<string, any[]> = {
    issues: [
      { column_name: 'id', data_type: 'uuid' },
      { column_name: 'title', data_type: 'text' },
      { column_name: 'status', data_type: 'text' },
      { column_name: 'priority', data_type: 'text' },
      { column_name: 'created_at', data_type: 'timestamp' }
    ],
    rooms: [
      { column_name: 'id', data_type: 'uuid' },
      { column_name: 'name', data_type: 'text' },
      { column_name: 'room_number', data_type: 'text' },
      { column_name: 'status', data_type: 'text' }
    ],
    occupants: [
      { column_name: 'id', data_type: 'uuid' },
      { column_name: 'first_name', data_type: 'text' },
      { column_name: 'last_name', data_type: 'text' },
      { column_name: 'email', data_type: 'text' },
      { column_name: 'status', data_type: 'text' }
    ]
  };
  
  return schemas[tableName] || [];
}

export function buildSafeQuery(query: any, conditions: Record<string, any> = {}) {
  let safeQuery = query;

  // Add conditions safely
  Object.entries(conditions).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        safeQuery = safeQuery.in(key, value);
      } else if (typeof value === 'string' && value.includes('%')) {
        safeQuery = safeQuery.ilike(key, value);
      } else {
        safeQuery = safeQuery.eq(key, value);
      }
    }
  });

  return safeQuery;
}

export async function getAvailableTables(): Promise<string[]> {
  // Return list of known available tables
  return [
    'issues', 'rooms', 'occupants', 'keys', 'lighting_fixtures',
    'buildings', 'floors', 'profiles', 'user_roles'
  ];
}