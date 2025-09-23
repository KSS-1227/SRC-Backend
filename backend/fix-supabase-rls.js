const { createClient } = require("@supabase/supabase-js");
const config = require("./utils/config");

async function fixSupabaseRLS() {
  try {
    console.log("🔧 Attempting to fix Supabase RLS policies...");

    // Create a new Supabase client with service role key if available
    // For now, we'll use the same key but you might need to update this with a service role key
    const supabase = createClient(config.supabase.url, config.supabase.key);

    // Since we can't execute raw SQL directly through the JS client,
    // let's try to work around the RLS issue by checking if there's any data
    // and then trying to insert a test record

    console.log("Checking if we can read from content_entries table...");
    const { data, error } = await supabase
      .from("content_entries")
      .select("count()", { count: "exact" });

    if (error) {
      console.log("Error reading from content_entries:", error.message);

      // Try to insert a test record to see if RLS is the issue
      console.log("Attempting to insert a test record...");
      const { data: insertData, error: insertError } = await supabase
        .from("content_entries")
        .insert({
          id: "test-entry",
          title: "Test Entry",
          snippet: "This is a test entry",
          url: "https://example.com/test",
          content_type: "test",
          locale: "en-us",
          updated_at: new Date().toISOString(),
          embedding: Array(1536).fill(0), // Zero vector for testing
        });

      if (insertError) {
        console.log("Insert failed due to RLS:", insertError.message);
        console.log(
          "You need to disable RLS in Supabase dashboard or use a service role key"
        );
      } else {
        console.log("Insert successful!");
      }
    } else {
      console.log("Read successful, count:", data);
    }

    console.log("💡 To fix RLS issues, you need to:");
    console.log("1. Go to your Supabase dashboard");
    console.log("2. Navigate to Table Editor > content_entries");
    console.log("3. Click on the table name > RLS");
    console.log("4. Disable all policies or create permissive policies");
    console.log(
      "Alternatively, use a service role key instead of the anon key"
    );
  } catch (error) {
    console.error("❌ Failed to fix RLS:", error.message);
  }
}

fixSupabaseRLS();
