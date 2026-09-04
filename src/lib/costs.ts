export interface TradeCostBreakdown {
  brokerage: number;
  stt: number;
  exchange: number;
  sebi: number;
  gst: number;
  stampDuty: number;
  total: number;
}

export function calculateTradeCosts(
  buyValue: number,
  sellValue: number,
  isIntraday = true
): TradeCostBreakdown {
  const brokerage = 40; // ₹20 per order × 2 legs (typical flat-fee broker)
  const stt = sellValue * (isIntraday ? 0.00025 : 0.001); // 0.025% intraday sell, 0.1% delivery sell
  const exchange = (buyValue + sellValue) * 0.0000345;
  const sebi = (buyValue + sellValue) * 0.000001;
  const gst = (brokerage + exchange + sebi) * 0.18;
  const stampDuty = buyValue * 0.00003;
  const total = brokerage + stt + exchange + sebi + gst + stampDuty;

  return {
    brokerage: round(total > 0 ? brokerage : 0),
    stt: round(stt),
    exchange: round(exchange),
    sebi: round(sebi),
    gst: round(gst),
    stampDuty: round(stampDuty),
    total: round(total),
  };
}

export function calculateMarginRequired(price: number, quantity: number, leverage = 5): number {
  return round((price * quantity) / leverage);
}

export function calculatePositionSize(
  capital: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number
): { quantity: number; riskAmount: number; positionValue: number } {
  const riskAmount = capital * (riskPercent / 100);
  const riskPerShare = Math.abs(entryPrice - stopLoss);
  if (riskPerShare <= 0) return { quantity: 0, riskAmount, positionValue: 0 };
  const quantity = Math.floor(riskAmount / riskPerShare);
  return {
    quantity,
    riskAmount: round(riskAmount),
    positionValue: round(quantity * entryPrice),
  };
}

export function calculateTaxOnProfit(profit: number, isIntraday: boolean, isDeliveryLongTerm = false): number {
  if (profit <= 0) return 0;
  if (isIntraday) return round(profit * 0.3); // assume 30% slab
  if (isDeliveryLongTerm) {
    const taxable = Math.max(0, profit - 125_000);
    return round(taxable * 0.125);
  }
  return round(profit * 0.2); // STCG delivery
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
