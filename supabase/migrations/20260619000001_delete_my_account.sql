-- RPC: delete_my_account
-- 呼び出したユーザー自身の auth.users レコードを削除する。
-- SECURITY DEFINER が必要（auth.users は通常ユーザーから触れないため）。
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- 認証済みユーザーのみ実行可能
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM anon;
