import { Data } from "effect";

export class SECInputError extends Data.TaggedError("SECInputError")<{
  readonly message: string;
  readonly input?: unknown;
}> {}

export class SECRequestError extends Data.TaggedError("SECRequestError")<{
  readonly message: string;
  readonly url: string;
  readonly method: string;
  readonly status?: number;
  readonly statusText?: string;
  readonly responseBody?: string;
  readonly cause?: unknown;
}> {}

export class SECProviderError extends Data.TaggedError("SECProviderError")<{
  readonly message: string;
  readonly provider: string;
  readonly cause?: unknown;
}> {}

export type SECClientError = SECInputError | SECRequestError | SECProviderError;

export const isSECClientError = (error: unknown): error is SECClientError => {
  return error instanceof SECInputError || error instanceof SECRequestError || error instanceof SECProviderError;
};
