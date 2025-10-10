▣ CLAUDE CODE SUPER PROMPT — “INSURANCE SCHOOL FULL IMPORT + PAYMENTS UI (NO-HERO-TOUCH)”

Role: Act as a senior full-stack engineer. Execute a complete capture and integration of the client’s existing site into our current app with surgical safety. We have written authorization from the client.

0) Hard Targets (no variables)
	•	TARGET DOMAIN: https://theinsuranceschool.com/
	•	PRIMARY SUBPAGES (deep-crawl seeds):
	•	https://theinsuranceschool.com/ifast-agent/
	•	https://theinsuranceschool.com/prelicensecourse/
	•	HOMEPAGE PAYMENT STRIP DESIGN GOAL: Compact, stylish options like the screenshot provided (3 course cards), but with more flair (glassmorphism, rounded 2xl, subtle gradients, elevated shadows, micro-interactions).
	•	PAYMENTS CONSOLIDATION PAGE: Create /courses/payments with full course details aggregated from the scrape.

1) Untouchables & Safety
	1.	Do not modify or delete any existing files/components/styles outside the paths specified below.
	2.	Absolutely do not touch the main page hero. Verify by hashing the hero file(s) before/after.
	3.	All imported legacy assets/pages must live under:
	•	Assets: /public/vendor/theinsuranceschool.com/**
	•	Pages/components: /src/legacy/theinsuranceschool.com/**
	•	Raw scrape workspace: /var/scrape/theinsuranceschool.com/**
	4.	Legacy CSS must be fully scoped under .legacy-scope using PostCSS prefixing.

2) Stack Auto-Detection & Routing
	•	Detect framework from package.json:
	•	If next dependency → Next.js:
	•	Prefer App Router if /app exists; else Pages Router.
	•	Mount legacy routes at /legacy/theinsuranceschool.com/*.
	•	New payments page at /courses/payments.
	•	Else → React Router:
	•	Export a routes array in src/legacy/theinsuranceschool.com/routes.tsx to mount under /legacy/theinsuranceschool.com/*.
	•	Add a route for /courses/payments.

(Implement both code paths automatically; pick the one that matches the repo.)

3) Scraper & Pipeline (build now)

Create the following files and scripts exactly:

/scripts/scraper/
  crawler.ts
  asset-pipeline.ts
  html-rewriter.ts
  css-prefixer.ts
  video-grabber.ts
  manifest.ts
  report.ts
  utils.ts

/public/vendor/theinsuranceschool.com/**          # final assets (img, css, js, fonts, docs, video)
/src/legacy/theinsuranceschool.com/
  components/LegacyHTML.tsx                       # wrapper injecting namespaced HTML + legacy.css
  pages/**                                        # generated page components
  legacy.css                                      # merged, prefixed CSS
  routes.tsx                                      # only for React Router
  payments/
    PaymentsPage.tsx                              # consolidated payments UI
    PaymentsStrip.tsx                             # compact homepage options strip
/var/scrape/theinsuranceschool.com/
  raw/**                                          # raw captures
  normalized/**                                   # rewritten HTML/CSS/JS
  manifest.json
  scrape-report.html

Dependencies to install (add only if missing):

npm i -D playwright ts-node typescript @types/node cheerio postcss postcss-prefix-selector postcss-value-parser got sharp

Ensure ffmpeg exists (for HLS/DASH → MP4):

which ffmpeg || echo "Install ffmpeg to convert HLS/DASH video"

package.json scripts (add/update):

"scripts": {
  "scrape:prep": "playwright install",
  "scrape:run": "ts-node scripts/scraper/crawler.ts",
  "scrape:report": "ts-node scripts/scraper/report.ts",
  "scrape:integrate": "ts-node scripts/scraper/manifest.ts --integrate",
  "scrape:all": "npm run scrape:prep && npm run scrape:run && npm run scrape:report && npm run scrape:integrate"
}

4) Crawler Behavior (Playwright + network capture)
	•	Seeds:
	•	https://theinsuranceschool.com/
	•	https://theinsuranceschool.com/ifast-agent/
	•	https://theinsuranceschool.com/prelicensecourse/
	•	If https://theinsuranceschool.com/sitemap.xml exists, enqueue all <loc> URLs.
	•	Same-origin only (follow internal links).
	•	Concurrency 6; 300–600ms jitter between requests.
	•	Render twice (desktop 1440×900, mobile 390×844) to capture responsive assets.
	•	Wait for network-idle or 20s cap; collect all network responses (HTML, CSS/JS, fonts, images, PDFs, JSON, video playlists).
	•	Download lazy assets (data-src, srcset, <picture>, CSS url()), and background images/videos in CSS.
	•	Video: If .m3u8/DASH detected, try:

ffmpeg -i "<playlist_url>" -codec copy -bsf:a aac_adtstoasc public/vendor/theinsuranceschool.com/video/home-hero.mp4

If conversion fails, store the playlist + segments under /public/vendor/theinsuranceschool.com/video/hls/... and keep references in the manifest.

	•	Save raw HTML + assets into /var/scrape/theinsuranceschool.com/raw.

5) Normalization, Rewriting & Manifest
	•	Move assets into /public/vendor/theinsuranceschool.com/{img|css|js|fonts|docs|video|json}/...
	•	Name as basename__sha256.ext for dedupe.
	•	Rewrite all references in HTML/CSS/JS to local paths:
	•	Replace absolute/relative theinsuranceschool.com URLs with the local public paths.
	•	Preserve anchors/querystrings where relevant.
	•	Build /var/scrape/theinsuranceschool.com/manifest.json:

{
  "domain": "theinsuranceschool.com",
  "timestamp": "...",
  "pages": [{ "url": "...", "slug": "...", "status": 200, "html": "normalized/...html", "assets": [...] }],
  "assets": [{ "url": "...", "local": "...", "type": "...", "bytes": ..., "sha256": "..." }],
  "hls_converted": [...],
  "missing_assets": [...],
  "errors": [...]
}



6) Legacy CSS Namespacing
	•	Merge captured CSS → src/legacy/theinsuranceschool.com/legacy.css.
	•	PostCSS-prefix every selector with .legacy-scope.
	•	LegacyHTML.tsx:
	•	Wrap content in <div className="legacy-scope">...</div>.
	•	Lazy-load legacy.css only on /legacy/theinsuranceschool.com/* routes.

7) Generate Page Components & Routes
	•	For each page in the manifest, create a component at:
	•	src/legacy/theinsuranceschool.com/pages/{slug}.tsx that renders rewritten HTML via <LegacyHTML html={...} /> and sets <title>/meta from the original.
	•	Routing:
	•	Next.js (App Router): create app/legacy/theinsuranceschool.com/{slug}/page.tsx importing the generated component; add app/legacy/theinsuranceschool.com/layout.tsx that loads legacy.css.
	•	Next.js (Pages Router): create pages/legacy/theinsuranceschool.com/{slug}.tsx and import legacy.css once in _app.tsx gated by route.
	•	React Router: export routes in src/legacy/theinsuranceschool.com/routes.tsx and mount under /legacy/theinsuranceschool.com/* in the main router.

8) Payments Consolidation — /courses/payments
	1.	Source of truth: Parse course cards/data from:
	•	https://theinsuranceschool.com/prelicensecourse/
	•	any course pricing content encountered elsewhere (e.g., home or subpages).
	2.	Data model (derive automatically from scraped HTML):

{
  id, title, price, description, bullets: string[],
  badge?: "Best deal" | null,
  ctaText?: string, ctaUrl?: string,
  media?: { image?: string, video?: string }
}


	3.	UI Requirements (enterprise polish):
	•	3-column responsive grid (1 col mobile, 2 tablet, 3 desktop).
	•	Glassmorphism cards (backdrop-blur, semi-transparent gradient, 2xl radius, tasteful shadow).
	•	Hover micro-interactions (lift, shadow intensify, subtle scale).
	•	Prominent price; pill badges; bullet lists with icons.
	•	Primary CTA (“Enroll” / “Pay”) wired to the original link (local route if captured; otherwise absolute).
	•	Support for Stripe/external checkout if the original points there (keep link; do not implement payments logic here).
	4.	Files:
	•	src/legacy/theinsuranceschool.com/payments/PaymentsPage.tsx — full page.
	•	Route:
	•	Next.js: app/courses/payments/page.tsx (App Router) or pages/courses/payments.tsx (Pages Router).
	•	React Router: add { path: "/courses/payments", element: <PaymentsPage/> }.
	5.	Content population: Build a small extractor that converts the scraped pre-license page cards into the data model and stores a JSON alongside the manifest (/var/scrape/theinsuranceschool.com/courses.json). The page imports that JSON.

9) Homepage Payments Options Strip (compact, stylish)
	•	Create src/legacy/theinsuranceschool.com/payments/PaymentsStrip.tsx:
	•	Slim row of 3 compact option tiles (the three flagship courses seen on the screenshot: 2-14 Life; 2-40/2-14 Combo; 2-15 Health & Life w/ Annuities).
	•	Each tile shows: course name, small “Best deal” badge when applicable, price, tiny bullet or tagline, and a compact CTA.
	•	High-style finish: soft gradient background, blur layer, subtle animated border sheen on hover, focus-visible rings.
	•	Non-destructive injection on homepage (NO HERO EDITS):
	•	Implement a lightweight client component that, only on path “/”, mounts a portal that inserts the strip right above the site footer (or at the end of <main> if present). Use a selector strategy:
	•	Try document.querySelector('footer')?.before(...).
	•	Else append to document.querySelector('main') || document.body.
	•	Put this mount in a small wrapper loaded by _app.tsx (Next Pages) / app/layout.tsx (Next App) / root App.tsx (React Router) with a route gate if (pathname === "/").
	•	No edits to the hero component file — verify via file hash pre/post.

10) QA & Report
	•	Generate /var/scrape/theinsuranceschool.com/scrape-report.html:
	•	Page count, asset count, total bytes, histogram by content-type.
	•	Side-by-side thumbnails (original vs rewritten) for homepage, /ifast-agent/, /prelicensecourse/.
	•	Explicit row confirming whether the hero background video was captured/converted.
	•	CLI summary prints any missing assets or conversion failures.

11) Idempotence, Git, Revert
	•	SHA-based dedupe for assets; skip re-downloads on rerun.
	•	Make a commit: chore(legacy): import theinsuranceschool.com snapshot + payments UI.
	•	Provide a revert one-liner that removes only generated folders:

node -e "require('fs').rmSync('src/legacy/theinsuranceschool.com',{recursive:true,force:true});require('fs').rmSync('public/vendor/theinsuranceschool.com',{recursive:true,force:true});require('fs').rmSync('var/scrape/theinsuranceschool.com',{recursive:true,force:true});console.log('Legacy import removed.')"



12) Commands to Execute (automate in terminal)

npm run scrape:all

Then automatically:
	•	Wire routes (per detected framework).
	•	Build courses.json from /prelicensecourse/.
	•	Generate /courses/payments page and homepage PaymentsStrip injector.
	•	Print hero file hash before/after and the DOM-injection confirmation line:
Homepage payments strip injected (no hero edits).
