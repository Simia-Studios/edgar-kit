import type { AccessionNumber, CIK } from "./common";

export interface FilingUrlInput {
  cik: CIK;
  accessionNumber: AccessionNumber;
}

export interface FilingDocumentUrlInput extends FilingUrlInput {
  fileName: string;
}

export interface GetFilingDirectoryInput extends FilingUrlInput {}

export interface GetFilingDocumentInput extends FilingDocumentUrlInput {}
