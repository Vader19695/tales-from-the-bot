/**
 * Site-wide configuration.
 *
 * Analytics provider is a single config value here — swap it out without
 * hunting through templates.
 */

export type AnalyticsProvider = 'plausible' | 'fathom' | 'umami' | 'ga4' | 'none';

export const siteConfig = {
  /** Canonical site URL (no trailing slash). */
  url: 'https://talesfromthebot.blog',

  title: 'Tales From The Bot',

  description:
    'A weekly collection of AI-generated short stories. Every story on this site was written entirely by a large language model.',

  /** Analytics configuration. Change `provider` to switch providers. */
  analytics: {
    /**
     * Set to 'plausible', 'ga4', 'fathom', 'umami', or 'none'.
     * - 'umami'    : free cloud tier (10k events/month) at umami.is, or self-host for free.
     *                Privacy-friendly, no cookies, GDPR-compliant. Already wired in.
     * - 'plausible': privacy-friendly, paid (~$9/mo), no cookie consent needed.
     * - 'fathom'  : privacy-friendly, paid (~$14/mo), no cookie consent needed.
     * - 'ga4'     : free, powerful, requires cookie consent in many jurisdictions.
     * - 'none'    : disables analytics entirely.
     */
    provider: 'plausible' as AnalyticsProvider,

    plausible: {
      /** The domain you registered on plausible.io — must match exactly. */
      domain: 'talesfromthebot.blog',
    },

    ga4: {
      /** Replace with your real Measurement ID from the GA4 dashboard. */
      measurementId: 'G-XXXXXXXXXX',
    },
  },
} as const;
