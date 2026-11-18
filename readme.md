# NORTHSTAR — Responsive survival platform

## Launch quickly

Upload this entire folder to Netlify Drop (https://app.netlify.com/drop), or serve it locally:

```bash
cd northstar-complete
python3 -m http.server 8000
```

Open http://localhost:8000. Do not open `index.html` as a `file://` URL because browsers often block fetching local JSON files.

## Included

- Cinematic responsive homepage and eight departments
- 90 fully specified meal recipes (30 breakfasts, 30 lunches, 30 dinners) in `assets/recipes.json`
- Adjustable household servings, searchable recipe details, 30-day calendar, monthly grocery list CSV
- Printable illustrated 30-day plan (browser Print > Save as PDF)
- OpenStreetMap/Leaflet 2D geographic explorer with coordinate search and local saved research points
- Household preparedness calculations and checklist
- Marketplace category browsing and local wishlist
- Local dashboard and JSON export

## Important production limitations

- This is a static site with **no backend authentication**, no live payment checkout, and no live product inventory. Local browser storage is not a secure user account.
- The map needs internet access for Leaflet and map tiles. Mapped water does not certify water quality, flow, legal access or buildability.
- Food photography is representative and may not depict the exact recipe. Verify or license exact images before commercial publication.
- Recipe nutritional values are estimates and are not medically tailored. The household size multiplies adult-equivalent recipe portions; adjust for children and allergies.
- Meal plan printing uses the browser print dialog. Select “Save as PDF.”
- Image and font assets are remote and require internet connectivity.

## Future integration

Add Supabase Auth + Postgres with row-level security for user accounts and synced plans; Stripe for commerce; official hydrology, parcel, flood and climate data providers for land verification.
