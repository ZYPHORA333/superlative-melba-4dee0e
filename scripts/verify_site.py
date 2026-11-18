"""Lightweight, dependency-free validation for the NORTHSTAR static site."""
from pathlib import Path
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
required = ["index.html", "assets/app.js", "assets/style.css", "assets/recipes.json"]
errors = []
for name in required:
    path = root / name
    if not path.is_file() or path.stat().st_size == 0:
        errors.append(f"Missing or empty: {name}")

if not errors:
    html = (root / "index.html").read_text(encoding="utf-8")
    for target in ("assets/app.js", "assets/style.css"):
        if target not in html:
            errors.append(f"HTML does not reference {target}")
    try:
        recipes = json.loads((root / "assets/recipes.json").read_text(encoding="utf-8"))
        if not isinstance(recipes, list):
            errors.append("recipes.json must be a list")
        else:
            ids = [r.get("id") for r in recipes if isinstance(r, dict)]
            if len(ids) != len(recipes) or len(ids) != len(set(ids)):
                errors.append("Recipe IDs must exist and be unique")
            for category in ("breakfast", "lunch", "dinner"):
                count = sum(isinstance(i, str) and re.fullmatch(rf"{category}-\d+", i) is not None for i in ids)
                if count != 30:
                    errors.append(f"Expected 30 {category} recipes; found {count}")
            if len(recipes) != 90:
                errors.append(f"Expected 90 recipes; found {len(recipes)}")
    except (OSError, ValueError) as exc:
        errors.append(f"Invalid recipes.json: {exc}")

if errors:
    print("NORTHSTAR checks FAILED:")
    for error in errors:
        print(" -", error)
    sys.exit(1)
print("NORTHSTAR checks passed: site assets present and 90 recipe IDs verified.")
