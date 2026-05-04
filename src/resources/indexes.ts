import { Effect } from "effect";
import { SECInputError } from "../errors";
import type { SECClientError } from "../errors";
import type { SECBaseUrls } from "../endpoints";
import type { SECHttpClient } from "../http";
import type { SECDirectoryResponse } from "../types/common";
import type { GetIndexDirectoryInput, GetIndexFileInput, SECIndexRecord } from "../types/indexes";
import { createUrl, formatCompactSECDate } from "../utils/format";

export class IndexesClient {
  constructor(
    private readonly http: SECHttpClient,
    private readonly baseUrls: SECBaseUrls,
  ) {}

  directory(input: GetIndexDirectoryInput): Effect.Effect<SECDirectoryResponse, SECClientError> {
    return Effect.flatMap(Effect.try({ try: () => this.directoryUrl(input), catch: toInputError }), (url) =>
      this.http.requestJson<SECDirectoryResponse>(url),
    );
  }

  indexText(input: GetIndexFileInput): Effect.Effect<string, SECClientError> {
    return Effect.flatMap(Effect.try({ try: () => this.indexFileUrl(input), catch: toInputError }), (url) =>
      this.http.requestText(url),
    );
  }

  masterIndex(input: Omit<GetIndexFileInput, "type" | "format">): Effect.Effect<SECIndexRecord[], SECClientError> {
    return Effect.map(this.indexText({ ...input, type: "master", format: "idx" }), parseMasterIndex);
  }

  directoryUrl(input: GetIndexDirectoryInput): string {
    return createUrl(this.baseUrls.sec, `${this.indexDirectoryPath(input)}/index.json`);
  }

  indexFileUrl(input: GetIndexFileInput): string {
    const format = input.format ?? "idx";
    const dateSuffix = input.date ? `.${formatCompactSECDate(input.date)}` : "";

    return createUrl(this.baseUrls.sec, `${this.indexDirectoryPath(input)}/${input.type}${dateSuffix}.${format}`);
  }

  private indexDirectoryPath(input: GetIndexDirectoryInput): string {
    const directory = input.directory === "daily" ? "daily-index" : "full-index";
    const quarter = input.quarter ? `/QTR${input.quarter}` : "";

    return `/Archives/edgar/${directory}/${input.year}${quarter}`;
  }
}

export const parseMasterIndex = (text: string): SECIndexRecord[] => {
  const separatorIndex = text.indexOf(
    "--------------------------------------------------------------------------------",
  );

  if (separatorIndex === -1) {
    return [];
  }

  return text
    .slice(separatorIndex)
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [cik, companyName, formType, dateFiled, fileName] = line.split("|");

      return {
        cik: Number(cik),
        companyName: companyName ?? "",
        formType: formType ?? "",
        dateFiled: dateFiled ?? "",
        fileName: fileName ?? "",
      };
    });
};

const toInputError = (cause: unknown): SECInputError => {
  if (cause instanceof SECInputError) {
    return cause;
  }

  return new SECInputError({
    message: "Unable to build SEC index request URL.",
    input: cause,
  });
};
