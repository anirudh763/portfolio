#!/usr/bin/env python3
"""Builds dist/index.html (one file, fonts inlined) from index.template.html.
Usage: build.py [site_url]   The audit panel is filled from audit.json, which check.js writes."""
import base64, json, pathlib, re, shutil, sys

here = pathlib.Path(__file__).parent
fonts = here / "node_modules/@fontsource/atkinson-hyperlegible/files"
b64 = lambda name: base64.b64encode((fonts / name).read_bytes()).decode()
url = sys.argv[1] if len(sys.argv) > 1 else ""

html = (here / "index.template.html").read_text(encoding="utf-8")
if url:
    html = html.replace("{{SITE_URL}}", url)
else:  # no address yet: leave out the tags that need one
    html = re.sub(r'^<(?:link rel="canonical"|meta property="og:url")[^\n]*\n', "", html, flags=re.M)
    html = html.replace('"url":"{{SITE_URL}}",', "")

CHECK = '<svg aria-hidden="true" focusable="false" viewBox="0 0 20 20"><path d="M3.5 10.5l4.2 4.2L16.5 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
audit_file = here / "audit.json"
if audit_file.exists():
    a = json.loads(audit_file.read_text())
    items = a["items"]; how = a["how"]; summary = a["summary"]
else:
    items = ["Not measured yet."]; how = ""; summary = "Not measured yet."
audit = "\n".join(f"          <li>{CHECK}<span>{t}</span></li>" for t in items)

contact = [("https://www.linkedin.com/in/anirudhyadavboosa", "Message me on LinkedIn"),
           ("https://github.com/anirudh763", "GitHub profile")]
contact_html = "\n".join(f'          <li><a href="{h}">{t}</a></li>' for h, t in contact)

SHOT = ('          <img class="shot" src="talkback-results.webp" width="1600" height="763" alt="Results screen of the TalkBack Triage Pilot web app. Its headline reads: with only the TalkBack steps taken out, Claude changed from enough to start reproducing to needs more evidence on 12 of 32 reports, and the other way on 1. Below it, a table compares the model\'s answers across four versions of the reports.">')
CELLS = '<span class="to"></span>' * 12 + '<span class="back"></span>' + '<span></span>' * 19
for key, val in {"FONT_400": b64("atkinson-hyperlegible-latin-400-normal.woff2"),
                 "FONT_400I": b64("atkinson-hyperlegible-latin-400-italic.woff2"),
                 "FONT_700": b64("atkinson-hyperlegible-latin-700-normal.woff2"),
                 "RESUME_HREF": "Anirudh_Yadav_Boosa_Resume.pdf", "CV_HREF": "Anirudh_Yadav_Boosa_CV.pdf",
                 "AUDIT_ITEMS": audit, "AUDIT_HOW": how, "AUDIT_SUMMARY": summary, "CONTACT_LINKS": contact_html, "TALKBACK_SHOT": SHOT, "CELLS": CELLS}.items():
    html = html.replace("{{" + key + "}}", val)
left = re.findall(r"\{\{[A-Z_0-9]+\}\}", html)
assert not left, left

dist = here / "dist"; dist.mkdir(exist_ok=True)
(dist / "index.html").write_text(html, encoding="utf-8")
shutil.copy(here / "shots/talkback-results.webp", dist / "talkback-results.webp")
(dist / ".nojekyll").write_text("")
for src, name in (("R_PUB.pdf", "Anirudh_Yadav_Boosa_Resume.pdf"), ("CV_PUB.pdf", "Anirudh_Yadav_Boosa_CV.pdf")):
    p = pathlib.Path("/home/claude/tri/out") / src
    if p.exists(): shutil.copy(p, dist / name)
print("index.html", round(len(html.encode()) / 1024), "KB;", sorted(f.name for f in dist.iterdir()))
