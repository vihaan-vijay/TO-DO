-- =====================================================================
-- Enable Row Level Security (RLS) on all public tables
-- Run this in Supabase SQL Editor to fix the Security Advisor errors
-- =====================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_TagToTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- 2. Since this is a backend-only API (no direct Supabase client auth from frontend),
--    we allow all operations from the service role (backend Prisma connection).
--    These policies allow the backend's database user full access.

-- Tasks table policies
CREATE POLICY "Allow all for service role" ON public.tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Subtasks table policies
CREATE POLICY "Allow all for service role" ON public.subtasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tags table policies
CREATE POLICY "Allow all for service role" ON public.tags
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Junction table policies
CREATE POLICY "Allow all for service role" ON public."_TagToTask"
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Migrations table (read-only for safety)
CREATE POLICY "Allow all for service role" ON public."_prisma_migrations"
  FOR ALL
  USING (true)
  WITH CHECK (true);
