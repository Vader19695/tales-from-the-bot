/**
 * Site-wide configuration.
 *
 * Analytics provider is a single config value here — swap it out without
 * hunting through templates.
 *
 * Tracking IDs and the active provider can be set via environment variables
 * so you never need to hard-code them here:
 *
 *   ANALYTICS_PROVIDER   plausible | ga4 | fathom | umami | none
 *   PLAUSIBLE_DOMAIN     domain registered on plausible.io
 *   GA4_MEASUREMENT_ID   Measurement ID from the GA4 dashboard (G-XXXXXXXXXX)
 *   FATHOM_SITE_ID       Site ID from the Fathom dashboard
 *   UMAMI_WEBSITE_ID     Website ID from the Umami dashboard
 *
 * Set them in .env for local dev, as repository variables in GitHub Actions,
 * or under Settings → App-Level Environment Variables in DigitalOcean App Platform.
 */

export type AnalyticsProvider = 'plausible' | 'fathom' | 'umami' | 'ga4' | 'none';

export const siteConfig = {
  /** Canonical site URL (no trailing slash). */
  url: 'https://talesfromthebot.blog',

  title: 'Tales From The Bot',

  description:
    'A weekly collection of AI-generated short stories. Every story on this site was written entirely by a large language model.',

  /** Analytics configuration. Override any value with environment variables. */
  analytics: {
    /**
     * Active provider. Overridable via ANALYTICS_PROVIDER env var.
     * - 'umami'    : free cloud tier (10k events/month) at umami.is, or self-host for free.
     *                Privacy-friendly, no cookies, GDPR-compliant. Already wired in.
     * - 'plausible': privacy-friendly, paid (~$9/mo), no cookie consent needed.
     * - 'fathom'  : privacy-friendly, paid (~$14/mo), no cookie consent needed.
     * - 'ga4'     : free, powerful, requires cookie consent in many jurisdictions.
     * - 'none'    : disables analytics entirely.
     */
    provider: (import.meta.env.ANALYTICS_PROVIDER ?? 'plausible') as AnalyticsProvider,

    plausible: {
      /** Overridable via PLAUSIBLE_DOMAIN env var. */
      domain: import.meta.env.PLAUSIBLE_DOMAIN ?? 'talesfromthebot.blog',
    },

    ga4: {
      /** Overridable via GA4_MEASUREMENT_ID env var. */
      measurementId: import.meta.env.GA4_MEASUREMENT_ID ?? '',
    },

    fathom: {
      /** Overridable via FATHOM_SITE_ID env var. */
      siteId: import.meta.env.FATHOM_SITE_ID ?? '',
    },

    umami: {
      /** Overridable via UMAMI_WEBSITE_ID env var. */
      websiteId: import.meta.env.UMAMI_WEBSITE_ID ?? '',
    },
  },
};
