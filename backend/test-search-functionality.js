const supabaseService = require("./services/supabase");
const embeddingsService = require("./services/embeddings");
const logger = require("./utils/logger");

async function testSearchFunctionality() {
  try {
    console.log("🔍 Testing search functionality...\n");

    // 1. Test Supabase connection
    console.log("1. Testing Supabase connection...");
    const filterOptions = await supabaseService.getFilterOptions();
    console.log("✅ Supabase connection successful");
    console.log("   Content types:", filterOptions.contentTypes);
    console.log("   Locales:", filterOptions.locales);

    // 2. Test if there's data in the database
    console.log("\n2. Checking for content entries...");
    const { data: entries, error: entriesError } = await supabaseService.client
      .from("content_entries")
      .select("id")
      .limit(1);

    if (entriesError) {
      console.log("❌ Error checking entries:", entriesError.message);
      return;
    }

    const entryCount = entries.length;
    console.log(`✅ Database connection successful`);
    console.log(
      `   Sample entry ID: ${entryCount > 0 ? entries[0].id : "None"}`
    );

    // 3. Test embedding generation
    console.log("\n3. Testing embedding generation...");
    const testQuery = "test search query";
    const embedding = await embeddingsService.generateEmbedding(testQuery);
    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);

    // 4. Test search functionality
    console.log("\n4. Testing search functionality...");
    const results = await supabaseService.searchContent(
      embedding,
      { contentTypes: [], locales: [] },
      10,
      0.1
    );

    console.log(`✅ Search completed successfully`);
    console.log(`   Found ${results.length} results`);

    if (results.length > 0) {
      console.log("   Sample results:");
      results.slice(0, 3).forEach((result, index) => {
        console.log(
          `     ${index + 1}. ${
            result.title
          } (Similarity: ${result.similarity.toFixed(4)})`
        );
      });
    }

    // 5. Test filter options
    console.log("\n5. Testing filter options...");
    const filters = await supabaseService.getFilterOptions();
    console.log("✅ Filter options retrieved successfully");
    console.log("   Available content types:", filters.contentTypes);
    console.log("   Available locales:", filters.locales);

    console.log(
      "\n🎉 All tests passed! Search functionality is working correctly."
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

testSearchFunctionality();
