-- タスクリー 初期スキーマ
-- 2026-06-19 に Supabase Management API 経由で適用済み

-- ── テーブル ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text,
  name       text,
  role       text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  team_id    uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  push_token text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  team_id     uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.routines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  frequency   text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  team_id     uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.routine_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  done_date  date NOT NULL,
  UNIQUE(routine_id, user_id, done_date),
  created_at timestamptz DEFAULT now()
);

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE public.teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid());

-- teams
CREATE POLICY "teams_select" ON public.teams FOR SELECT TO authenticated
  USING (id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "teams_insert" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "teams_update" ON public.teams FOR UPDATE TO authenticated
  USING (id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

-- tasks
CREATE POLICY "tasks_all" ON public.tasks FOR ALL TO authenticated
  USING (team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()));

-- routines
CREATE POLICY "routines_all" ON public.routines FOR ALL TO authenticated
  USING (team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()));

-- routine_logs
CREATE POLICY "routine_logs_all" ON public.routine_logs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── RPC ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM anon;
