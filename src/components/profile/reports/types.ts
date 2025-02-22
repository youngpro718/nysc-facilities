
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export type ReportProgress = {
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress: number;
  message?: string;
};

export type ReportCallback = (progress: ReportProgress) => void;

export interface LightingFixture {
  id: string;
  name: string;
  type: string;
  status: string;
  zone?: {
    name: string;
  };
}

export interface Occupant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  status: string;
  room_assignments: {
    rooms: {
      name: string;
    };
  }[];
}

export interface DatabaseTable {
  table_name: string;
  table_schema: string;
}

export type QueryBuilder<T> = PostgrestFilterBuilder<any, any, T[]>;
