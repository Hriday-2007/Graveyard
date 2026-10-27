import axios from 'axios';

/**
 * Fetch Wikipedia summary and extract for a startup.
 *
 * @param {string} startupName
 * @returns {Promise<Array<{ title: string, url: string, text: string, origin: 'wikipedia' }>>}
 */
export async function fetchWikipedia(startupName) {
  try {
    const userAgent = 'StartupGraveyard/1.0 (academic research project; college end-term)';

    // Step 1: Search Wikipedia for relevant page titles
    const searchUrl = 'https://en.wikipedia.org/w/api.php';
    const searchResponse = await axios.get(searchUrl, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: `${startupName} company OR startup`,
        format: 'json',
        srlimit: 3,
      },
      headers: {
        'User-Agent': userAgent,
      },
      timeout: 8000,
    });

    const searchResults = searchResponse.data?.query?.search || [];
    if (searchResults.length === 0) {
      // Fallback: try searching plain name without filter
      const fallbackSearch = await axios.get(searchUrl, {
        params: {
          action: 'query',
          list: 'search',
          srsearch: startupName,
          format: 'json',
          srlimit: 1,
        },
        headers: {
          'User-Agent': userAgent,
        },
        timeout: 8000,
      });

      const fallbackHits = fallbackSearch.data?.query?.search || [];
      if (fallbackHits.length === 0) {
        return [];
      }
      searchResults.push(fallbackHits[0]);
    }

    const matchedPage = searchResults[0];
    const pageTitle = matchedPage.title;

    // Step 2: Fetch plain-text extract for the matched page
    const extractResponse = await axios.get(searchUrl, {
      params: {
        action: 'query',
        prop: 'extracts',
        explaintext: 1,
        titles: pageTitle,
        format: 'json',
      },
      headers: {
        'User-Agent': userAgent,
      },
      timeout: 8000,
    });

    const pages = extractResponse.data?.query?.pages || {};
    const pageId = Object.keys(pages)[0];

    if (!pageId || pageId === '-1') {
      return [];
    }

    const pageData = pages[pageId];
    const rawExtract = pageData.extract || '';

    if (!rawExtract.trim()) {
      return [];
    }

    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;

    return [
      {
        title: pageData.title || pageTitle,
        url: wikiUrl,
        text: rawExtract.trim(),
        origin: 'wikipedia',
      },
    ];
  } catch (error) {
    console.error(`[WikipediaSource Error] Failed to fetch Wikipedia for "${startupName}":`, error.message);
    return [];
  }
}
