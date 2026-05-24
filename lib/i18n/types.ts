import type { ja } from './locales/ja';

/**
 * Recursively joins object keys with dots to produce a union of all valid
 * dot-notation translation key paths.
 *
 * Example:
 *   DotKeys<{ common: { loading: string }; auth: { login_title: string } }>
 *   => 'common.loading' | 'auth.login_title'
 */
type DotKeys<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends Readonly<Record<string, unknown>>
    ? DotKeys<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T & string];

/** Full type of the translation resource derived from the Japanese locale. */
export type TranslationResource = typeof ja;

/**
 * Union of every valid dot-notation key that can be passed to `t()`.
 *
 * Usage:
 *   import type { TranslationKeys } from '../lib/i18n/types';
 *   const key: TranslationKeys = 'tasks.status_todo'; // type-safe
 */
export type TranslationKeys = DotKeys<TranslationResource>;

/**
 * Supported locale codes.
 */
export type Locale = 'ja' | 'en';
