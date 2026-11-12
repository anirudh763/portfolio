# Anirudh Yadav Boosa: portfolio

Live site: https://anirudh763.github.io/portfolio/

One static page (`index.html`) about my research on mobile accessibility and my other projects. No JavaScript runs on it, the font is embedded, and it has a light and a dark theme.

## What is in this repository

| Path | What it is |
|---|---|
| `index.html` | The page that GitHub Pages serves. Built file; do not edit by hand. |
| `talkback-results.webp` | Screenshot of the TalkBack Triage Pilot results screen, used on the page. |
| `Anirudh_Yadav_Boosa_Resume.pdf`, `Anirudh_Yadav_Boosa_CV.pdf` | Public copies of my resume and CV (no phone number or email). |
| `site-src/` | Source of the page: `index.template.html`, `build.py` (fills the template and embeds the font), `check.js` (the accessibility gate). |
| `My_Claude_Code_/` | An older Next.js prototype (drone simulator and contrast functions). Not part of the site. |

## How the page is checked

`site-src/check.js` loads the built page in Chromium with Playwright and axe-core. It fails unless all of these hold, and unless the page's own "This page, checked" panel shows exactly the measured values:

- no axe-core violations in the light or the dark theme;
- text contrast of at least 4.5 to 1;
- every link and control at least 24 px tall at 320, 640 and 1280 px wide;
- no sideways scrolling at 320 px, at 200% zoom, or with the text size doubled;
- every link and control reachable with Tab, with a visible focus ring, in both themes;
- no scripts, and all headings and links present with JavaScript off;
- every image loads and has alt text.

The gate was tested by breaking the page on purpose in 19 ways and confirming that each break makes it fail.

These are automated checks, and automated checks find only some problems. The page has not yet been tested by hand with TalkBack, VoiceOver or NVDA.

## Rebuild

```
cd site-src
npm install            # font and axe-core
node check.js          # measure
python3 build.py https://anirudh763.github.io/portfolio/
node check.js          # must print "ok": true
```

`build.py` copies the two PDFs from a local folder; change that path at the bottom of the file if you rebuild elsewhere.

The page and its build scripts were written with AI assistance.
