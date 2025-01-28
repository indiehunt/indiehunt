import axios from 'axios';
import { NextResponse } from 'next/server';
import request from 'request';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const PH_ACCESS_TOKEN = process.env.PH_ACCESS_TOKEN;

    const config = {
      headers: {
        Authorization: `Bearer ${PH_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    const body = {
      query: `query { posts(order: VOTES, topic: "developer-tools", postedAfter: "${new Date(oneWeekAgo).toISOString()}") {
          edges{
            cursor
            node{
              id
              name
              description
              url
              slug
              tagline
              votesCount
              website
              productLinks {
                  url
              }
              thumbnail {
                  url
                }
            }
          }
        }
      }
    }`,
    };

    const response = await axios.post('https://api.producthunt.com/v2/api/graphql', body, config);
    return NextResponse.json({ posts: response.data.data.posts.edges.slice(0, 10) });
  } catch (error) {
    console.error('Product Hunt API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
