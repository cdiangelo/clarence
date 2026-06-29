// Standard normal CDF via Abramowitz and Stegun approximation
function normCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1 + sign * y);
}

function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function d1(S: number, K: number, T: number, r: number, sigma: number): number {
  return (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
}

function d2(S: number, K: number, T: number, r: number, sigma: number): number {
  return d1(S, K, T, r, sigma) - sigma * Math.sqrt(T);
}

export interface BSGreeks {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export function blackScholes(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put',
): BSGreeks {
  if (T <= 0) {
    const intrinsic = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
    return { price: intrinsic, delta: type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0), gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const D1 = d1(S, K, T, r, sigma);
  const D2 = d2(S, K, T, r, sigma);
  const sqrtT = Math.sqrt(T);
  const discount = Math.exp(-r * T);
  const nd1 = normPDF(D1);

  let price: number, delta: number, rho: number;
  if (type === 'call') {
    price = S * normCDF(D1) - K * discount * normCDF(D2);
    delta = normCDF(D1);
    rho = K * T * discount * normCDF(D2) / 100;
  } else {
    price = K * discount * normCDF(-D2) - S * normCDF(-D1);
    delta = normCDF(D1) - 1;
    rho = -K * T * discount * normCDF(-D2) / 100;
  }

  const gamma = nd1 / (S * sigma * sqrtT);
  const vega = S * sqrtT * nd1 / 100;
  const theta = (-(S * nd1 * sigma) / (2 * sqrtT) - r * K * discount * (type === 'call' ? normCDF(D2) : normCDF(-D2))) / 365;

  return { price, delta, gamma, theta, vega, rho };
}

export function impliedVolatility(
  marketPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  type: 'call' | 'put',
): number | null {
  if (T <= 0 || marketPrice <= 0) return null;

  let sigma = 0.3;
  for (let i = 0; i < 200; i++) {
    const { price, vega } = blackScholes(S, K, T, r, sigma, type);
    const diff = price - marketPrice;
    if (Math.abs(diff) < 1e-6) return sigma;
    const vegaAdj = vega * 100; // vega was divided by 100 above
    if (Math.abs(vegaAdj) < 1e-10) break;
    sigma -= diff / vegaAdj;
    if (sigma <= 0.001) sigma = 0.001;
    if (sigma > 5) sigma = 5;
  }
  return sigma;
}

export interface ArbitrageOpportunity {
  type: string;
  description: string;
  edge: number;
  strike?: number;
  expiry?: string;
  confidence: 'high' | 'medium' | 'low';
}

export function checkPutCallParity(
  callPrice: number,
  putPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
): { violation: boolean; magnitude: number; direction: 'calls_rich' | 'puts_rich' | 'fair' } {
  // C - P = S - K * e^(-rT) (no dividends)
  const lhs = callPrice - putPrice;
  const rhs = S - K * Math.exp(-r * T);
  const magnitude = Math.abs(lhs - rhs);
  const threshold = S * 0.003; // 0.3% of spot as threshold

  if (magnitude < threshold) return { violation: false, magnitude, direction: 'fair' };
  return {
    violation: true,
    magnitude,
    direction: lhs > rhs ? 'calls_rich' : 'puts_rich',
  };
}

export interface ChainContract {
  strike: number;
  expiry: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  last: number;
  impliedVol: number;
}

export function findArbitrageOpportunities(
  contracts: ChainContract[],
  spot: number,
  r = 0.05,
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];
  const today = Date.now();

  // Group by expiry and strike
  const byExpiryStrike = new Map<string, { call?: ChainContract; put?: ChainContract }>();
  for (const c of contracts) {
    const key = `${c.expiry}|${c.strike}`;
    const group = byExpiryStrike.get(key) ?? {};
    if (c.type === 'call') group.call = c;
    else group.put = c;
    byExpiryStrike.set(key, group);
  }

  for (const [key, { call, put }] of byExpiryStrike) {
    if (!call || !put) continue;
    const [expStr, strikeStr] = key.split('|');
    const K = parseFloat(strikeStr);
    const T = Math.max(0.001, (new Date(expStr).getTime() - today) / (365.25 * 24 * 3600 * 1000));

    // Use mid prices
    const callMid = (call.bid + call.ask) / 2;
    const putMid = (put.bid + put.ask) / 2;

    const { violation, magnitude, direction } = checkPutCallParity(callMid, putMid, spot, K, T, r);
    if (violation && magnitude > 0.05) {
      const edgePct = magnitude / spot * 100;
      opportunities.push({
        type: 'put_call_parity',
        description: `K=${K} exp=${expStr}: ${direction.replace('_', ' ')} by $${magnitude.toFixed(2)} (${edgePct.toFixed(2)}% of spot)`,
        edge: magnitude,
        strike: K,
        expiry: expStr,
        confidence: edgePct > 0.5 ? 'high' : edgePct > 0.2 ? 'medium' : 'low',
      });
    }
  }

  // Check for IV skew extremes across strikes at same expiry
  const byExpiry = new Map<string, ChainContract[]>();
  for (const c of contracts) {
    const list = byExpiry.get(c.expiry) ?? [];
    list.push(c);
    byExpiry.set(c.expiry, list);
  }

  for (const [expiry, chain] of byExpiry) {
    const puts = chain.filter((c) => c.type === 'put' && c.impliedVol > 0).sort((a, b) => a.strike - b.strike);
    const atm = puts.find((p) => Math.abs(p.strike / spot - 1) < 0.05);
    if (!atm || puts.length < 3) continue;

    const otmPuts = puts.filter((p) => p.strike < spot * 0.9);
    const avgOtmIV = otmPuts.reduce((sum, p) => sum + p.impliedVol, 0) / (otmPuts.length || 1);
    const skew = avgOtmIV - atm.impliedVol;

    if (skew > 0.15) {
      opportunities.push({
        type: 'skew_extreme',
        description: `${expiry}: Put skew elevated — OTM put IV avg ${(avgOtmIV * 100).toFixed(0)}% vs ATM ${(atm.impliedVol * 100).toFixed(0)}% (skew: ${(skew * 100).toFixed(0)}pp). Tail protection expensive.`,
        edge: skew,
        expiry,
        confidence: skew > 0.25 ? 'high' : 'medium',
      });
    } else if (skew < 0.02 && skew > -0.05) {
      opportunities.push({
        type: 'skew_extreme',
        description: `${expiry}: Put skew historically low — ATM IV ${(atm.impliedVol * 100).toFixed(0)}%, OTM puts only ${(skew * 100).toFixed(0)}pp premium. Downside protection cheap.`,
        edge: Math.abs(skew),
        expiry,
        confidence: 'medium',
      });
    }
  }

  return opportunities.sort((a, b) => b.edge - a.edge).slice(0, 10);
}

export function calculateIVRank(currentIV: number, ivHistory: number[]): number | null {
  if (ivHistory.length < 10) return null;
  const min = Math.min(...ivHistory);
  const max = Math.max(...ivHistory);
  if (max === min) return 50;
  return ((currentIV - min) / (max - min)) * 100;
}

export function dcfValuation(params: {
  revenue: number;
  revenueGrowthRates: number[];
  ebitdaMargin: number;
  taxRate: number;
  wacc: number;
  terminalGrowthRate: number;
  sharesOutstanding: number;
  netDebt: number;
}): { bearFairValue: number; baseFairValue: number; bullFairValue: number; impliedCagrNeeded: number } {
  const { revenue, revenueGrowthRates, ebitdaMargin, taxRate, wacc, terminalGrowthRate, sharesOutstanding, netDebt } = params;

  function calcNPV(growthAdj: number, marginAdj: number): number {
    let rev = revenue;
    let npv = 0;
    for (let i = 0; i < revenueGrowthRates.length; i++) {
      rev *= 1 + (revenueGrowthRates[i] + growthAdj);
      const fcf = rev * (ebitdaMargin + marginAdj) * (1 - taxRate);
      npv += fcf / Math.pow(1 + wacc, i + 1);
    }
    const terminalFCF = rev * (ebitdaMargin + marginAdj) * (1 - taxRate) * (1 + terminalGrowthRate);
    const terminalValue = terminalFCF / (wacc - terminalGrowthRate);
    npv += terminalValue / Math.pow(1 + wacc, revenueGrowthRates.length);
    const equity = npv - netDebt;
    return equity / sharesOutstanding;
  }

  const baseFairValue = calcNPV(0, 0);
  const bearFairValue = calcNPV(-0.03, -0.02);
  const bullFairValue = calcNPV(0.03, 0.02);

  // impliedCagrNeeded: what growth rate justifies current market price? We can't know it here without market price,
  // so return 0 and let caller interpret.
  return { bearFairValue, baseFairValue, bullFairValue, impliedCagrNeeded: 0 };
}
