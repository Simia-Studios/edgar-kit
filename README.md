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
  maxRps: 10,
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

High-level methods return promises and reject with `SECClientError` subclasses when inputs or requests fail. Effect-based resource methods are run through the client boundary, for example `await sec.run(sec.tickers.companies())`.

`maxRps` defaults to `10` to match SEC fair access guidance. Set a different number to change the client-side request rate, or set `maxRps: null` to disable the SDK rate limiter entirely.

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

The SEC quarterly report is `Form 10-Q` (`10-Q/A` for amendments and `10-QT` for transition periods). Quarterly earnings releases are commonly filed as `Form 8-K` reports with Item `2.02`; `SECFiling` and `SECSearchFiling` expose `isEarningsRelease` for that case.

Quarterly financial outputs include filing and period provenance on each line item, including `fiscalQuarter`, `periodType`, `periodLengthDays`, `accessionNumberNoDashes`, `filing.reportName`, filing URLs, and the source XBRL `frame`. When a 10-Q includes both quarter-to-date and year-to-date facts for the same quarter, the SDK prefers the true quarterly fact.

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

| Error              | When it happens                                                                                                                                                                  | Useful fields                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `SECInputError`    | The SDK cannot build a valid request from the provided input, such as a malformed CIK, invalid date, unknown financial metric, missing ticker/CIK, or an impossible query range. | `message`, `input`                                                          |
| `SECRequestError`  | An SEC HTTP request fails, returns a non-2xx response, or fails before a response is received.                                                                                   | `message`, `url`, `method`, `status`, `statusText`, `responseBody`, `cause` |
| `SECProviderError` | A configured external provider fails, currently used for `sharePriceProvider` failures.                                                                                          | `message`, `provider`, `cause`                                              |
| `TypeError`        | `SECClient` is initialized without a non-empty `userAgent`. This is thrown synchronously by the constructor before any request is made.                                          | `message`                                                                   |

Use `isSECClientError(error)` to narrow errors thrown from SDK operations to the exported `SECClientError` union: `SECInputError`, `SECRequestError`, or `SECProviderError`.
