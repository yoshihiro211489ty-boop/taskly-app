import Constants from 'expo-constants';

const ENV = {
  development: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    enableAnalytics: false,
    enableCrashReporting: false,
  },
  staging: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    enableAnalytics: true,
    enableCrashReporting: true,
  },
  production: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    enableAnalytics: true,
    enableCrashReporting: true,
  },
};

type AppEnv = keyof typeof ENV;
const appEnv = (process.env.APP_ENV as AppEnv) ?? 'development';

export const config = ENV[appEnv] ?? ENV.development;
export const isDev = appEnv === 'development';
export const isProduction = appEnv === 'production';
