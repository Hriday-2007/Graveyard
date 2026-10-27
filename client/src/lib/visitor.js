/**
 * Retrieve or generate a persistent anonymous visitor ID stored in localStorage.
 * Used for anonymous flower tributes without requiring user registration.
 *
 * @returns {string}
 */
export function getVisitorId() {
  const STORAGE_KEY = 'sg_visitor_id';

  try {
    let visitorId = localStorage.getItem(STORAGE_KEY);
    if (!visitorId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        visitorId = crypto.randomUUID();
      } else {
        visitorId = 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      }
      localStorage.setItem(STORAGE_KEY, visitorId);
    }
    return visitorId;
  } catch (err) {
    // Fallback if localStorage is disabled or throws
    return 'temp-visitor-' + Math.random().toString(36).substring(2, 10);
  }
}

export default getVisitorId;
