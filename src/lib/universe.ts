import type { IndexUniverse } from "./types";

export interface UniverseStock {
  symbol: string;
  name: string;
  yahooSymbol: string;
}

const NIFTY50: UniverseStock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", yahooSymbol: "RELIANCE.NS" },
  { symbol: "TCS", name: "Tata Consultancy Services", yahooSymbol: "TCS.NS" },
  { symbol: "HDFCBANK", name: "HDFC Bank", yahooSymbol: "HDFCBANK.NS" },
  { symbol: "INFY", name: "Infosys", yahooSymbol: "INFY.NS" },
  { symbol: "ICICIBANK", name: "ICICI Bank", yahooSymbol: "ICICIBANK.NS" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", yahooSymbol: "HINDUNILVR.NS" },
  { symbol: "ITC", name: "ITC", yahooSymbol: "ITC.NS" },
  { symbol: "SBIN", name: "State Bank of India", yahooSymbol: "SBIN.NS" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", yahooSymbol: "BHARTIARTL.NS" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", yahooSymbol: "KOTAKBANK.NS" },
  { symbol: "LT", name: "Larsen & Toubro", yahooSymbol: "LT.NS" },
  { symbol: "AXISBANK", name: "Axis Bank", yahooSymbol: "AXISBANK.NS" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", yahooSymbol: "BAJFINANCE.NS" },
  { symbol: "ASIANPAINT", name: "Asian Paints", yahooSymbol: "ASIANPAINT.NS" },
  { symbol: "MARUTI", name: "Maruti Suzuki", yahooSymbol: "MARUTI.NS" },
  { symbol: "HCLTECH", name: "HCL Technologies", yahooSymbol: "HCLTECH.NS" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", yahooSymbol: "SUNPHARMA.NS" },
  { symbol: "TITAN", name: "Titan Company", yahooSymbol: "TITAN.NS" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", yahooSymbol: "ULTRACEMCO.NS" },
  { symbol: "WIPRO", name: "Wipro", yahooSymbol: "WIPRO.NS" },
  { symbol: "NTPC", name: "NTPC", yahooSymbol: "NTPC.NS" },
  { symbol: "POWERGRID", name: "Power Grid Corp", yahooSymbol: "POWERGRID.NS" },
  { symbol: "ONGC", name: "Oil & Natural Gas Corp", yahooSymbol: "ONGC.NS" },
  { symbol: "TATAMOTORS", name: "Tata Motors", yahooSymbol: "TATAMOTORS.NS" },
  { symbol: "ADANIENT", name: "Adani Enterprises", yahooSymbol: "ADANIENT.NS" },
  { symbol: "ADANIPORTS", name: "Adani Ports", yahooSymbol: "ADANIPORTS.NS" },
  { symbol: "COALINDIA", name: "Coal India", yahooSymbol: "COALINDIA.NS" },
  { symbol: "TATASTEEL", name: "Tata Steel", yahooSymbol: "TATASTEEL.NS" },
  { symbol: "JSWSTEEL", name: "JSW Steel", yahooSymbol: "JSWSTEEL.NS" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv", yahooSymbol: "BAJAJFINSV.NS" },
  { symbol: "NESTLEIND", name: "Nestle India", yahooSymbol: "NESTLEIND.NS" },
  { symbol: "GRASIM", name: "Grasim Industries", yahooSymbol: "GRASIM.NS" },
  { symbol: "TECHM", name: "Tech Mahindra", yahooSymbol: "TECHM.NS" },
  { symbol: "HINDALCO", name: "Hindalco Industries", yahooSymbol: "HINDALCO.NS" },
  { symbol: "CIPLA", name: "Cipla", yahooSymbol: "CIPLA.NS" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Labs", yahooSymbol: "DRREDDY.NS" },
  { symbol: "EICHERMOT", name: "Eicher Motors", yahooSymbol: "EICHERMOT.NS" },
  { symbol: "BPCL", name: "Bharat Petroleum", yahooSymbol: "BPCL.NS" },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", yahooSymbol: "DIVISLAB.NS" },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals", yahooSymbol: "APOLLOHOSP.NS" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp", yahooSymbol: "HEROMOTOCO.NS" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", yahooSymbol: "INDUSINDBK.NS" },
  { symbol: "SBILIFE", name: "SBI Life Insurance", yahooSymbol: "SBILIFE.NS" },
  { symbol: "BRITANNIA", name: "Britannia Industries", yahooSymbol: "BRITANNIA.NS" },
  { symbol: "M&M", name: "Mahindra & Mahindra", yahooSymbol: "M&M.NS" },
  { symbol: "TATACONSUM", name: "Tata Consumer Products", yahooSymbol: "TATACONSUM.NS" },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance", yahooSymbol: "HDFCLIFE.NS" },
  { symbol: "UPL", name: "UPL", yahooSymbol: "UPL.NS" },
  { symbol: "LTIM", name: "LTIMindtree", yahooSymbol: "LTIM.NS" },
];

const NIFTY100_EXTRA: UniverseStock[] = [
  { symbol: "VEDL", name: "Vedanta", yahooSymbol: "VEDL.NS" },
  { symbol: "GODREJCP", name: "Godrej Consumer", yahooSymbol: "GODREJCP.NS" },
  { symbol: "DABUR", name: "Dabur India", yahooSymbol: "DABUR.NS" },
  { symbol: "PIDILITIND", name: "Pidilite Industries", yahooSymbol: "PIDILITIND.NS" },
  { symbol: "SIEMENS", name: "Siemens", yahooSymbol: "SIEMENS.NS" },
  { symbol: "HAVELLS", name: "Havells India", yahooSymbol: "HAVELLS.NS" },
  { symbol: "BANKBARODA", name: "Bank of Baroda", yahooSymbol: "BANKBARODA.NS" },
  { symbol: "PNB", name: "Punjab National Bank", yahooSymbol: "PNB.NS" },
  { symbol: "CANBK", name: "Canara Bank", yahooSymbol: "CANBK.NS" },
  { symbol: "INDIGO", name: "InterGlobe Aviation", yahooSymbol: "INDIGO.NS" },
  { symbol: "DLF", name: "DLF", yahooSymbol: "DLF.NS" },
  { symbol: "ABB", name: "ABB India", yahooSymbol: "ABB.NS" },
  { symbol: "SHREECEM", name: "Shree Cement", yahooSymbol: "SHREECEM.NS" },
  { symbol: "AMBUJACEM", name: "Ambuja Cements", yahooSymbol: "AMBUJACEM.NS" },
  { symbol: "ICICIPRULI", name: "ICICI Prudential Life", yahooSymbol: "ICICIPRULI.NS" },
  { symbol: "ZOMATO", name: "Zomato", yahooSymbol: "ZOMATO.NS" },
  { symbol: "JIOFIN", name: "Jio Financial Services", yahooSymbol: "JIOFIN.NS" },
  { symbol: "BEL", name: "Bharat Electronics", yahooSymbol: "BEL.NS" },
  { symbol: "HAL", name: "Hindustan Aeronautics", yahooSymbol: "HAL.NS" },
  { symbol: "IRCTC", name: "IRCTC", yahooSymbol: "IRCTC.NS" },
];

const BANKNIFTY: UniverseStock[] = [
  { symbol: "HDFCBANK", name: "HDFC Bank", yahooSymbol: "HDFCBANK.NS" },
  { symbol: "ICICIBANK", name: "ICICI Bank", yahooSymbol: "ICICIBANK.NS" },
  { symbol: "SBIN", name: "State Bank of India", yahooSymbol: "SBIN.NS" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", yahooSymbol: "KOTAKBANK.NS" },
  { symbol: "AXISBANK", name: "Axis Bank", yahooSymbol: "AXISBANK.NS" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", yahooSymbol: "INDUSINDBK.NS" },
  { symbol: "BANKBARODA", name: "Bank of Baroda", yahooSymbol: "BANKBARODA.NS" },
  { symbol: "PNB", name: "Punjab National Bank", yahooSymbol: "PNB.NS" },
  { symbol: "CANBK", name: "Canara Bank", yahooSymbol: "CANBK.NS" },
  { symbol: "FEDERALBNK", name: "Federal Bank", yahooSymbol: "FEDERALBNK.NS" },
  { symbol: "IDFCFIRSTB", name: "IDFC First Bank", yahooSymbol: "IDFCFIRSTB.NS" },
  { symbol: "AUBANK", name: "AU Small Finance Bank", yahooSymbol: "AUBANK.NS" },
  { symbol: "BANDHANBNK", name: "Bandhan Bank", yahooSymbol: "BANDHANBNK.NS" },
];

export function getUniverse(index: IndexUniverse): UniverseStock[] {
  switch (index) {
    case "NIFTY50":
      return NIFTY50;
    case "NIFTY100":
      return [...NIFTY50, ...NIFTY100_EXTRA];
    case "BANKNIFTY":
      return BANKNIFTY;
  }
}
