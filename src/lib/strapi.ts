import qs from 'qs';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * Helper to get the base Strapi URL
 */
export function getStrapiURL(path = '') {
  return `${STRAPI_URL}${path}`;
}

/**
 * Helper to fetch data from Strapi v5
 * @param path The API endpoint (e.g., '/tours' or 'homepages')
 * @param urlParamsObject query parameters for qs
 * @param options Next.js fetch options (cache, tags)
 */
export async function fetchAPI(
  path: string,
  urlParamsObject = {},
  options = {}
) {
  try {
    // 1. Clean the path: remove leading /api if provided, ensure leading slash for the rest
    const normalizedPath = path.replace(/^\/?api/, '').startsWith('/') 
      ? path.replace(/^\/?api/, '') 
      : `/${path.replace(/^\/?api/, '')}`;

    // 2. Build query string
    // encodeValuesOnly: true is essential for Strapi v5 to parse brackets [] correctly in production
    const queryString = qs.stringify(urlParamsObject, {
      encodeValuesOnly: true,
    });

    // 3. Construct final URL
    const requestUrl = `${getStrapiURL('/api')}${normalizedPath}${queryString ? `?${queryString}` : ''}`;

    // Log the request URL in production to debug 400 errors
    console.log(`[Strapi Fetch]: ${requestUrl}`);

    const response = await fetch(requestUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    // 4. Handle Errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi Error Response (${response.status}):`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching from Strapi at ${path}:`, error);
    return null;
  }
}

/**
 * Media URL Helper for Cloudflare R2 / Strapi
 */
export function getStrapiMedia(url: string | null) {
  if (url == null) {
    return null;
  }

  // If it's already an absolute URL (Cloudflare R2 Public URL), return it
  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }

  // Otherwise, prepend Strapi URL (fallback for local development/uploads)
  return `${STRAPI_URL}${url}`;
}