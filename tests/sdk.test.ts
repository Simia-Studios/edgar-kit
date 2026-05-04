import { describe, expect, it } from "vitest";
import {
  SECClient,
  flattenFilings,
  formatAccessionDirectory,
  formatCik,
  parseMasterIndex,
  searchHitToFiling,
} from "../src";
import type { SECRecentFilings } from "../src";
import type { SECSearchHit } from "../src";

describe("SEC SDK formatting and URLs", () => {
  it("normalizes CIKs and accession directories", () => {
    expect(formatCik(320193)).toBe("0000320193");
    expect(formatCik("CIK0000320193")).toBe("0000320193");
    expect(formatAccessionDirectory("0000320193-26-000013")).toBe("000032019326000013");
  });

  it("builds archive, submissions, XBRL, and search URLs", () => {
    const client = new SECClient({
      userAgent: "Acme Corp data@example.com",
    });

    expect(
      client.archives.filingDocumentUrl({
        cik: 320193,
        accessionNumber: "0000320193-26-000013",
        fileName: "aapl-20260328.htm",
      }),
    ).toBe("https://www.sec.gov/Archives/edgar/data/320193/000032019326000013/aapl-20260328.htm");

    expect(client.submissions.submissionsUrl(320193)).toBe("https://data.sec.gov/submissions/CIK0000320193.json");

    expect(
      client.xbrl.companyConceptUrl({
        cik: 320193,
        taxonomy: "us-gaap",
        tag: "AccountsPayableCurrent",
      }),
    ).toBe("https://data.sec.gov/api/xbrl/companyconcept/CIK0000320193/us-gaap/AccountsPayableCurrent.json");

    const searchUrl = new URL(
      client.search.filingsSearchUrl({
        query: "apple",
        ciks: 320193,
        forms: ["10-K", "8-K"],
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        page: 2,
        sort: "desc",
      }),
    );

    expect(searchUrl.origin).toBe("https://efts.sec.gov");
    expect(searchUrl.pathname).toBe("/LATEST/search-index");
    expect(searchUrl.searchParams.get("q")).toBe("apple");
    expect(searchUrl.searchParams.get("ciks")).toBe("0000320193");
    expect(searchUrl.searchParams.get("forms")).toBe("10-K,8-K");
    expect(searchUrl.searchParams.get("startdt")).toBe("2025-01-01");
    expect(searchUrl.searchParams.get("enddt")).toBe("2025-12-31");
    expect(searchUrl.searchParams.get("from")).toBe("100");
    expect(searchUrl.searchParams.get("sort")).toBe("desc");

    expect(new URL(client.search.filingsSearchUrl({ category: "exclude-ownership" })).searchParams.get("forms")).toBe(
      "-3,-4,-5",
    );
  });
});

describe("SEC response helpers", () => {
  it("flattens SEC columnar recent filings into usable filing records", () => {
    const recent: SECRecentFilings = {
      accessionNumber: ["0000320193-26-000013"],
      filingDate: ["2026-05-01"],
      reportDate: ["2026-03-28"],
      acceptanceDateTime: ["2026-05-01T18:01:00.000Z"],
      act: ["34"],
      form: ["10-Q"],
      fileNumber: ["001-36743"],
      filmNumber: ["26123456"],
      items: [""],
      size: [999_810],
      isXBRL: [1],
      isInlineXBRL: [1],
      primaryDocument: ["aapl-20260328.htm"],
      primaryDocDescription: ["10-Q"],
    };

    expect(flattenFilings(recent, { cik: 320193, secBaseUrl: "https://www.sec.gov" })).toEqual([
      {
        index: 0,
        accessionNumber: "0000320193-26-000013",
        accessionNumberNoDashes: "000032019326000013",
        filingDate: "2026-05-01",
        reportDate: "2026-03-28",
        acceptanceDateTime: "2026-05-01T18:01:00.000Z",
        act: "34",
        form: "10-Q",
        fileNumber: "001-36743",
        filmNumber: "26123456",
        items: "",
        size: 999_810,
        isXBRL: true,
        isInlineXBRL: true,
        primaryDocument: "aapl-20260328.htm",
        primaryDocDescription: "10-Q",
        cik: "320193",
        documentUrl: "https://www.sec.gov/Archives/edgar/data/320193/000032019326000013/aapl-20260328.htm",
        filingDirectoryUrl: "https://www.sec.gov/Archives/edgar/data/320193/000032019326000013",
        filingIndexUrl:
          "https://www.sec.gov/Archives/edgar/data/320193/000032019326000013/0000320193-26-000013-index.html",
      },
    ]);
  });

  it("maps full text search hits to filing records", () => {
    const hit: SECSearchHit = {
      _index: "edgar_file",
      _id: "0000320193-25-000079:aapl-20250927.htm",
      _score: 8.1,
      _source: {
        ciks: ["0000320193"],
        period_ending: "2025-09-27",
        file_num: ["001-36743"],
        display_names: ["Apple Inc.  (AAPL)  (CIK 0000320193)"],
        xsl: null,
        sequence: 1,
        root_forms: ["10-K"],
        file_date: "2025-10-31",
        biz_states: ["CA"],
        sics: ["3571"],
        form: "10-K",
        adsh: "0000320193-25-000079",
        film_num: ["251437791"],
        biz_locations: ["Cupertino, CA"],
        file_type: "10-K",
        file_description: "10-K",
        inc_states: ["CA"],
        items: [],
      },
    };

    expect(searchHitToFiling(hit)).toMatchObject({
      accessionNumber: "0000320193-25-000079",
      accessionNumberNoDashes: "000032019325000079",
      cik: "320193",
      form: "10-K",
      fileName: "aapl-20250927.htm",
      documentUrl: "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm",
    });
  });

  it("parses SEC master index files", () => {
    const index = `Description: Master Index

CIK|Company Name|Form Type|Date Filed|Filename
--------------------------------------------------------------------------------
1000045|OLD MARKET CAPITAL Corp|10-Q|2025-02-14|edgar/data/1000045/0000950170-25-021128.txt
1000097|KINGDON CAPITAL MANAGEMENT, L.L.C.|13F-HR|2025-02-14|edgar/data/1000097/0001000097-25-000014.txt
`;

    expect(parseMasterIndex(index)).toEqual([
      {
        cik: 1000045,
        companyName: "OLD MARKET CAPITAL Corp",
        formType: "10-Q",
        dateFiled: "2025-02-14",
        fileName: "edgar/data/1000045/0000950170-25-021128.txt",
      },
      {
        cik: 1000097,
        companyName: "KINGDON CAPITAL MANAGEMENT, L.L.C.",
        formType: "13F-HR",
        dateFiled: "2025-02-14",
        fileName: "edgar/data/1000097/0001000097-25-000014.txt",
      },
    ]);
  });
});

describe("SECClient HTTP integration", () => {
  it("runs Effect requests with configured SEC headers", async () => {
    const headersSeen: string[] = [];
    const fetchMock: typeof fetch = async (_input, init) => {
      const headers = new Headers(init?.headers);
      headersSeen.push(headers.get("User-Agent") ?? "");
      headersSeen.push(headers.get("Accept-Encoding") ?? "");

      return new Response(
        JSON.stringify({
          0: {
            cik_str: 320193,
            ticker: "AAPL",
            title: "Apple Inc.",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    };

    const client = new SECClient({
      userAgent: "Acme Corp data@example.com",
      fetch: fetchMock,
      maxRequestsPerSecond: 10,
    });

    await expect(client.run(client.tickers.companies())).resolves.toEqual([
      {
        cik_str: 320193,
        ticker: "AAPL",
        title: "Apple Inc.",
      },
    ]);
    expect(headersSeen).toEqual(["Acme Corp data@example.com", "gzip, deflate"]);
  });
});
