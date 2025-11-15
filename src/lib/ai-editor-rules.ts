export const supabaseAIRules = {
  rls: {
    description: "Row Level Security (RLS) is a Postgres feature that restricts which rows can be accessed by different users",
    examples: [
      {
        name: "Basic RLS Policy",
        code: `
          -- Enable RLS
          alter table "public"."todos" enable row level security;

          -- Create policy to only allow users to see their own todos
          create policy "Users can view own todos" on todos for select
            using ( auth.uid() = user_id );
        `
      }
    ]
  },
  functions: {
    description: "Postgres functions are server-side functions that can be used to encapsulate logic",
    examples: [
      {
        name: "Basic Function",
        code: `
          create or replace function get_user_todos(user_id uuid)
          returns setof todos as $$
            select * from todos where user_id = $1;
          $$ language sql security definer;
        `
      }
    ]
  },
  policies: {
    description: "RLS policies define the conditions under which rows can be accessed",
    examples: [
      {
        name: "CRUD Policies",
        code: `
          -- Read policy
          create policy "Users can view own items" 
            on items for select using (auth.uid() = user_id);
          
          -- Insert policy  
          create policy "Users can create items"
            on items for insert with check (auth.uid() = user_id);
          
          -- Update policy
          create policy "Users can update own items"
            on items for update using (auth.uid() = user_id);
          
          -- Delete policy  
          create policy "Users can delete own items"
            on items for delete using (auth.uid() = user_id);
        `
      }
    ]
  },
  edgeFunctions: {
    description: "Supabase Edge Functions are serverless functions that run on the edge",
    examples: [
      {
        name: "Basic Edge Function",
        code: `
          // supabase/functions/hello-world/index.ts
          import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
          
          serve(async (req) => {
            const { name } = await req.json()
            const data = {
              message: \`Hello \${name}!\`,
            }
          
            return new Response(
              JSON.stringify(data),
              { headers: { "Content-Type": "application/json" } },
            )
          })
        `
      }
    ]
  },
  migrations: {
    description: "Database migrations are version controlled SQL files that track schema changes",
    examples: [
      {
        name: "Basic Migration",
        code: `
          -- Create tables
          create table public.profiles (
            id uuid references auth.users on delete cascade,
            updated_at timestamp with time zone,
            username text unique,
            avatar_url text,
            primary key (id)
          );

          -- Set up realtime
          alter publication supabase_realtime add table profiles;

          -- Set up security policies
          alter table public.profiles enable row level security;
          create policy "Public profiles are viewable by everyone."
            on profiles for select
            using ( true );
        `
      }
    ]
  },
  bestPractices: {
    description: "Best practices for working with Supabase and Postgres",
    rules: [
      "Always enable RLS on public tables",
      "Use security definer functions for privileged operations",
      "Add appropriate indexes for frequently queried columns",
      "Use appropriate data types (e.g., uuid for IDs)",
      "Implement proper error handling in Edge Functions",
      "Version control your database migrations",
      "Use parameterized queries to prevent SQL injection",
      "Keep Edge Functions stateless",
      "Use appropriate caching strategies",
      "Follow the principle of least privilege"
    ]
  }
} 