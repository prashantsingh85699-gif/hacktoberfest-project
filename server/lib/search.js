const EXCLUDED_SEARCH_DOMAINS = [
  'amazon.com', 'flipkart.com', 'walmart.com', 'target.com', 'ebay.com', 'aliexpress.com',
  'reddit.com', 'quora.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'pinterest.com',
  'youtube.com', 'wikipedia.org', 'fandom.com', '1mg.com', 'pharmeasy.in', 'netmeds.com',
];

/**
 * Searches official manufacturer/regulator pages using Tavily API
 */
export async function executeTavilySearch({ query, depth = 'basic', maxResults = 6, timeoutMs = 15000 }) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { error: 'SEARCH_UNAVAILABLE', results: [], creditsUsed: 0 };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: depth,
        max_results: maxResults,
        chunks_per_source: 2,
        include_answer: false,
        exclude_domains: EXCLUDED_SEARCH_DOMAINS,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`Tavily search request returned HTTP ${res.status}`);
      return { error: 'SEARCH_FAILED', results: [], creditsUsed: 0 };
    }

    const data = await res.json();
    const results = (data.results || []).map((r) => ({
      title: r.title || '',
      url: r.url || '',
      content: r.raw_content || r.content || '',
    }));

    const credits = depth === 'advanced' ? 2 : 1;
    return { results, creditsUsed: credits };
  } catch (err) {
    clearTimeout(timer);
    return { error: 'SEARCH_TIMEOUT', results: [], creditsUsed: 0 };
  }
}

