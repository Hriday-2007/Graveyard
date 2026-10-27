import axios from 'axios';

/**
 * Strip HTML tags from HN comment text
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * Search Hacker News Algolia API for startup shutdown and post-mortem discussions.
 *
 * @param {string} startupName
 * @returns {Promise<Array<{ title: string, url: string, text: string, origin: 'hackernews' }>>}
 */
export async function searchHN(startupName) {
  try {
    const searchUrl = 'https://hn.algolia.com/api/v1/search';
    
    // First query with shutdown
    let response = await axios.get(searchUrl, {
      params: {
        query: `${startupName} shutdown`,
        tags: 'story',
        hitsPerPage: 5,
      },
      timeout: 8000,
    });

    let hits = response.data?.hits || [];

    // Fallback: If no hits, search with post-mortem
    if (hits.length === 0) {
      response = await axios.get(searchUrl, {
        params: {
          query: `${startupName} post-mortem`,
          tags: 'story',
          hitsPerPage: 5,
        },
        timeout: 8000,
      });
      hits = response.data?.hits || [];
    }

    if (hits.length === 0) {
      return [];
    }

    // Process top stories and enrich with text or top comments
    const storiesWithDetails = await Promise.all(
      hits.slice(0, 5).map(async (hit) => {
        const title = hit.title || hit.story_title || `${startupName} on Hacker News`;
        const itemUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
        const url = hit.url || itemUrl;

        let content = hit.story_text ? stripHtml(hit.story_text) : '';

        // If story text is not present, fetch top comments to provide autopsy insights
        if (!content && hit.num_comments > 0) {
          try {
            const itemResponse = await axios.get(`https://hn.algolia.com/api/v1/items/${hit.objectID}`, {
              timeout: 4000,
            });

            const children = itemResponse.data?.children || [];
            const topComments = children
              .slice(0, 3)
              .map((c) => (c.text ? stripHtml(c.text) : ''))
              .filter(Boolean)
              .join('\n\n');

            if (topComments) {
              content = `HN Discussion Comments:\n${topComments}`;
            }
          } catch (commentErr) {
            // Ignore comment fetch errors and fall back
          }
        }

        // If still no content, fall back to title and points metadata
        if (!content) {
          content = `${title} (Points: ${hit.points || 0}, Comments: ${hit.num_comments || 0})`;
        }

        return {
          title,
          url,
          text: content.trim(),
          origin: 'hackernews',
        };
      })
    );

    return storiesWithDetails;
  } catch (error) {
    console.error(`[HackerNewsSource Error] Failed to fetch Hacker News for "${startupName}":`, error.message);
    return [];
  }
}
