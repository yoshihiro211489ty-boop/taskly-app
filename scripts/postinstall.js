#!/usr/bin/env node
// Two patches applied after npm install / npm ci:
//
// 1. react-native-purchases: remove AGP 8.11.1 buildscript block
//    The library declares classpath 'com.android.tools.build:gradle:8.11.1'
//    which is newer than what EAS build workers have cached. In Expo managed
//    workflow the root project already provides AGP via expo-module-gradle-plugin.
//
// 2. @supabase/supabase-js: stub out dynamic OpenTelemetry import
//    supabase-js 2.x uses import(/* webpackIgnore */ OTEL_PKG).catch() to lazily
//    load @opentelemetry/api. Hermes hermesc (used in Android release builds)
//    cannot compile dynamic import() where the path is a runtime variable,
//    causing EAS_BUILD_UNKNOWN_GRADLE_ERROR ("Invalid expression encountered").
//    OpenTelemetry is optional – returning null disables tracing silently.

const fs = require('fs');
const path = require('path');

// ── Patch 1: react-native-purchases buildscript block ─────────────────────────
function patchRNPurchases() {
  const buildGradlePath = path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-purchases',
    'android',
    'build.gradle'
  );

  if (!fs.existsSync(buildGradlePath)) {
    console.log('[patch 1] react-native-purchases not found, skipping.');
    return;
  }

  let content = fs.readFileSync(buildGradlePath, 'utf8');
  if (!content.includes("classpath 'com.android.tools.build:gradle:")) {
    console.log('[patch 1] react-native-purchases already patched.');
    return;
  }

  const patched = content.replace(/^buildscript \{[\s\S]*?\n\}\n/m, '');
  if (patched === content) {
    console.warn('[patch 1] WARNING: buildscript block not found – pattern may have changed.');
    return;
  }

  fs.writeFileSync(buildGradlePath, patched, 'utf8');
  console.log('[patch 1] ✅ Patched react-native-purchases/android/build.gradle');
}

// ── Patch 2: @supabase/supabase-js dynamic import stub ────────────────────────
// Strategy: replace the entire loadOtel() function body so that it always
// returns Promise.resolve(null), regardless of the current state of the file.
// This handles both the pristine original and any partially-patched state.
function patchSupabaseDynamicImport(filename) {
  const filePath = path.join(
    __dirname,
    '..',
    'node_modules',
    '@supabase',
    'supabase-js',
    'dist',
    filename
  );

  if (!fs.existsSync(filePath)) {
    console.log(`[patch 2] ${filename} not found, skipping.`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Already cleanly patched: function body contains only "return Promise.resolve(null)"
  if (content.includes('function loadOtel() {\n\treturn Promise.resolve(null);\n}')) {
    console.log(`[patch 2] ${filename} already patched.`);
    return;
  }

  if (!content.includes('function loadOtel()')) {
    console.warn(`[patch 2] WARNING: loadOtel not found in ${filename}, skipping.`);
    return;
  }

  // Replace the entire loadOtel function body.
  // The function always ends with "return otelModulePromise;\n}"
  const patched = content.replace(
    /function loadOtel\(\) \{[\s\S]*?return otelModulePromise;\s*\}/,
    'function loadOtel() {\n\treturn Promise.resolve(null);\n}'
  );

  if (patched === content) {
    console.warn(`[patch 2] WARNING: loadOtel replacement failed in ${filename}.`);
    return;
  }

  fs.writeFileSync(filePath, patched, 'utf8');
  console.log(`[patch 2] ✅ Patched @supabase/supabase-js/dist/${filename}`);
}

patchRNPurchases();
patchSupabaseDynamicImport('index.cjs');
patchSupabaseDynamicImport('index.mjs');
