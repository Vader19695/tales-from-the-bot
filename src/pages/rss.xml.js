import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import { siteConfig } from '../config';
import { buildExcerpt } from '../utils/excerpt';

/** Return the byte size of a public asset, or 0 if the file cannot be read. */
function publicFileSize(publicPath) {
  try {
    // During the Astro static build, `process.cwd()` is the project root.
    const absPath = path.join(process.cwd(), 'public', publicPath);
    return fs.statSync(absPath).size;
  } catch {
    return 0;
  }
}

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
                length: publicFileSize(story.data.image),
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
