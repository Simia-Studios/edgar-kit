import type { DateInput, SECQuarter } from "./common";

export type SECIndexDirectory = "daily" | "full";

export type SECIndexType = "company" | "form" | "master" | "xbrl" | "crawler";

export type SECIndexFormat = "idx" | "json" | "xml" | "gz" | "zip" | "Z" | "z";

export interface GetIndexDirectoryInput {
  directory: SECIndexDirectory;
  year: number;
  quarter?: SECQuarter;
}

export interface GetIndexFileInput extends GetIndexDirectoryInput {
  type: SECIndexType;
  format?: SECIndexFormat;
  date?: DateInput;
}

export interface SECIndexRecord {
  cik: number;
  companyName: string;
  formType: string;
  dateFiled: string;
  fileName: string;
}
