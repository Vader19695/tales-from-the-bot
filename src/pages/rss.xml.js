import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../config';
import { buildExcerpt } from '../utils/excerpt';

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
      description: buildExcerpt(story.body),
      link: `/stories/${story.slug}/`,
    })),
  });
}
