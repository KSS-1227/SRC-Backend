#!/usr/bin/env node

/**
 * Trigger Content Sync Script
 * This script will help trigger a content sync to populate the database
 */

const API_BASE_URL = "https://backend-6omk.onrender.com";

async function triggerSync() {
  console.log("🔄 Triggering Content Sync");
  console.log("Backend URL:", API_BASE_URL);
  console.log("=".repeat(50));

  try {
    // Step 1: Check backend health
    console.log("\n1. Checking backend health...");
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);

    if (!healthResponse.ok) {
      console.log("❌ Backend is not healthy");
      return;
    }

    const healthData = await healthResponse.json();
    console.log("✅ Backend is healthy");
    console.log(`   Status: ${healthData.status}`);

    // Step 2: Check current content in database
    console.log("\n2. Checking current content in database...");
    const searchResponse = await fetch(`${API_BASE_URL}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "blog",
        filters: {},
        limit: 5,
        threshold: 0.1,
      }),
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(
        `✅ Current database has ${searchData.results.length} searchable entries`
      );

      if (searchData.results.length > 0) {
        console.log("   Sample entries:");
        searchData.results.forEach((result, index) => {
          console.log(
            `   ${index + 1}. ${result.title} (${result.contentType})`
          );
        });
      }
    }

    // Step 3: Check blog posts specifically
    console.log("\n3. Checking blog posts specifically...");
    const blogSearchResponse = await fetch(`${API_BASE_URL}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "blog",
        filters: { contentTypes: ["blog_post"] },
        limit: 10,
        threshold: 0.1,
      }),
    });

    if (blogSearchResponse.ok) {
      const blogSearchData = await blogSearchResponse.json();
      console.log(
        `✅ Found ${blogSearchData.results.length} blog posts in database`
      );

      if (blogSearchData.results.length === 0) {
        console.log("⚠️  No blog posts found - sync is needed");
      } else {
        console.log("   Blog posts found:");
        blogSearchData.results.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.title}`);
        });
      }
    }

    // Step 4: Check available content types
    console.log("\n4. Checking available content types...");
    const filtersResponse = await fetch(`${API_BASE_URL}/api/filters`);

    if (filtersResponse.ok) {
      const filtersData = await filtersResponse.json();
      console.log("✅ Available content types:");

      if (filtersData.filters && filtersData.filters.contentTypes) {
        filtersData.filters.contentTypes.forEach((type) => {
          console.log(`   - ${type.value}: ${type.label}`);
        });
      }
    }

    // Step 5: Try to fetch blog posts directly
    console.log("\n5. Testing blog posts endpoint...");
    const blogResponse = await fetch(`${API_BASE_URL}/api/blog`);

    if (blogResponse.ok) {
      const blogData = await blogResponse.json();
      console.log(
        `✅ Blog endpoint returned ${blogData.blogs?.length || 0} blog posts`
      );

      if (blogData.blogs && blogData.blogs.length > 0) {
        console.log("   Blog posts from ContentStack:");
        blogData.blogs.slice(0, 3).forEach((blog, index) => {
          console.log(`   ${index + 1}. ${blog.title || blog.uid}`);
        });
      }
    } else {
      console.log("❌ Blog endpoint failed");
    }

    console.log("\n" + "=".repeat(50));
    console.log("SYNC DIAGNOSIS COMPLETE");
    console.log("=".repeat(50));

    console.log("\n📋 Next Steps:");
    console.log("1. If blog posts exist in ContentStack but not in search:");
    console.log("   - The backend needs to run a content sync");
    console.log("   - Contact the backend administrator to run: npm run sync");
    console.log("");
    console.log("2. If no blog posts exist in ContentStack:");
    console.log("   - Create blog posts in your ContentStack CMS");
    console.log('   - Ensure they use content_type "blog_post"');
    console.log("");
    console.log("3. If blog posts exist in both but search doesn't work:");
    console.log("   - Check the search query and filters");
    console.log("   - Try searching with exact blog post titles");
  } catch (error) {
    console.error("Sync trigger failed:", error.message);
  }
}

triggerSync().catch(console.error);
