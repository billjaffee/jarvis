// Stock price proxy via Yahoo Finance (no API key needed)
export const handler = async (event, context) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  const tickers = [
    { symbol: 'VENU',  label: 'VENU' },
    { symbol: '^GSPC', label: 'S&P 500' },
    { symbol: '^DJI',  label: 'DOW' },
    { symbol: 'LYV',   label: 'LYV' },
    { symbol: 'MSGE',  label: 'MSGE' },
  ]

  try {
    const results = await Promise.all(
      tickers.map(async ({ symbol, label }) => {
        try {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          )
          const data = await res.json()
          const meta = data?.chart?.result?.[0]?.meta
          const price  = meta?.regularMarketPrice ?? null
          const prev   = meta?.chartPreviousClose ?? meta?.previousClose ?? null
          const change = price && prev ? price - prev : null
          const pct    = change && prev ? (change / prev) * 100 : null

          return {
            symbol,
            label,
            price:  price  ? price.toFixed(symbol.startsWith('^') ? 0 : 2) : null,
            change: change ? change.toFixed(2) : null,
            pct:    pct    ? pct.toFixed(2) : null,
            up:     change !== null ? change >= 0 : null,
          }
        } catch {
          return { symbol, label, price: null, change: null, pct: null, up: null }
        }
      })
    )

    return { statusCode: 200, headers: CORS, body: JSON.stringify(results) }
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
