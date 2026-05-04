import { Effect } from "effect";
import type { SECClientError, SECInputError } from "../errors";
import type { SECHttpClient } from "../http";
import type { SECBaseUrls } from "../endpoints";
import type {
  GetSubmissionFileInput,
  GetSubmissionsInput,
  ListFilingsInput,
  SECFiling,
  SECRecentFilings,
  SECSubmission,
  SECSubmissionFile,
} from "../types/submissions";
import { createUrl, formatAccessionDirectory, formatCik, formatSECDate, normalizeList } from "../utils/format";

export class SubmissionsClient {
  constructor(
    private readonly http: SECHttpClient,
    private readonly baseUrls: SECBaseUrls,
    private readonly secBaseUrl: string,
  ) {}

  get(input: GetSubmissionsInput): Effect.Effect<SECSubmission, SECClientError> {
    return Effect.flatMap(buildUrlEffect(() => this.submissionsUrl(input.cik)), (url) =>
      this.http.requestJson<SECSubmission>(url),
    );
  }

  getFile(input: GetSubmissionFileInput): Effect.Effect<SECSubmissionFile, SECClientError> {
    return Effect.flatMap(buildUrlEffect(() => createUrl(this.baseUrls.data, `/submissions/${input.fileName}`)), (url) =>
      this.http.requestJson<SECSubmissionFile>(url),
    );
  }

  listFilings(input: ListFilingsInput): Effect.Effect<SECFiling[], SECClientError> {
    return Effect.gen(this, function* () {
      const submission = yield* this.get(input);
      const blocks: SECRecentFilings[] = [submission.filings.recent];

      if (input.includeAdditionalFiles && submission.filings.files?.length) {
        const files = yield* Effect.all(
          submission.filings.files.map((file) => this.getFile({ fileName: file.name })),
          { concurrency: 1 },
        );

        blocks.push(...files);
      }

      const filings = blocks.flatMap((block) =>
        flattenFilings(block, {
          cik: submission.cik,
          secBaseUrl: this.secBaseUrl,
        }),
      );

      return filterFilings(filings, input);
    });
  }

  submissionsUrl(cik: GetSubmissionsInput["cik"]): string {
    return createUrl(this.baseUrls.data, `/submissions/CIK${formatCik(cik)}.json`);
  }
}

export const flattenFilings = (
  filings: SECRecentFilings,
  options: {
    cik?: string | number;
    secBaseUrl?: string;
  } = {},
): SECFiling[] => {
  return filings.accessionNumber.map((accessionNumber, index) => {
    const accessionNumberNoDashes = formatAccessionDirectory(accessionNumber);
    const cik = options.cik === undefined ? undefined : String(Number(String(options.cik).replace(/\D/g, "")));
    const primaryDocument = filings.primaryDocument[index];
    const filingDirectoryUrl =
      cik && options.secBaseUrl
        ? createUrl(options.secBaseUrl, `/Archives/edgar/data/${cik}/${accessionNumberNoDashes}`)
        : undefined;

    return {
      index,
      accessionNumber,
      accessionNumberNoDashes,
      filingDate: filings.filingDate[index],
      reportDate: filings.reportDate[index],
      acceptanceDateTime: filings.acceptanceDateTime[index],
      act: filings.act[index],
      form: filings.form[index],
      fileNumber: filings.fileNumber[index],
      filmNumber: filings.filmNumber[index],
      items: filings.items[index],
      size: filings.size[index],
      isXBRL: toBoolean(filings.isXBRL[index]),
      isInlineXBRL: toBoolean(filings.isInlineXBRL[index]),
      primaryDocument,
      primaryDocDescription: filings.primaryDocDescription[index],
      cik,
      documentUrl: filingDirectoryUrl && primaryDocument ? createUrl(filingDirectoryUrl, primaryDocument) : undefined,
      filingDirectoryUrl,
      filingIndexUrl:
        filingDirectoryUrl === undefined
          ? undefined
          : createUrl(filingDirectoryUrl, `${accessionNumber}-index.html`),
    };
  });
};

const filterFilings = (filings: SECFiling[], input: ListFilingsInput): SECFiling[] => {
  const formSet = new Set(normalizeList(input.forms).map((form) => form.toUpperCase()));
  const startDate = input.startDate ? formatSECDate(input.startDate) : undefined;
  const endDate = input.endDate ? formatSECDate(input.endDate) : undefined;
  const filtered = filings.filter((filing) => {
    if (formSet.size > 0 && (!filing.form || !formSet.has(filing.form.toUpperCase()))) {
      return false;
    }

    if (startDate && (!filing.filingDate || filing.filingDate < startDate)) {
      return false;
    }

    if (endDate && (!filing.filingDate || filing.filingDate > endDate)) {
      return false;
    }

    return true;
  });

  return input.limit === undefined ? filtered : filtered.slice(0, input.limit);
};

const toBoolean = (value: boolean | number | undefined): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return value === true || value === 1;
};

const buildUrlEffect = (build: () => string): Effect.Effect<string, SECInputError> => {
  return Effect.try({
    try: build,
    catch: (cause) => cause as SECInputError,
  });
};
