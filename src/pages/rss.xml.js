import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../config';

export async function GET(context) {
  const stories = (await getCollection('stories')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? siteConfig.url,
    items: stories.map((story) => ({
      title: story.data.title,
      pubDate: story.data.date,
      description: `An AI-generated short story written by ${story.data.model}.`,
      link: `/stories/${story.slug}/`,
    })),
  });
}
