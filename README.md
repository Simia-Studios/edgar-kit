# edgar-kit

Type-safe SDK for SEC EDGAR filings APIs.

The SDK covers the SEC JSON data APIs, EDGAR full text search endpoint, archive filing retrieval, index files, ticker reference files, and high-level company financial abstractions. It requires a `User-Agent`, sends gzip/deflate headers, and defaults to the SEC fair access limit of 10 requests/second.

Sources used for endpoint behavior:

- SEC EDGAR APIs: https://www.sec.gov/edgar/sec-api-documentation
- SEC developer and fair access guidance: https://www.sec.gov/developer
- SEC developer resources and EDGAR access rules: https://www.sec.gov/about/developer-resources
- EDGAR full text search app/API behavior: https://www.sec.gov/edgar/search/

## SEC EDGAR Compliance

Use of this SDK must comply with the SEC's EDGAR access rules and developer guidance:
https://www.sec.gov/about/developer-resources.

The SEC asks automated clients to download only what they need, use efficient scripts, moderate request volume, and stay within the current fair access guideline of no more than 10 requests per second across all machines used by the same user. `edgar-kit` requires a caller-provided `User-Agent` so SEC requests identify your application and contact information; the package does not provide a default identity for you.

## Install

```sh
pnpm add edgar-kit
```

## Quick Start

```ts
import { SECClient } from "edgar-kit";

const sec = new SECClient({
  userAgent: "Acme Corp data@example.com",
});

const annualIncome = await sec.financials.statement({
  ticker: "AAPL",
  statement: "income",
  frequency: "annual",
  limit: 5,
});

const revenue = await sec.financials.metric({
  ticker: "AAPL",
  metric: "revenue",
  frequency: "quarterly",
  limit: 8,
});
```

High-level methods return promises and reject with `SECClientError` subclasses when inputs or requests fail.

## Company Financials

Use `financials.company` when you want all supported statement metrics, `financials.statement` when you want one statement, and `financials.metric` when you want one normalized line item over time.

```ts
const annualFinancials = await sec.financials.company({
  ticker: "MSFT",
  frequency: "annual",
  limit: 3,
});

const balanceSheet = await sec.financials.statement({
  cik: 320193,
  statement: "balance-sheet",
  frequency: "annual",
  limit: 4,
});

const operatingCashFlow = await sec.financials.metric({
  ticker: "AAPL",
  metric: "operatingCashFlow",
  frequency: "annual",
});
```

Supported statements are `income`, `balance-sheet`, and `cash-flow`. Supported metrics include revenue, gross profit, operating income, net income, EPS, shares, assets, liabilities, equity, cash, debt, operating cash flow, capital expenditures, dividends paid, and common shares outstanding.

## Share Prices

SEC EDGAR does not provide historical market prices. Configure a `sharePriceProvider` to connect your market-data source while keeping the SDK call shape normalized around SEC tickers and CIKs.

```ts
const secWithPrices = new SECClient({
  userAgent: "Your App your.email@example.com",
  sharePriceProvider: {
    historicalPrices: async ({ ticker, startDate, endDate, interval }) => {
      // Call your market-data provider here and return normalized OHLCV bars.
      return [];
    },
  },
});

const prices = await secWithPrices.sharePrices.history({
  ticker: "AAPL",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  interval: "daily",
});

const latestShopify = await secWithPrices.sharePrices.latest({
  ticker: "SHOP",
});
```

## Low-Level URLs

URL helpers are available when you need direct SEC endpoint URLs:

```ts
const filingUrl = sec.archives.filingDocumentUrl({
  cik: 320193,
  accessionNumber: "0000320193-26-000013",
  fileName: "aapl-20260328.htm",
});

const companyFactsUrl = sec.xbrl.companyFactsUrl({
  cik: 320193,
});
```

## Errors

Requests fail with `SECRequestError`. Invalid inputs such as malformed CIKs fail with `SECInputError`. Provider adapters fail with `SECProviderError`.
