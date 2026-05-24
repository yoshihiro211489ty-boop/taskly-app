import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/** マジックリンクのURLハッシュからセッションを手動で復元（Expo Webでdetectが効かないケースの対策） */
async function tryRestoreSessionFromUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return;
  try {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      // URLをきれいにする
      window.history.replaceState(null, '', window.location.pathname);
    }
  } catch (e) {
    console.warn('[Auth] URL session restore failed:', e);
  }
}

export type UserRole = 'owner' | 'member';

export type UserProfile = Readonly<{
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  teamId: string | null;
  teamName: string | null;
}>;

type AuthContextValue = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  sendOtp: (email: string) => Promise<{ error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
  signInAsGuest: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  passwordRecoveryMode: boolean;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchUserProfile(
  userId: string,
  email: string | null
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, teams(id, name)')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return { profile: null, error: error.message };
  }
  if (!data) {
    return {
      profile: null,
      error: 'プロフィールが見つかりませんでした。',
    };
  }

  const team = Array.isArray(data.teams) ? data.teams[0] : data.teams;
  return {
    profile: {
      id: String(data.id ?? userId),
      email: (data.email as string | null) ?? email,
      name: (data.name as string | null) ?? null,
      role: ((data.role as string) === 'owner' ? 'owner' : 'member') as UserRole,
      teamId: team ? String(team.id) : null,
      teamName: team ? String(team.name) : null,
    },
    error: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // マジックリンクのURLハッシュを先に処理
      await tryRestoreSessionFromUrl();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecoveryMode(true);
        } else {
          setPasswordRecoveryMode(false);
        }
        setSession(newSession);
      }
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s?.user) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    const { profile: p, error } = await fetchUserProfile(
      s.user.id,
      s.user.email ?? null
    );
    setProfile(p);
    setProfileError(error);
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    loadProfile(session);
  }, [session, loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return error ? { error: error.message } : {};
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name } },
    });
    return error ? { error: error.message } : {};
  };

  const sendOtp = async (email: string) => {
    // Web: 現在のオリジン(localhost:8081 など)にリダイレクト
    // Native: taskly:// ディープリンク
    const redirectTo =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'taskly://login-callback';

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    });
    if (error) {
      if (error.message.includes('only request this after')) {
        const seconds = error.message.match(/(\d+) seconds/)?.[1] ?? '少し';
        return { error: `送信が多すぎます。${seconds}秒後にもう一度お試しください。` };
      }
      return { error: error.message };
    }
    return {};
  };

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });
    if (error) return { error: error.message };

    // 新規ユーザーの場合、profilesテーブルに行がなければ自動作成
    if (data.user) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();
      if (!existing) {
        const defaultName = data.user.email?.split('@')[0] ?? 'ユーザー';
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          name: defaultName,
          role: 'member',
        });
      }
    }
    return {};
  };

  const signOut = async () => {
    setPasswordRecoveryMode(false);
    await supabase.auth.signOut();
  };

  /** ゲストログイン（匿名）。Supabase Dashboard で Anonymous Sign-In を ON にしておくこと。 */
  const signInAsGuest = async (): Promise<{ error?: string }> => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      if (error.message.toLowerCase().includes('anonymous') || error.message.toLowerCase().includes('disabled')) {
        return {
          error:
            'ゲストログインが無効です。Supabaseダッシュボード → Authentication → Sign In / Up → Anonymous Sign-Ins を ON にしてください。',
        };
      }
      return { error: error.message };
    }
    // 匿名ユーザー用のプロフィールを作成
    if (data.user) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();
      if (!existing) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: null,
          name: 'ゲスト',
          role: 'member',
        });
      }
    }
    return {};
  };

  const refreshProfile = async () => {
    await loadProfile(session);
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setPasswordRecoveryMode(false);
    return error ? { error: error.message } : {};
  };

  // NOTE: Requires a Supabase RPC 'delete_my_account' that calls
  // DELETE FROM auth.users WHERE id = auth.uid()
  // Create it in Supabase SQL editor with SECURITY DEFINER
  const deleteAccount = async (): Promise<{ error?: string }> => {
    if (!session?.user) return { error: 'ログインしていません' };
    const userId = session.user.id;
    try {
      // 1. Delete user's routine logs
      await supabase.from('routine_logs').delete().eq('user_id', userId);
      // 2. Unassign tasks assigned to this user
      await supabase.from('tasks').update({ assignee_id: null }).eq('assignee_id', userId);
      // 3. Delete profile (cascade should handle FK relations)
      await supabase.from('profiles').delete().eq('id', userId);
      // 4. Delete auth user via RPC (requires a Supabase SQL function 'delete_my_account')
      const { error: rpcError } = await supabase.rpc('delete_my_account');
      if (rpcError) {
        // Fallback: just sign out if RPC not yet set up
        console.warn('[deleteAccount] RPC not ready, signing out:', rpcError.message);
      }
      await supabase.auth.signOut();
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'アカウント削除に失敗しました' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        profileLoading,
        profileError,
        signIn,
        signUp,
        sendOtp,
        verifyOtp,
        signInAsGuest,
        signOut,
        refreshProfile,
        passwordRecoveryMode,
        updatePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth は <AuthProvider> の中で使ってください');
  return ctx;
}
