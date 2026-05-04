import { SECInputError } from "../errors";
import type { CIK, DateInput } from "../types/common";

const cikPrefixPattern = /^CIK/i;
const nonDigitPattern = /\D/g;

export const normalizeCik = (cik: CIK): string => {
  const value = String(cik).trim().replace(cikPrefixPattern, "").replace(nonDigitPattern, "");

  if (!value || value.length > 10) {
    throw new SECInputError({
      message: "CIK must contain between 1 and 10 digits.",
      input: cik,
    });
  }

  return String(Number(value));
};

export const formatCik = (cik: CIK): string => {
  return normalizeCik(cik).padStart(10, "0");
};

export const formatArchiveCik = (cik: CIK): string => {
  return normalizeCik(cik);
};

export const formatAccessionDirectory = (accessionNumber: string): string => {
  const accession = accessionNumber.trim();

  if (!accession) {
    throw new SECInputError({
      message: "Accession number is required.",
      input: accessionNumber,
    });
  }

  return accession.replaceAll("-", "");
};

export const formatSECDate = (date: DateInput): string => {
  if (date instanceof Date) {
    if (Number.isNaN(date.valueOf())) {
      throw new SECInputError({
        message: "Date input is invalid.",
        input: date,
      });
    }

    return date.toISOString().slice(0, 10);
  }

  const value = date.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new SECInputError({
      message: "SEC date inputs must be Date objects or YYYY-MM-DD strings.",
      input: date,
    });
  }

  return value;
};

export const formatCompactSECDate = (date: DateInput): string => {
  return formatSECDate(date).replaceAll("-", "");
};

export const normalizeList = <T>(value: T | readonly T[] | undefined): T[] => {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? [...(value as readonly T[])] : [value as T];
};

export const joinCommaList = (
  value: string | number | readonly (string | number)[] | undefined,
): string | undefined => {
  const list = normalizeList(value)
    .map((item) => String(item).trim())
    .filter(Boolean);

  return list.length > 0 ? list.join(",") : undefined;
};

export const createUrl = (
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string => {
  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};
