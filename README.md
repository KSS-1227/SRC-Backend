# 🚀 Smart Embeddings-Based Search App for Contentstack

A complete semantic search solution that provides intelligent content discovery using AI-powered embeddings, real-time sync, and comprehensive analytics.

![Search Demo](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Smart+Search+App+Demo)

## ✨ Features

### 🔍 **Semantic Search Engine**
- **Natural Language Processing**: Accept free-form queries and return contextually relevant results
- **AI-Powered Similarity**: Uses OpenAI embeddings for semantic understanding
- **Smart Ranking**: Results ranked by semantic similarity, not just keyword matching
- **Multi-language Support**: Search across multiple locales seamlessly

### 🤖 **AI Integration**
- **OpenAI Embeddings**: Leverages `text-embedding-3-large` model for superior accuracy
- **Vector Similarity Search**: Fast and efficient similarity calculations
- **Content-Type Optimization**: Tailored embedding strategies for different content types
- **Search Explainability**: AI-generated explanations for why results were returned

### ⚡ **Real-time Sync**
- **Contentstack Webhooks**: Automatic content synchronization on publish/unpublish
- **Incremental Updates**: Only changed content is re-processed
- **Error Handling**: Robust error handling with retry mechanisms
- **Performance Optimized**: Batched processing for large content sets

### 📊 **Analytics & Insights**
- **Search Analytics**: Track user queries, results, and performance metrics
- **Content Performance**: Understand which content gets found most often
- **Usage Patterns**: Identify trends in search behavior
- **Performance Monitoring**: Response times and system health metrics

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Search**: Instant results as you type
- **Advanced Filters**: Filter by content type, locale, date, and more
- **Result Explanations**: Understand why specific content was returned

## 🏗️ Architecture

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

### Prerequisites
- Node.js 18+ 
- Contentstack account with admin access
- Supabase account
- OpenAI API account

### 1. Clone and Install

```bash
git clone <repository-url>
cd smart-search-app

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Environment Setup

**Backend Environment (`backend/.env`):**
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

**Frontend Environment (`.env`):**
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Smart Search App
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_EXPLAINABILITY=true
```

### 3. Database Setup

Run this SQL in your Supabase SQL editor:

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

### 4. Initial Content Sync

```bash
cd backend

# Test Contentstack connection
npm run test:connection

# Run initial content sync
npm run sync

# Check if sync was successful
npm run health
```

### 5. Setup Webhooks

```bash
# Automated webhook setup
npm run setup:webhooks

# Or manually configure in Contentstack:
# URL: https://your-domain.com/api/webhooks/contentstack
# Events: entry.publish, entry.unpublish, entry.delete
```

### 6. Start the Applications

```bash
# Start backend (in backend directory)
npm run dev

# Start frontend (in root directory)
npm run dev
```

Visit http://localhost:5173 to see your search app! 🎉

## 🛠️ Development

### Backend Scripts

```bash
npm start              # Start production server
npm run dev           # Start with hot reload
npm run sync          # Full content sync
npm run sync:selective # Sync specific content types
npm run setup:webhooks # Configure webhooks
npm run test:connection # Test Contentstack connection
npm run health        # Check server health
npm run deploy        # Interactive deployment
```

### Frontend Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Lint code
```

### Content Type Configuration

The app includes smart content type management. You can customize how different content types are processed:

```javascript
// backend/services/contentTypeManager.js
contentTypeManager.registerContentType('custom_type', {
  name: 'Custom Content',
  embeddingFields: ['title', 'description', 'custom_field'],
  titleFields: ['title'],
  snippetFields: ['description'],
  tagFields: ['tags'],
  categoryFields: ['category'],
  searchWeight: {
    title: 2.0,
    custom_field: 1.5,
    description: 1.0
  },
  filterOptions: {
    category: true,
    custom_filter: true
  }
});
```

## 📦 Deployment

### Option 1: Automated Deployment

```bash
cd backend
npm run deploy
```

Follow the interactive prompts to deploy to your preferred platform.

### Option 2: Platform-Specific

#### Vercel + Railway
1. Push code to GitHub
2. Connect Vercel to your repo for frontend
3. Connect Railway to your repo for backend
4. Set environment variables
5. Deploy!

#### Docker
```bash
docker-compose up -d
```

#### Manual
See `SETUP_GUIDE.md` for detailed manual deployment instructions.

## 🧪 Testing

### API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "how to create content"}'

# Search with filters
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "blog posts about AI",
    "filters": {
      "contentTypes": ["blog_post"],
      "locales": ["en-us"]
    },
    "limit": 5
  }'

# Get explanations
curl -X POST http://localhost:3000/api/search/explain \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "results": [...]
  }'

# Text similarity
curl -X POST http://localhost:3000/api/search/similarity \
  -H "Content-Type: application/json" \
  -d '{
    "text1": "machine learning algorithms",
    "text2": "AI and neural networks"
  }'
```

## 📊 Analytics

Access the analytics dashboard at http://localhost:5173 and click the "Analytics" button to see:

- Search query trends
- Popular content
- Response time metrics
- User behavior patterns
- Content performance insights

## 🔧 Configuration

### Search Configuration

Adjust search behavior in `backend/utils/config.js`:

```javascript
search: {
  defaultLimit: 10,
  maxLimit: 100,
  defaultThreshold: 0.5,
  embeddingDimensions: 1536,
}
```

### Content Type Behavior

Customize how different content types are processed in `backend/services/contentTypeManager.js`.

### UI Customization

Modify the frontend components in `components/` directory to customize the search interface.

## 🚨 Troubleshooting

### Common Issues

1. **"Environment not found" error**
   - Check your `CONTENTSTACK_ENVIRONMENT` value
   - Run: `npm run test:connection`

2. **No search results**
   - Verify content is synced: Check Supabase `content_entries` table
   - Run: `npm run sync`
   - Check embedding generation logs

3. **Webhook not working**
   - Verify webhook URL is accessible
   - Use ngrok for local development
   - Check webhook logs in Contentstack

4. **Slow search performance**
   - Check database indexes
   - Consider using dedicated vector database (Pinecone, Weaviate)
   - Optimize embedding dimensions

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit: `git commit -am 'Add feature'`
6. Push: `git push origin feature-name`
7. Create a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Contentstack](https://contentstack.com) - Headless CMS platform
- [OpenAI](https://openai.com) - AI embeddings and explanations
- [Supabase](https://supabase.com) - Vector database and backend services
- [React](https://reactjs.org) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Radix UI](https://radix-ui.com) - UI components

## 📞 Support

- 📖 [Full Setup Guide](SETUP_GUIDE.md)
- 🐛 [Report Issues](../../issues)
- 💬 [Discussions](../../discussions)
- 📧 [Contact Support](mailto:support@yourapp.com)

---

**Built with ❤️ for the Contentstack community**
