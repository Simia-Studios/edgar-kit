export interface SECCompanyTicker {
  cik_str: number;
  ticker: string;
  title: string;
}

export type SECCompanyTickersResponse = Record<string, SECCompanyTicker>;

export interface SECCompanyTickerExchange {
  cik: number;
  name: string;
  ticker: string;
  exchange: string;
}

export interface SECCompanyTickersExchangeResponse {
  fields: ["cik", "name", "ticker", "exchange"];
  data: Array<[number, string, string, string]>;
}

export interface SECMutualFundTicker {
  cik: number;
  seriesId: string;
  classId: string;
  symbol: string;
}

export interface SECMutualFundTickersResponse {
  fields: ["cik", "seriesId", "classId", "symbol"];
  data: Array<[number, string, string, string]>;
}
