const { createClient } = require("@supabase/supabase-js");
const config = require("./utils/config");

console.log("🔍 Verifying Supabase service key configuration...\n");

// Check the key from config
console.log("1. Checking configuration...");
console.log("   Supabase URL:", config.supabase.url);
console.log("   Supabase Key:", config.supabase.key.substring(0, 30) + "...");

// Decode the JWT to check its role
const jwt = require("jsonwebtoken");
try {
  const decoded = jwt.decode(config.supabase.key, { complete: true });
  console.log("   Decoded Key Role:", decoded.payload.role);
} catch (error) {
  console.log("   Unable to decode key:", error.message);
}

// Test direct connection with service key
console.log("\n2. Testing direct connection...");
const supabase = createClient(config.supabase.url, config.supabase.key);

// Try to insert a test record
supabase
  .from("content_entries")
  .insert({
    id: "verification-test-" + Date.now(),
    title: "Verification Test",
    snippet: "This is a test to verify service key permissions",
    url: "https://example.com/test",
    content_type: "test",
    locale: "en-us",
    updated_at: new Date().toISOString(),
    embedding: Array(1536).fill(0),
  })
  .then(({ data, error }) => {
    if (error) {
      console.log("❌ Insert failed:", error.message);
      console.log("   Error code:", error.code);

      if (error.code === "42501") {
        console.log("   This indicates RLS policies are still active");
        console.log("   Solution: Disable RLS in Supabase dashboard");
      }
    } else {
      console.log("✅ Insert successful - Service key working correctly");

      // Clean up test record
      supabase
        .from("content_entries")
        .delete()
        .eq("id", "verification-test-" + Date.now())
        .then(() => {
          console.log("   Test record cleaned up");
        });
    }
  })
  .catch((error) => {
    console.log("❌ Connection test failed:", error.message);
  });
