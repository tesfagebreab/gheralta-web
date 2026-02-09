import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const domain = headersList.get('host') || 'gheraltaadventures.com';
  
  // Clean the domain (remove port if local, remove www)
  const cleanDomain = domain.split(':')[0].replace('www.', '');
  const baseUrl = `https://${cleanDomain}`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'], 
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}