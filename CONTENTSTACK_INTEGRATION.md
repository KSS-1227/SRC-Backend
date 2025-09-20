# Professional Contentstack Integration Guide

## Overview

This document provides a comprehensive guide for integrating Contentstack with the search application. The integration enables semantic search capabilities by synchronizing content from Contentstack, generating AI embeddings, and storing them in Supabase for vector similarity search.

## Prerequisites

1. Contentstack account with API credentials
2. Supabase project with pgvector extension
3. OpenAI API key
4. Node.js >= 18.0.0

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Contentstack Configuration
CONTENTSTACK_API_KEY=your_contentstack_api_key
CONTENTSTACK_DELIVERY_TOKEN=your_contentstack_delivery_token
CONTENTSTACK_ENVIRONMENT=your_environment_name
CONTENTSTACK_REGION=eu  # or 'us' for US region

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Optional Configuration
CONTENTSTACK_LOCALES=en-us,hi-in,bn-in,ta-in,te-in,mr-in
CONTENT_BASE_URL=https://your-website.com
```

### 2. Set Up Contentstack Content Types

Create the following content types in your Contentstack stack:

1. **Blog Post**

   - title (text)
   - description (text)
   - content (rich text)
   - tags (tags)
   - category (text)
   - slug (text)

2. **Product**

   - name (text)
   - description (text)
   - features (rich text)
   - tags (tags)
   - category (text)
   - price (number)
   - slug (text)

3. **Documentation**
   - title (text)
   - summary (text)
   - content (rich text)
   - tags (tags)
   - category (text)
   - version (text)
   - slug (text)

### 3. Configure Webhooks

Set up webhooks in Contentstack to enable real-time content synchronization:

1. Go to Settings > Webhooks in your Contentstack dashboard
2. Create a new webhook with these settings:
   - **Name**: Search Index Update
   - **URL**: `http://your-backend-url/api/webhook/contentstack`
   - **Triggers**: Entry publish, unpublish, and delete events
   - **Headers**: Add any authentication headers if needed

### 4. Database Setup

Run the database setup script in your Supabase SQL editor:

```sql
-- Enable the vector extension for embeddings
create extension if not exists vector;

-- Table for storing content entries with embeddings
create table if not exists content_entries (
  id text primary key,
  title text,
  snippet text,
  url text,
  content_type text,
  locale text,
  updated_at timestamptz default now(),
  embedding vector(1536)
);

-- Table for logging search queries for analytics
create table if not exists query_logs (
  id uuid primary key default gen_random_uuid(),
  query text,
  filters jsonb,
  timestamp timestamptz default now(),
  hits int
);

-- Function for vector similarity search
create or replace function match_content (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) returns table (
  id text,
  title text,
  snippet text,
  url text,
  content_type text,
  locale text,
  similarity float
) language sql stable as $$
  select
    id,
    title,
    snippet,
    url,
    content_type,
    locale,
    1 - (embedding <=> query_embedding) as similarity
  from content_entries
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Create indexes for better performance
create index if not exists content_entries_embedding_idx on content_entries
using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists content_entries_content_type_idx on content_entries(content_type);
create index if not exists content_entries_locale_idx on content_entries(locale);
create index if not exists content_entries_updated_at_idx on content_entries(updated_at);

create index if not exists query_logs_timestamp_idx on query_logs(timestamp);
create index if not exists query_logs_query_idx on query_logs(query);
```

## Content Synchronization

### Manual Sync

To manually sync content from Contentstack:

```bash
cd backend
node jobs/syncContent.js
```

Or using npm script:

```bash
cd backend
npm run sync
```

### Automated Sync

The application includes a background job that automatically syncs content every hour. You can adjust the frequency in the job configuration.

### Selective Sync

To sync specific content types only:

```bash
cd backend
node jobs/syncContent.js --content-types blog_post,product
```

## API Endpoints

### Search

```bash
# Semantic search
POST /api/search
{
  "query": "your search query",
  "filters": {
    "contentTypes": ["blog_post"],
    "locales": ["en-us"]
  },
  "limit": 10,
  "threshold": 0.5
}
```

### Filters

```bash
# Get all filter options
GET /api/filters
```

### Analytics

```bash
# Dashboard data
GET /api/analytics/dashboard?days=7
```

## Best Practices

### Content Modeling

1. Use consistent field naming across content types
2. Include descriptive titles and snippets for better search results
3. Use tags and categories for improved filtering
4. Optimize rich text content for search by including key information in text fields

### Performance Optimization

1. Limit the number of content types synced if not all are needed
2. Use selective sync for large content repositories
3. Monitor embedding generation costs
4. Implement caching for frequently accessed content

### Security

1. Protect webhook endpoints with authentication
2. Use environment variables for all credentials
3. Regularly rotate API keys
4. Monitor usage and set up alerts for unusual activity

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**

   - Ensure all required variables are set in `.env`
   - Check for typos in variable names

2. **"Failed to connect to Supabase"**

   - Verify Supabase URL and key
   - Ensure pgvector extension is enabled
   - Check network connectivity

3. **"Contentstack fetch failed"**

   - Verify API key and delivery token
   - Check environment and region settings
   - Ensure content types exist

4. **"OpenAI API error"**
   - Verify API key
   - Check usage limits
   - Ensure access to embedding models

### Debug Mode

Set `NODE_ENV=development` for detailed logging:

```bash
NODE_ENV=development npm start
```

## Monitoring and Maintenance

### Health Checks

The application includes a health check endpoint at `/health` that provides status information.

### Log Monitoring

All operations are logged with appropriate levels (ERROR, WARN, INFO, DEBUG). Monitor logs for:

- Sync job failures
- API errors
- Performance issues
- Security events

### Regular Maintenance

1. Clean up old query logs periodically
2. Monitor Supabase storage usage
3. Review OpenAI API usage and costs
4. Update dependencies regularly

## Scaling Considerations

For large content repositories:

1. Implement incremental sync using updated_at timestamps
2. Use pagination for large datasets
3. Consider using Contentstack's sync API for better performance
4. Implement rate limiting for API calls
5. Use caching for frequently accessed content

## Support

For issues with the integration, check:

1. Contentstack documentation
2. Supabase documentation
3. OpenAI API documentation
4. Application logs
