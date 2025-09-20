# 🚀 Smart Embeddings-Based Search App for Contentstack

This guide will walk you through setting up a complete smart search application with semantic search, real-time sync, and analytics.

## 📋 Prerequisites

- Node.js 18+ installed
- Contentstack account with admin access
- Supabase account
- OpenAI API account
- Git installed

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Contentstack  │────│   Your Backend  │────│   Supabase DB   │
│   (Content CMS) │    │   (Node.js)     │    │   (Vector DB)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │ Webhooks              │ API Calls             │ Vector Search
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real-time     │    │   OpenAI API    │    │   Search Index  │
│   Updates       │    │   (Embeddings)  │    │   (Embeddings)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Step 1: Environment Configuration

1. **Backend Environment Variables**
   Create `backend/.env` file:
   ```bash
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Supabase Configuration  
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   
   # Contentstack Configuration
   CONTENTSTACK_API_KEY=your_contentstack_api_key
   CONTENTSTACK_DELIVERY_TOKEN=your_contentstack_delivery_token
   CONTENTSTACK_ENVIRONMENT=preview  # or your environment name
   CONTENTSTACK_REGION=eu  # us, eu, or azure-na
   CONTENTSTACK_LOCALES=en-us,hi-in,bn-in  # comma-separated
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   
   # Optional Configuration
   ALLOWED_ORIGINS=http://localhost:5173
   CONTENT_BASE_URL=https://your-website.com
   ```

2. **Frontend Environment Variables**
   Create `.env` file in root:
   ```bash
   VITE_API_BASE_URL=http://localhost:3000
   VITE_APP_NAME=Smart Search App
   VITE_ENABLE_ANALYTICS=true
   VITE_ENABLE_EXPLAINABILITY=true
   ```

### Step 2: Database Setup

1. **Create Supabase Tables**
   ```sql
   -- Content entries table
   CREATE TABLE content_entries (
     id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     snippet TEXT,
     url TEXT,
     content_type TEXT NOT NULL,
     locale TEXT NOT NULL DEFAULT 'en-us',
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     embedding vector(1536)  -- OpenAI text-embedding-3-large dimensions
   );

   -- Create vector similarity search function
   CREATE OR REPLACE FUNCTION search_content(
     query_embedding vector(1536),
     match_threshold float DEFAULT 0.5,
     match_count int DEFAULT 10,
     content_type_filter text DEFAULT NULL,
     locale_filter text DEFAULT NULL
   )
   RETURNS TABLE (
     id text,
     title text,
     snippet text,
     url text,
     content_type text,
     locale text,
     updated_at timestamp with time zone,
     similarity float
   )
   LANGUAGE plpgsql
   AS $$
   BEGIN
     RETURN QUERY
     SELECT 
       content_entries.id,
       content_entries.title,
       content_entries.snippet,
       content_entries.url,
       content_entries.content_type,
       content_entries.locale,
       content_entries.updated_at,
       (content_entries.embedding <#> query_embedding) * -1 as similarity
     FROM content_entries
     WHERE (content_type_filter IS NULL OR content_entries.content_type = content_type_filter)
       AND (locale_filter IS NULL OR content_entries.locale = locale_filter)
       AND (content_entries.embedding <#> query_embedding) * -1 > match_threshold
     ORDER BY content_entries.embedding <#> query_embedding
     LIMIT match_count;
   END;
   $$;

   -- Search analytics table
   CREATE TABLE search_analytics (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     query TEXT NOT NULL,
     filters JSONB,
     results_count INTEGER,
     response_time_ms INTEGER,
     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create indexes for better performance
   CREATE INDEX idx_content_entries_content_type ON content_entries(content_type);
   CREATE INDEX idx_content_entries_locale ON content_entries(locale);
   CREATE INDEX idx_content_entries_updated_at ON content_entries(updated_at);
   CREATE INDEX idx_search_analytics_timestamp ON search_analytics(timestamp);
   ```

### Step 3: Install Dependencies

1. **Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Frontend Dependencies**
   ```bash
   npm install
   ```

### Step 4: Content Setup in Contentstack

1. **Create Content Types** (if not already created)
   
   **Blog Post Content Type:**
   - Title (Text, Required)
   - Description (Rich Text)
   - Content (Rich Text)
   - Tag (Text, Multiple)
   - Category (Select: Tutorial, Guide, News, etc.)
   - Slug (Text, URL friendly)

   **Product Content Type:**
   - Name (Text, Required)
   - Description (Rich Text)
   - Features (Rich Text)
   - Price (Number)
   - Category (Select)
   - URL Slug (Text)

2. **Add Sample Content**
   Create at least 10-15 entries across different content types for testing.

### Step 5: Webhook Configuration

1. **In Contentstack Dashboard:**
   - Go to Settings → Webhooks
   - Create a new webhook with URL: `https://your-domain.com/api/webhooks/contentstack`
   - Select events: `entry.published`, `entry.unpublished`, `entry.deleted`
   - Choose all content types you want to sync

2. **For local development:**
   ```bash
   # Install ngrok for testing webhooks locally
   npm install -g ngrok
   ngrok http 3000
   # Use the https URL from ngrok in webhook configuration
   ```

### Step 6: Initial Content Sync

1. **Run the initial sync:**
   ```bash
   cd backend
   npm run sync
   ```

2. **Verify sync in Supabase:**
   Check if entries appeared in your `content_entries` table.

### Step 7: Start the Application

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test the search:**
   - Open http://localhost:5173
   - Try searching for content you've added
   - Check similarity scores and filtering

## 🔧 Advanced Configuration

### Content Type Specific Behavior

Edit `backend/services/contentstack.js` to customize how different content types are processed:

```javascript
// Custom extraction logic for different content types
extractTitle(entry) {
  // Add content-type specific logic
  if (entry.content_type === 'product') {
    return entry.name || entry.title;
  }
  return entry.title || 'Untitled';
}
```

### Search Optimization

1. **Adjust similarity thresholds** in `backend/utils/config.js`
2. **Customize embedding generation** in `backend/services/embeddings.js`
3. **Add custom search ranking** in `backend/services/supabase.js`

### Analytics and Monitoring

- View search analytics at http://localhost:5173 (click Analytics button)
- Monitor logs in backend console
- Check Supabase dashboard for database metrics

## 📦 Deployment Options

### Option 1: Vercel + Railway
1. **Frontend:** Deploy to Vercel
2. **Backend:** Deploy to Railway
3. **Database:** Use Supabase (already hosted)

### Option 2: Single VPS
1. Use PM2 for process management
2. Nginx for reverse proxy
3. SSL certificates with Let's Encrypt

### Option 3: Contentstack Launch
1. Build as a Contentstack Launch application
2. Deploy directly within Contentstack interface

## 🧪 Testing

1. **Test search functionality:**
   ```bash
   curl -X POST http://localhost:3000/api/search \
     -H "Content-Type: application/json" \
     -d '{"query": "how to create content"}'
   ```

2. **Test webhook:**
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/contentstack \
     -H "Content-Type: application/json" \
     -d '{"event": "entry.published", "data": {"entry": {"uid": "test"}}}'
   ```

3. **Test similarity:**
   ```bash
   curl -X POST http://localhost:3000/api/search/similarity \
     -H "Content-Type: application/json" \
     -d '{"text1": "hello world", "text2": "hello universe"}'
   ```

## 🔍 Troubleshooting

### Common Issues:

1. **"Environment not found" error:**
   - Check your CONTENTSTACK_ENVIRONMENT value
   - Use the test script in backend: `node test-contentstack.js`

2. **No search results:**
   - Verify content is synced to Supabase
   - Check embedding generation logs
   - Ensure OpenAI API key is valid

3. **Webhook not working:**
   - Verify webhook URL is accessible
   - Check webhook logs in Contentstack
   - Test locally with ngrok

4. **Slow search performance:**
   - Add database indexes
   - Consider using a dedicated vector database (Pinecone, Weaviate)
   - Optimize embedding dimensions

## 📚 Next Steps

1. **Add more content types** and customize search behavior
2. **Implement user authentication** for personalized search
3. **Add search suggestions** and autocomplete
4. **Create search result explanations** with AI
5. **Implement A/B testing** for search algorithms
6. **Add multi-language support** with translation
7. **Create search analytics dashboard** with insights

## 🤝 Support

If you encounter issues:
1. Check the logs in both frontend and backend
2. Verify all environment variables are set
3. Ensure all services (Contentstack, Supabase, OpenAI) are accessible
4. Test individual components using the provided test scripts

## 📄 License

MIT License - feel free to modify and use for your projects.
