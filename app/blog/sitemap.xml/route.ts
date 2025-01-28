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
          query {
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
    });

    const data = await response.json();

    // Guard clause to handle missing data
    if (!data?.data?.articles?.edges) {
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
          <loc>https://indiehunt.com/blog/${node.slug}</loc>
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
