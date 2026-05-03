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
    items: stories.map((story) => {
      const imageUrl = story.data.image
        ? new URL(story.data.image, context.site ?? siteConfig.url).href
        : null;

      return {
        title: story.data.title,
        pubDate: story.data.date,
        description: buildExcerpt(story.body),
        link: `/stories/${story.slug}/`,
        // Include the banner image as an RSS enclosure so feed readers can
        // display it, and as a custom <media:content> element for broader
        // compatibility (e.g. Feedly, NewsBlur).
        ...(imageUrl
          ? {
              enclosure: {
                url: imageUrl,
                type: 'image/png',
                // Length is required by the RSS spec but not knowable at
                // build time without reading the file; 0 is accepted by
                // most readers and validators when the URL is provided.
                length: 0,
              },
              customData: `<media:content url="${imageUrl}" medium="image" />`,
            }
          : {}),
      };
    }),
    customData: `<language>en-us</language>`,
    xmlns: { media: 'http://search.yahoo.com/mrss/' },
  });
}
