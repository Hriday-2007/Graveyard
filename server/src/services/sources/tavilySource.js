import axios from 'axios';

/**
 * Search Tavily for startup failure and post-mortem information.
 *
 * @param {string} startupName
 * @returns {Promise<Array<{ title: string, url: string, text: string, origin: 'tavily' }>>}
 */
export async function searchTavily(startupName) {
  try {
    const apiKey = process.env.TAVILY_API_KEY?.trim();
    if (!apiKey) {
      console.warn('[TavilySource] TAVILY_API_KEY is not set. Skipping Tavily search.');
      return [];
    }

    const query = `${startupName} startup shut down why it failed founder statement`;

    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        include_raw_content: false,
        max_results: 8,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const rawResults = response.data?.results || [];

    return rawResults
      .filter((item) => item && (item.content || item.raw_content || item.title))
      .map((item) => ({
        title: item.title || `${startupName} article`,
        url: item.url || '',
        text: (item.content || item.raw_content || '').trim(),
        origin: 'tavily',
      }));
  } catch (error) {
    console.error(`[TavilySource Error] Failed to fetch from Tavily for "${startupName}":`, error.response?.data?.message || error.message);
    return [];
  }
}
