#!/usr/bin/env node
// Environment variable check — runs before dev/build to surface missing config.

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_ZOOM_SDK_KEY",
  "ZOOM_SDK_SECRET",
];

const optional = [
  "YOUTUBE_API_KEY",
];

console.log("\n🔍 L'Oxygène Environment Check\n");

let hasError = false;

required.forEach(key => {
  const val = process.env[key];
  if (!val || val.includes("your_") || val.includes("your-")) {
    console.log(`❌ MISSING: ${key}`);
    hasError = true;
  } else {
    console.log(`✅ OK:      ${key}`);
  }
});

console.log("");

optional.forEach(key => {
  const val = process.env[key];
  if (!val || val.includes("your_") || val.includes("your-")) {
    console.log(`⚠️  OPTIONAL (demo mode): ${key}`);
  } else {
    console.log(`✅ OK:      ${key}`);
  }
});

if (hasError) {
  console.log("\n⚠️  Some required env vars missing — app will run in demo mode.\n");
  console.log("   See SETUP.md for configuration instructions.\n");
  // Do NOT exit(1) — allow dev to start in demo mode
} else {
  console.log("\n🚀 All environment variables configured!\n");
}
