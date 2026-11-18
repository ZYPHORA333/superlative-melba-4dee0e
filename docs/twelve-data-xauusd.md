# Twelve Data XAU/USD — NORTHSTAR setup

1. **Rotate the previously shared API key** in Twelve Data. Never commit an API key to this repository.
2. In Netlify > Site configuration > Environment variables, create `TWELVE_DATA_API_KEY` with the newly issued key. Redeploy the site.
3. Verify the account has **XAU/USD commodity access** and enough API credits for four provider calls per dashboard refresh. Free plans may not support the instrument.
4. Visit `/.netlify/functions/gold-price?interval=1h` on the deployed site to inspect the returned JSON (no key is exposed). Visit `#gold-market` to check the dashboard and timeframe selector.
5. Confirm the daily/weekly open timestamps match the intended trading-session convention. Twelve Data daily/weekly candle opens may differ from MT5 broker opens.
6. Confirm your subscription permits public website display or redistribution before making the terminal public.

## Architecture

The browser requests only the Netlify serverless function. The function reads `TWELVE_DATA_API_KEY` from environment variables and calls `/quote` and `/time_series` for the selected interval, 1day, and 1week. Missing entitlement, quota exhaustion, and unavailable candles are explicitly surfaced; values are not fabricated. The chart uses actual OHLC bars, not simulated prices. Displayed market timestamps reflect the provider, and the page warns about possible delay.

## Testing

- Without the environment variable: HTTP 503 and clear setup error.
- With unsupported commodity access: HTTP 503 and provider error.
- With valid access: positive quote or candle-derived price, daily/weekly opens, and selected OHLC chart.
- Change chart timeframe and refresh; check API quota and rate limits.
- Verify no API key appears in page source, network responses, GitHub history or error messages.
- Netlify function requires a deployment; GitHub commits alone do not update the live site.

Official documentation: https://twelvedata.com/commodities and https://support.twelvedata.com/en/articles/5656039-how-to-get-historical-prices
