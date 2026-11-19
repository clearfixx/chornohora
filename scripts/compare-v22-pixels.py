#!/usr/bin/env python3
"""Compare original-v22 and native Chromium captures without modifying either renderer.

Produces a measurable JSON/Markdown report and side-by-side/difference contact
sheets for human approval. Differences are diagnostic, NOT a release gate:
font rasterization, iframe scrollbars and animation timing can affect pixels.
"""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageStat

ROOT = Path("artifacts/v22-browser")
SCENES = ("hero", "hoverla", "brebeneskul", "nesamovyte", "petros")
REPORT = []
MISSING = []
for locale in ("uk", "en"):
    for width in (1440, 390):
        rows = []
        for scene in SCENES:
            stem = f"{locale}-{width}"
            original_path = ROOT / f"{stem}-original-{scene}.png"
            native_path = ROOT / f"{stem}-native-{scene}.png"
            if not original_path.is_file() or not native_path.is_file():
                MISSING.append(f"{stem}/{scene}")
                continue
            with Image.open(original_path) as src, Image.open(native_path) as dst:
                original = src.convert("RGB")
                native = dst.convert("RGB")
            if original.size != native.size:
                MISSING.append(f"{stem}/{scene}: mismatched sizes {original.size} {native.size}")
                continue
            # Exclude a narrow right-hand strip to reduce scrollbar false positives.
            crop = (0, 0, max(1, original.width - 18), original.height)
            difference = ImageChops.difference(original.crop(crop), native.crop(crop))
            mean_error = sum(ImageStat.Stat(difference).mean) / 3
            # Count pixels with a visually meaningful channel difference.
            diff_pixels = sum(1 for pixel in difference.getdata() if max(pixel) >= 24)
            fraction = diff_pixels / (difference.width * difference.height)
            REPORT.append({
                "locale": locale, "width": width, "scene": scene,
                "size": list(original.size),
                "mean_absolute_error": round(mean_error, 3),
                "changed_pixel_fraction_at_24": round(fraction, 5),
            })
            # Downscale panels to keep artifacts manageable; include boosted difference.
            panel_width = 540 if width == 1440 else 270
            panel_height = round(original.height * panel_width / original.width)
            original_thumb = original.resize((panel_width, panel_height))
            native_thumb = native.resize((panel_width, panel_height))
            difference_thumb = ImageEnhance.Contrast(difference).enhance(3).resize((panel_width, panel_height))
            sheet_row = Image.new("RGB", (panel_width * 3, panel_height), "white")
            for i, im in enumerate((original_thumb, native_thumb, difference_thumb)):
                sheet_row.paste(im, (i * panel_width, 0))
            rows.append(sheet_row)
        if rows:
            contact = Image.new("RGB", (rows[0].width, sum(r.height for r in rows)), "white")
            y = 0
            for row in rows:
                contact.paste(row, (0, y))
                y += row.height
            contact.save(ROOT / f"contact-{locale}-{width}.jpg", quality=82, optimize=True)

ROOT.mkdir(parents=True, exist_ok=True)
(ROOT / "visual-diff.json").write_text(json.dumps({"comparisons": REPORT, "missing": MISSING}, ensure_ascii=False, indent=2) + "\n")
lines = [
    "# Original v22 vs native — pixel comparison",
    "",
    "Contact sheets are ordered by Hero, Hoverla, Brebeneskul, Nesamovyte, Petros.",
    "Each row shows **original | native | boosted difference**.",
    "Metrics exclude the rightmost 18 pixels to reduce scrollbar noise.",
    "This is a diagnostic report; a human must review differences before switching the default renderer.",
    "",
    "| Locale | Width | Scene | Mean absolute RGB error | Pixels differing ≥24 |",
    "|---|---:|---|---:|---:|",
]
for row in REPORT:
    lines.append(f"| {row['locale']} | {row['width']} | {row['scene']} | {row['mean_absolute_error']:.3f} | {row['changed_pixel_fraction_at_24']:.1%} |")
if MISSING:
    lines.extend(["", "## Missing captures", *[f"- {name}" for name in MISSING]])
(ROOT / "visual-diff.md").write_text("\n".join(lines) + "\n")
print("\n".join(lines))
if MISSING:
    raise SystemExit("Missing or incompatible screenshots; visual comparison incomplete")
