# Tales From The Bot

A fully static website that publishes AI-generated short stories on a weekly schedule.
Every story is written entirely by a large language model — no human edits the prose.

**Live site:** [talesfromthebot.blog](https://talesfromthebot.blog)

---

## Table of contents

1. [Architecture](#architecture)
2. [Why Astro?](#why-astro)
3. [Running locally](#running-locally)
4. [Content model](#content-model)
5. [DigitalOcean App Platform setup](#digitalocean-app-platform-setup)
6. [Custom domain & DNS](#custom-domain--dns)
7. [Weekly story generation](#weekly-story-generation)
8. [Adding the API key secret](#adding-the-api-key-secret)
9. [Manually triggering a generation](#manually-triggering-a-generation)
10. [Analytics (Plausible)](#analytics-plausible)
11. [AI scraper exclusion policy](#ai-scraper-exclusion-policy)
12. [Swapping LLM providers](#swapping-llm-providers)
13. [Swapping analytics providers](#swapping-analytics-providers)

---

## Architecture

```
GitHub repo
  └── src/content/stories/*.md   ← Markdown story files with frontmatter
  └── src/pages/                 ← Astro pages (home, story, about, RSS)
  └── scripts/generate-story.ts ← Node script called by GitHub Actions
  └── .github/workflows/         ← Weekly cron job
  └── .do/app.yaml               ← DigitalOcean App Platform spec

On push to main:
  DigitalOcean App Platform builds (npm run build) and deploys automatically.
  No separate deploy workflow needed — App Platform watches the repo.
```

**Stack:**

| Layer | Choice | Notes |
|---|---|---|
| Static site generator | [Astro](https://astro.build) v5 | Zero-JS by default, content collections |
| Styling | Vanilla CSS | ~5 KB, no framework overhead |
| RSS | `@astrojs/rss` | First-party Astro integration |
| LLM | Anthropic Claude | Via `@anthropic-ai/sdk`, swappable |
| Hosting | DigitalOcean App Platform | Free static-site tier |
| Analytics | Plausible | Privacy-friendly, no cookie banner |
| CI/CD | GitHub Actions | Weekly cron + manual dispatch |

---

## Why Astro?

Astro was chosen because:

- **Content collections** — built-in support for Markdown files with typed frontmatter
  validation. No plugin needed; the schema is defined in TypeScript.
- **Zero JS by default** — ships no JavaScript to the browser unless you opt in.
  Stories are plain text; there is nothing interactive here.
- **RSS out of the box** — `@astrojs/rss` integrates cleanly with content collections.
- **TypeScript throughout** — layout, pages, and config are all typed.
- **Fast builds** — the site is small; builds take a few seconds.

---

## Running locally

```bash
# Clone and install
git clone https://github.com/Vader19695/tales-from-the-bot.git
cd tales-from-the-bot
npm install

# Copy the example env file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY if you want to run the generator.

# Start the dev server (hot-reloads on file changes)
npm run dev
# → http://localhost:4321

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## Content model

Each story is a Markdown file in `src/content/stories/` with the following frontmatter:

```markdown
---
title: "The Lighthouse Keeper's Last Signal"
date: 2025-01-05
model: claude-opus-4-5
slug: the-lighthouse-keepers-last-signal
prompt: "Write a melancholy short story..."
---

Story body in Markdown...
```

| Field | Type | Description |
|---|---|---|
| `title` | string | Story title |
| `date` | date | Publication date (YYYY-MM-DD) |
| `model` | string | LLM model name used to generate the story |
| `slug` | string (optional) | URL slug — defaults to filename slug |
| `prompt` | string | Exact prompt sent to the LLM |

The schema is validated by Zod in `src/content/config.ts`. If frontmatter is invalid,
the build will fail with a clear error message.

---

## DigitalOcean App Platform setup

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps) and click
   **Create App**.
2. Connect your GitHub account and select this repository.
3. DigitalOcean should auto-detect the Astro build settings. Confirm:
   - **Build command:** `npm ci && npm run build`
   - **Output directory:** `dist`
4. Choose the **Static Site** type — it's free (up to 3 static sites per account).
5. Click **Deploy**.

Alternatively, the repo includes `.do/app.yaml` which can be used to create the app
via the DigitalOcean CLI:

```bash
doctl apps create --spec .do/app.yaml
```

**Auto-deploy:** App Platform is configured to watch the `main` branch. Every push
(including the automated story commits) triggers a rebuild and deploy. No separate
deploy workflow is needed.

---

## Custom domain & DNS

1. In the App Platform dashboard, go to **Settings → Domains** and add
   `talesfromthebot.blog` and `www.talesfromthebot.blog`.
2. DigitalOcean will show you the required DNS records. Typically:
   - **A record** — `@` → DigitalOcean's IP (shown in the dashboard)
   - **CNAME record** — `www` → your app's `.ondigitalocean.app` subdomain
3. Add these records at your domain registrar.
4. DigitalOcean auto-provisions a **Let's Encrypt TLS certificate** once the DNS
   records propagate (usually within a few minutes to an hour).

> **Note:** DNS propagation can take up to 24–48 hours in the worst case. The
> Let's Encrypt cert will be issued automatically once DigitalOcean can verify
> ownership via the DNS records.

---

## Weekly story generation

The GitHub Actions workflow in `.github/workflows/generate-story.yml` runs every
**Sunday at 12:00 UTC**.

It:
1. Picks a prompt from `scripts/prompts.ts` (rotates by ISO week number).
2. Calls the Anthropic API with the prompt.
3. Writes the story to `src/content/stories/YYYY-MM-DD-<slug>.md`.
4. Either opens a pull request (default) or commits directly to `main`.

**Commit mode:**

| Mode | Behavior |
|---|---|
| `pr` (default) | Opens a PR titled "New AI-generated story" for review |
| `direct` | Commits directly to `main` — site deploys immediately |

The mode can be changed per-run when using **workflow_dispatch** (see below).

---

## Adding the API key secret

1. Go to your repository on GitHub.
2. Navigate to **Settings → Secrets and variables → Actions**.
3. Click **New repository secret**.
4. Name: `ANTHROPIC_API_KEY`
5. Value: your Anthropic API key from
   [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

Optionally, set the model as a repository variable (not a secret — it's not sensitive):
- **Settings → Secrets and variables → Actions → Variables**
- Name: `LLM_MODEL`, Value: `claude-opus-4-5` (or any other supported model)

---

## Manually triggering a generation

1. Go to **Actions → Generate Weekly Story** in the GitHub UI.
2. Click **Run workflow**.
3. Choose `pr` or `direct` from the dropdown.
4. Click **Run workflow**.

The workflow will run immediately and either open a PR or push directly to `main`.

---

## Analytics (Plausible)

This site uses [Plausible Analytics](https://plausible.io) — privacy-friendly,
cookie-free, and GDPR-compliant out of the box.

**Setup:**

1. Sign up at [plausible.io](https://plausible.io) (paid, ~$9/month).
2. Add a new site with the domain `talesfromthebot.blog`.
3. Confirm that `src/config.ts` has `provider: 'plausible'` and
   `domain: 'talesfromthebot.blog'`.
4. Deploy the site.
5. Visit the site in a browser — you should see a pageview appear in the
   Plausible dashboard within a few seconds.
6. To verify the script is firing, open the browser DevTools Network tab,
   filter by `plausible.io`, and look for a `200` response on the script request.

**Cost comparison:**

| Provider | Cost | Privacy | Cookie consent needed? |
|---|---|---|---|
| Plausible | ~$9/month | ✅ GDPR-friendly, no PII | ❌ No |
| Fathom | ~$14/month | ✅ GDPR-friendly, no PII | ❌ No |
| Umami | Free (self-host) | ✅ GDPR-friendly | ❌ No |
| GA4 | Free | ⚠️ Google-owned, collects PII | ✅ Required in EU/UK/CA |

---

## AI scraper exclusion policy

This site's content is AI-generated and we ask that it not be used to train
other AI models. Three signals are used:

| Signal | Where | Notes |
|---|---|---|
| `robots.txt` | `public/robots.txt` | Explicitly disallows known AI training crawlers |
| `<meta name="robots">` | Base layout | `noai, noimageai` — secondary signal |
| `X-Robots-Tag` header | `.do/app.yaml` | `noai, noimageai` — defense-in-depth |

The `robots.txt` disallows the following crawlers (based on the community-maintained
[ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) project):
GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-Web, anthropic-ai,
Google-Extended, CCBot, PerplexityBot, Perplexity-User, Bytespider, Amazonbot,
Applebot-Extended, FacebookBot, meta-externalagent, cohere-ai, Diffbot,
ImagesiftBot, Omgilibot, Omgili, YouBot, Timpibot, Kangaroo Bot, PanguBot,
DuckAssistBot, MistralAI-User, ai2bot.

> ⚠️ **These are honor-system signals.** Well-behaved crawlers will respect them,
> but they do not technically prevent scraping. If stronger enforcement is required,
> [Cloudflare's AI bot blocking](https://blog.cloudflare.com/ai-bots/) (available
> on the free plan) can be enabled by proxying the site through Cloudflare.

Review [ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) periodically
to pick up newly identified crawlers and update `public/robots.txt` accordingly.

---

## Swapping LLM providers

The generation script uses an `LLMProvider` interface defined in
`scripts/generate-story.ts`. Swapping providers is a one-file change:

**To use OpenAI:**

1. Install the SDK: `npm install openai`
2. Uncomment the `OpenAIProvider` class in `scripts/generate-story.ts`.
3. Set `OPENAI_API_KEY` as a GitHub Actions secret.
4. Change `new AnthropicProvider(modelName)` to `new OpenAIProvider(modelName)`.

**To change the model:**

Set the `LLM_MODEL` repository variable (or `LLM_MODEL` env var locally) to any
model name supported by your provider, e.g. `claude-3-5-sonnet-20241022`.

---

## Swapping analytics providers

The analytics provider is configured in a single place: `src/config.ts`.

```typescript
analytics: {
  provider: 'plausible', // Change to 'ga4', 'fathom', 'umami', or 'none'
  ...
}
```

To add a new provider (e.g. Fathom or Umami), add a new
`{analytics.provider === '...'}` block in `src/layouts/BaseLayout.astro`.

