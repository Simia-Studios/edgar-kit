import type { Effect } from "effect";
import type { SECClientError } from "../errors";
import type { SECHttpClient } from "../http";
import type { SECBaseUrls } from "../endpoints";
import type { SECDirectoryResponse } from "../types/common";
import type {
  FilingDocumentUrlInput,
  FilingUrlInput,
  GetFilingDirectoryInput,
  GetFilingDocumentInput,
} from "../types/archives";
import { createUrl, formatAccessionDirectory, formatArchiveCik } from "../utils/format";

export class ArchivesClient {
  constructor(
    private readonly http: SECHttpClient,
    private readonly baseUrls: SECBaseUrls,
  ) {}

  filingDirectory(input: GetFilingDirectoryInput): Effect.Effect<SECDirectoryResponse, SECClientError> {
    return this.http.requestJson<SECDirectoryResponse>(this.filingDirectoryUrl(input));
  }

  filingDocument(input: GetFilingDocumentInput): Effect.Effect<string, SECClientError> {
    return this.http.requestText(this.filingDocumentUrl(input));
  }

  filingDocumentBuffer(input: GetFilingDocumentInput): Effect.Effect<ArrayBuffer, SECClientError> {
    return this.http.requestArrayBuffer(this.filingDocumentUrl(input));
  }

  completeSubmission(input: FilingUrlInput): Effect.Effect<string, SECClientError> {
    return this.filingDocument({
      ...input,
      fileName: `${input.accessionNumber}.txt`,
    });
  }

  filingHeader(input: FilingUrlInput): Effect.Effect<string, SECClientError> {
    return this.filingDocument({
      ...input,
      fileName: `${input.accessionNumber}.hdr.sgml`,
    });
  }

  filingDirectoryUrl(input: FilingUrlInput): string {
    return createUrl(this.baseUrls.sec, `${this.filingDirectoryPath(input)}/index.json`);
  }

  filingIndexUrl(input: FilingUrlInput): string {
    return createUrl(this.baseUrls.sec, `${this.filingDirectoryPath(input)}/${input.accessionNumber}-index.html`);
  }

  filingHeadersUrl(input: FilingUrlInput): string {
    return createUrl(this.baseUrls.sec, `${this.filingDirectoryPath(input)}/${input.accessionNumber}-index-headers.html`);
  }

  filingDocumentUrl(input: FilingDocumentUrlInput): string {
    return createUrl(this.baseUrls.sec, `${this.filingDirectoryPath(input)}/${input.fileName}`);
  }

  xbrlZipUrl(input: FilingUrlInput): string {
    return createUrl(this.baseUrls.sec, `${this.filingDirectoryPath(input)}/${input.accessionNumber}-xbrl.zip`);
  }

  private filingDirectoryPath(input: FilingUrlInput): string {
    return `/Archives/edgar/data/${formatArchiveCik(input.cik)}/${formatAccessionDirectory(input.accessionNumber)}`;
  }
}
