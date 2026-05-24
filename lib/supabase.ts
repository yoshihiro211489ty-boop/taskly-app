import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// 生成された Database 型は src/types/supabase.ts にある（`npm run update-types` で再生成）。
// 既存コードに合わない型エラーが大量に出るため、現状は createClient<Database>(...) ではなく
// 素の createClient(...) を使う。各クエリで個別に型を付ける（段階移行）方が安全。
// 例: supabase.from('timecard').select<...>('...').returns<Tables<'timecard'>>()
// import type { Database } from '../src/types/supabase';

// 環境変数から Supabase の接続情報を読み込み
// .env ファイルに EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_ANON_KEY を設定してください
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL または Anon Key が設定されていません。.env ファイルを確認してください。'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// DEV: ブラウザの dev console から Supabase クライアントに触れるようにする
// （複数ユーザーで QA するため。本番ビルドでは __DEV__ が false なので動かない）
declare const __DEV__: boolean;
if (typeof __DEV__ !== 'undefined' && __DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {
  (window as unknown as { __supabase: typeof supabase }).__supabase = supabase;
}
