# SerpApi Web Search Tool

This project now includes a powerful web search tool that uses SerpApi to search across multiple search engines and extract structured data.

## Features

The `searchWeb` tool supports:

### Search Engines
- **Google** (default) - Web search, featured snippets, knowledge graph
- **Bing** - Microsoft's search engine
- **Yahoo** - Yahoo search results  
- **DuckDuckGo** - Privacy-focused search
- **Yandex** - Russian search engine
- **Baidu** - Chinese search engine
- **Google News** - Latest news articles
- **Google Scholar** - Academic papers and citations
- **Google Shopping** - Product search with prices
- **Google Images** - Image search results
- **YouTube** - Video search results

### Parameters

- `query` (required): Search terms or keywords
- `engine` (optional): Search engine to use (default: "google")
- `location` (optional): Geographic location for localized results
- `resultsCount` (optional): Number of results to return (1-100, default: 10)
- `language` (optional): Language code (e.g., "en", "es", "fr")
- `safeSearch` (optional): Filter level ("active", "moderate", "off")
- `timeframe` (optional): Time filter ("hour", "day", "week", "month", "year")

## Setup

### 1. Environment Variable
Add your SerpApi key to your environment:

```bash
# Windows (PowerShell)
$env:SERP_API_KEY="your_serpapi_key_here"

# Windows (Command Prompt)
set SERP_API_KEY=your_serpapi_key_here

# Unix/Linux/macOS
export SERP_API_KEY="your_serpapi_key_here"
```

### 2. .env.local File (Alternative)
Create a `.env.local` file in the project root:

```
SERP_API_KEY=your_serpapi_key_here
```

### 3. Get Your API Key
Sign up at [SerpApi](https://serpapi.com/) and get your API key from the [manage API key page](https://serpapi.com/manage-api-key).

## Usage Examples

### Basic Web Search
```typescript
const result = await tools.searchWeb.execute({
  query: "artificial intelligence trends 2024",
  engine: "google",
  resultsCount: 5
});
```

### News Search
```typescript
const newsResults = await tools.searchWeb.execute({
  query: "latest tech news",
  engine: "google_news",
  timeframe: "day",
  resultsCount: 10
});
```

### Academic Research
```typescript
const papers = await tools.searchWeb.execute({
  query: "machine learning neural networks",
  engine: "google_scholar",
  resultsCount: 5
});
```

### Shopping Search
```typescript
const products = await tools.searchWeb.execute({
  query: "laptop gaming RTX 4070",
  engine: "google_shopping",
  resultsCount: 8
});
```

### Localized Search
```typescript
const localResults = await tools.searchWeb.execute({
  query: "best restaurants",
  engine: "google",
  location: "New York, NY",
  resultsCount: 10
});
```

### Image Search
```typescript
const images = await tools.searchWeb.execute({
  query: "sunset mountain landscape",
  engine: "google_images",
  resultsCount: 6
});
```

### Video Search
```typescript
const videos = await tools.searchWeb.execute({
  query: "python tutorial",
  engine: "youtube",
  resultsCount: 5
});
```

## Response Format

The tool returns structured, formatted results that include:

### Web Search Results
- **Title** and **snippet** for each result
- **URL** links
- **Featured answers** (when available)
- **Knowledge graph** information
- **Related questions**

### News Results
- **Headlines** and **snippets**
- **Publication date**
- **News source**
- **Article links**

### Shopping Results
- **Product titles** and **descriptions**
- **Prices** and **ratings**
- **Store information**
- **Product links**

### Image Results
- **Image titles**
- **Dimensions** (width/height)
- **Source URLs**
- **Original image links**

### Video Results
- **Video titles**
- **Channel names**
- **Duration** and **view counts**
- **Publication dates**
- **Video links**

### Academic Results
- **Paper titles**
- **Author information**
- **Publication details**
- **Citation snippets**
- **Paper links**

## Error Handling

The tool includes comprehensive error handling:

- **Missing API key**: Clear instructions for setup
- **API rate limits**: Graceful degradation
- **Network errors**: Informative error messages
- **Invalid parameters**: Input validation

## Rate Limits

SerpApi has different rate limits based on your plan:
- **Free tier**: 100 searches/month
- **Developer**: 5,000 searches/month
- **Production**: 15,000+ searches/month

## Best Practices

1. **Cache results** when possible to avoid redundant API calls
2. **Use specific queries** for better results
3. **Choose appropriate engines** for your use case
4. **Set reasonable result counts** to balance speed and completeness
5. **Use location filters** for geographically relevant searches
6. **Apply timeframes** for time-sensitive queries

## Integration

The tool is automatically available in the chat interface and can be called by the AI assistant when users ask for:

- Current information from the web
- News updates
- Product searches
- Academic research
- Image or video content
- Localized information

## Dependencies

- `serpapi` - Official SerpApi JavaScript client
- `zod` - Runtime type validation
- Built on the existing tools architecture

## Support

For SerpApi-specific issues:
- [SerpApi Documentation](https://serpapi.com/search-api)
- [SerpApi JavaScript Library](https://github.com/serpapi/serpapi-javascript)
- [Support](https://serpapi.com/contact)

## Security Notes

- **Never commit API keys** to version control
- **Use environment variables** for API key storage
- **Implement rate limiting** in production environments
- **Monitor API usage** to avoid unexpected charges
