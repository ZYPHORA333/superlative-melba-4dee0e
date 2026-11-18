# NORTHSTAR Pyth XAU/USD integration

## Netlify configuration
1. In Netlify → Site configuration → Environment variables, add `PYTH_API_KEY` with a valid Pyth Hermes API key. **Do not commit it**. Hermes authentication is required after the August 2026 Pyth upgrade.
2. Optional: add `PYTH_PRO_API_KEY` with an entitled Pyth Pro key for historical OHLC candles. Without it, daily and weekly opens are **not** displayed, and the chart plots only quotes observed by the browser while visiting the site.
3. Redeploy the site so Netlify Functions can read the variables.
4. Open `/.netlify/functions/gold-price` on your deployed site to verify JSON. Confirm source, price, publishTime, ageSeconds, and whether the quote is stale. Verify the main XAU/USD section updates.
5. During closed sessions, Pyth Metal.XAU/USD quotes can be old; the UI labels quotes older than 120 seconds stale. It never presents old prices as current.

## Source and limitations
- Feed: `Metal.XAU/USD`, Hermes ID `0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2`.
- Authenticated Hermes latest price endpoint: `https://pyth.dourolabs.app/hermes/v2/updates/price/latest`.
- Pyth Pro historical REST endpoint: `https://pyth.dourolabs.app/v1/fixed_rate@1000ms/history`.
- Daily and weekly opens use Pyth daily OHLC candle opens (calendar Monday week in America/New_York); these may differ from broker session opens and may be unavailable when an opening candle is absent.
- History uses Pyth Pro hourly close samples. Without Pro, the chart is **not** historical: browser-observed quotes are saved to localStorage.
- No trading execution, no guarantee of tick-level precision, and no fake fallback quote. The Pyth API may have usage costs, entitlement requirements, and distribution terms for public websites.

Documentation: https://docs.pyth.network/api-reference/hermes/latest-price-updates and https://docs.pyth.network/pro/api/rest.
