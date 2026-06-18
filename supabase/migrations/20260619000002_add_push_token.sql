-- profiles テーブルに push_token カラムを追加
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token text;
