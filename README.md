# edgar-kit

Type-safe Effect SDK for SEC EDGAR filings APIs.

The SDK covers the SEC JSON data APIs, EDGAR full text search endpoint, archive filing retrieval, index files, and ticker reference files. It requires a `User-Agent`, sends gzip/deflate headers, and defaults to the SEC fair access limit of 10 requests/second.

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

const apple = await sec.run(sec.companies.byTicker("AAPL"));

const recent10Ks = await sec.run(
  sec.companies.filingsByTicker({
    ticker: "AAPL",
    forms: "10-K",
    startDate: "2020-01-01",
    limit: 5,
  }),
);
```

All network methods return `Effect.Effect<Success, SECClientError>`. Use `client.run(...)` for promise-based code, or compose the Effects directly in an Effect application.

## Operations

```ts
const sec = new SECClient({
  userAgent: "Your App your.email@example.com",
  maxRequestsPerSecond: 10,
});
```

Tickers and company lookup:

```ts
await sec.run(sec.tickers.companies());
await sec.run(sec.tickers.companyTickersWithExchanges());
await sec.run(sec.tickers.mutualFundTickers());
await sec.run(sec.companies.byTicker("MSFT"));
```

Submissions and filing lists:

```ts
await sec.run(sec.submissions.get({ cik: 320193 }));
await sec.run(
  sec.submissions.listFilings({
    cik: "0000320193",
    forms: ["10-K", "10-Q", "8-K"],
    startDate: "2024-01-01",
    endDate: "2026-12-31",
    includeAdditionalFiles: true,
  }),
);
```

Full text filing search:

```ts
await sec.run(
  sec.search.filingResults({
    query: '"artificial intelligence"',
    forms: ["10-K", "10-Q"],
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    locationType: "located",
    locationCode: "CA",
    page: 1,
  }),
);
```

Filing documents and archive metadata:

```ts
await sec.run(
  sec.archives.filingDirectory({
    cik: 320193,
    accessionNumber: "0000320193-26-000013",
  }),
);

const html = await sec.run(
  sec.archives.filingDocument({
    cik: 320193,
    accessionNumber: "0000320193-26-000013",
    fileName: "aapl-20260328.htm",
  }),
);
```

XBRL data:

```ts
await sec.run(
  sec.xbrl.companyFacts({
    cik: 320193,
  }),
);

await sec.run(
  sec.xbrl.companyConcept({
    cik: 320193,
    taxonomy: "us-gaap",
    tag: "AccountsPayableCurrent",
  }),
);

await sec.run(
  sec.xbrl.frame({
    taxonomy: "us-gaap",
    tag: "AccountsPayableCurrent",
    unit: "USD",
    period: { year: 2025, quarter: 1, instant: true },
  }),
);
```

Index files:

```ts
await sec.run(
  sec.indexes.masterIndex({
    directory: "full",
    year: 2025,
    quarter: 1,
  }),
);
```

## Errors

Requests fail with `SECRequestError`. Invalid inputs such as malformed CIKs fail with `SECInputError`.

```ts
import { Effect } from "effect";

const program = sec.search
  .filingResults({ query: "climate", forms: "10-K" })
  .pipe(Effect.catchTag("SECRequestError", (error) => Effect.succeed([])));
```

## Development

All direct package versions are exact. `.npmrc` sets `save-exact=true` for future dependency changes.

```sh
pnpm install
pnpm test
pnpm build
pnpm check
```

Publish with an explicit semver bump:

```sh
./publish.sh patch
./publish.sh minor
./publish.sh major
```
