import qs from 'qs';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export function getStrapiURL(path = '') {
  return `${STRAPI_URL}${path}`;
}

/**
 * Helper to fetch data from Strapi v5
 * @param path The API endpoint (e.g., '/home-pages')
 * @param urlParamsObject query parameters for qs
 * @param options Next.js fetch options (cache, tags)
 */
export async function fetchAPI(
  path: string,
  urlParamsObject = {},
  options = {}
) {
  try {
    // Merge default params with custom params
    const mergedParams = {
      populate: '*', // Default to populate all (adjust for performance later)
      ...urlParamsObject,
    };

    // Build query string
    const queryString = qs.stringify(mergedParams);
    const requestUrl = `${getStrapiURL(`/api${path}`)}${queryString ? `?${queryString}` : ''}`;

    // Trigger API call
    const response = await fetch(requestUrl, {
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header if you have an API Token
        // 'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`, 
      },
      ...options,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching from Strapi at ${path}:`, error);
    return null;
  }
}

// Media URL Helper for Cloudflare R2
export function getStrapiMedia(url: string | null) {
  if (url == null) {
    return null;
  }
  // If it's already an absolute URL (Cloudflare), return it
  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }
  // Otherwise, prepend Strapi URL (for local uploads)
  return `${STRAPI_URL}${url}`;
}