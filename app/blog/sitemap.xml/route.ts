// Force dynamic to prevent static generation attempts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ArticleNode {
  node: {
    id: string;
    slug: string;
    updatedAt: string;
  };
}

export async function GET() {
  try {
    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PRODUCT_HUNT_TOKEN}`,
      },
      body: JSON.stringify({
        query: `
          {
            articles(first: 100) {
              edges {
                node {
                  id
                  slug
                  updatedAt
                }
              }
            }
          }
        `,
      }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Product Hunt API error:', await response.text());
      return new Response(getEmptySitemap(), {
        headers: getSitemapHeaders(),
      });
    }

    const data = await response.json();

    // Add debug logging
    console.log('Product Hunt API response:', JSON.stringify(data, null, 2));

    // More robust data validation
    if (!data?.data?.articles?.edges || !Array.isArray(data.data.articles.edges)) {
      console.error('Invalid or missing articles data in response:', data);
      return new Response(getEmptySitemap(), {
        headers: getSitemapHeaders(),
      });
    }

    const articles = data.data.articles.edges as ArticleNode[];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${articles
        .map(
          ({ node }) => `
        <url>
          <loc>${process.env.NEXT_PUBLIC_SITE_URL}/blog/${node.slug}</loc>
          <lastmod>${new Date(node.updatedAt).toISOString()}</lastmod>
        </url>
      `,
        )
        .join('')}
    </urlset>`;

    return new Response(xml, {
      headers: getSitemapHeaders(),
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(getEmptySitemap(), {
      headers: getSitemapHeaders(),
    });
  }
}

// Helper functions to reduce duplication
function getEmptySitemap() {
  return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
}

function getSitemapHeaders() {
  return {
    'Content-Type': 'application/xml',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
  };
}
