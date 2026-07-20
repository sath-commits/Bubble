export type HistoryPoint = {
  date: string;
  value: number;
};

export type MetricDefinition = {
  id: string;
  slug: string;
  name: string;
  category: string;
  unit: string;
  descriptionShort: string;
  descriptionLong: string;
  whyItMatters: string;
  caveats: string;
  sourceName: string;
  sourceUrl: string;
  updateFrequency: string;
  orientationHigherIsFrothier: boolean;
  includedInComposite: boolean;
  history: HistoryPoint[];
};

export type MetricSnapshot = {
  metric: MetricDefinition;
  currentValue: number;
  percentile: number;
  subscore: number;
  distanceToPeak: number;
  currentRead: string;
  latestDate: string;
};

export type CompositeSnapshot = {
  score: number;
  zone: string;
  color: string;
  summary: string;
  topDrivers: MetricSnapshot[];
  categoryScores: Record<string, number>;
};

export const disclaimerCopy = {
  investment: `This site is for educational and informational purposes only. It is not investment advice, financial advice, tax advice, or a recommendation to buy, sell, or hold any security, asset, or strategy. The metrics, the composite bubble score, and any alerts are not forecasts and are not a signal to act. Markets can stay overvalued or undervalued for long periods, and past patterns do not guarantee future results. The data is aggregated from third-party sources, is provided "as is," and may contain errors, gaps, or delays. Do your own research and consult a licensed financial professional before making any financial decision.`,
  personal: `This is a personal side project. It is not sponsored, endorsed, reviewed, or approved by my employer or any other organization, and nothing here represents the views, positions, or data of my employer. I built it simply to keep these market indicators in one place and look at the actual numbers, instead of worrying about the market without any data in front of me.`,
};

const baseMetrics: MetricDefinition[] = [
  {
    id: "cape",
    slug: "shiller-cape",
    name: "Shiller CAPE",
    category: "Valuation",
    unit: "x",
    descriptionShort: "A long-run earnings multiple that smooths business-cycle noise.",
    descriptionLong:
      "Shiller CAPE compares current prices with average inflation-adjusted earnings over the prior 10 years. It is a classic valuation signal because it smooths business-cycle swings and avoids overstating the effect of a single strong or weak year.",
    whyItMatters:
      "CAPE is one of the most widely watched long-horizon valuation metrics. Elevated readings tend to coincide with lower subsequent returns over the next decade, although they do not predict a precise market top.",
    caveats:
      "The series is a valuation proxy, not a timing tool. Markets can stay expensive for years, especially when growth expectations are strong.",
    sourceName: "Robert Shiller / Yale",
    sourceUrl: "https://shillerdata.com/",
    updateFrequency: "Monthly",
    orientationHigherIsFrothier: true,
    includedInComposite: true,
    history: [
      { date: "1998-01-01", value: 19.7 },
      { date: "1999-12-01", value: 44.19 },
      { date: "2000-01-01", value: 34.1 },
      { date: "2002-01-01", value: 24.4 },
      { date: "2004-01-01", value: 17.1 },
      { date: "2006-01-01", value: 19.4 },
      { date: "2008-01-01", value: 20.4 },
      { date: "2009-03-01", value: 13.32 },
      { date: "2010-01-01", value: 16.3 },
      { date: "2012-01-01", value: 17.6 },
      { date: "2014-01-01", value: 24.7 },
      { date: "2016-01-01", value: 24.3 },
      { date: "2018-01-01", value: 29.8 },
      { date: "2020-01-01", value: 28.9 },
      { date: "2022-01-01", value: 27.4 },
      { date: "2024-01-01", value: 33.5 },
      { date: "2026-01-01", value: 40.6 },
    ],
  },
  {
    id: "buffett",
    slug: "buffett-indicator",
    name: "Buffett Indicator",
    category: "Valuation",
    unit: "%",
    descriptionShort: "US market cap relative to US GDP.",
    descriptionLong:
      "The Buffett Indicator divides the total US stock market cap by US GDP. It is a broad valuation ratio that places today's equity market against the scale of the economy.",
    whyItMatters:
      "A very high ratio suggests the market is absorbing a growing share of the economy's output. It is most useful as a long-horizon valuation condition, not a precise timing call.",
    caveats:
      "GDP is quarterly and lags the market, so the ratio is smoother and slower-moving than daily price moves.",
    sourceName: "FRED / Wilshire 5000 + GDP",
    sourceUrl: "https://fred.stlouisfed.org/",
    updateFrequency: "Daily / quarterly",
    orientationHigherIsFrothier: true,
    includedInComposite: true,
    history: [
      { date: "1998-01-01", value: 121.7 },
      { date: "2000-01-01", value: 162.6 },
      { date: "2002-01-01", value: 111.3 },
      { date: "2004-01-01", value: 103.5 },
      { date: "2006-01-01", value: 112 },
      { date: "2008-01-01", value: 106.1 },
      { date: "2010-01-01", value: 96.3 },
      { date: "2012-01-01", value: 105.9 },
      { date: "2014-01-01", value: 136.3 },
      { date: "2016-01-01", value: 133.7 },
      { date: "2018-01-01", value: 146.3 },
      { date: "2020-01-01", value: 128.8 },
      { date: "2022-01-01", value: 202.9 },
      { date: "2024-01-01", value: 197.3 },
      { date: "2026-01-01", value: 218.1 },
    ],
  },
  {
    id: "yield-curve",
    slug: "yield-curve-10y-2y",
    name: "10Y-2Y Yield Curve",
    category: "Credit & Volatility",
    unit: "%",
    descriptionShort: "The gap between 10-year and 2-year Treasury yields.",
    descriptionLong:
      "A narrowing or inverted curve often precedes slower growth and recession risk because longer-term bond yields fall faster than short-term yields when the market anticipates a slowdown.",
    whyItMatters:
      "It is a classic recession signal, and a sharply inverted curve can be a warning that the market is becoming more fragile even if a crash is not imminent.",
    caveats:
      "The curve is a macro warning, not a market-timing device. It can stay inverted for a long while before a recession unfolds.",
    sourceName: "FRED T10Y2Y",
    sourceUrl: "https://fred.stlouisfed.org/series/T10Y2Y",
    updateFrequency: "Daily",
    orientationHigherIsFrothier: false,
    includedInComposite: true,
    history: [
      { date: "1998-01-01", value: 1.18 },
      { date: "2000-01-01", value: 0.22 },
      { date: "2002-01-01", value: 0.85 },
      { date: "2004-01-01", value: 1.21 },
      { date: "2006-01-01", value: 1.11 },
      { date: "2008-01-01", value: 0.31 },
      { date: "2010-01-01", value: 1.38 },
      { date: "2012-01-01", value: 1.06 },
      { date: "2014-01-01", value: 1.97 },
      { date: "2016-01-01", value: 0.82 },
      { date: "2018-01-01", value: 0.38 },
      { date: "2020-01-01", value: 0.64 },
      { date: "2022-01-01", value: -0.18 },
      { date: "2024-01-01", value: 0.31 },
      { date: "2026-01-01", value: 0.68 },
    ],
  },
  {
    id: "yield-curve-3m",
    slug: "yield-curve-10y-3m",
    name: "10Y-3M Yield Curve",
    category: "Credit & Volatility",
    unit: "%",
    descriptionShort: "The gap between 10-year and 3-month Treasury yields.",
    descriptionLong:
      "The 10-year minus 3-month Treasury spread compares long-term rates with very short-term policy-sensitive rates. It has a strong history as a recession warning when it inverts.",
    whyItMatters:
      "A negative 10Y-3M spread says the bond market expects easier conditions ahead, often because growth is expected to weaken. That can make an expensive market more fragile.",
    caveats:
      "The signal is about macro risk, not crash timing. It can invert well before markets react, and it can normalize before the real economy weakens.",
    sourceName: "FRED T10Y3M",
    sourceUrl: "https://fred.stlouisfed.org/series/T10Y3M",
    updateFrequency: "Daily",
    orientationHigherIsFrothier: false,
    includedInComposite: true,
    history: [
      { date: "1998-01-01", value: 1.05 },
      { date: "2000-01-01", value: -0.5 },
      { date: "2002-01-01", value: 2.78 },
      { date: "2004-01-01", value: 3.01 },
      { date: "2006-01-01", value: 0.07 },
      { date: "2008-01-01", value: 1.32 },
      { date: "2010-01-01", value: 3.31 },
      { date: "2012-01-01", value: 1.79 },
      { date: "2014-01-01", value: 2.35 },
      { date: "2016-01-01", value: 1.46 },
      { date: "2018-01-01", value: 0.62 },
      { date: "2020-01-01", value: 0.77 },
      { date: "2022-01-01", value: -0.54 },
      { date: "2024-01-01", value: -1.23 },
      { date: "2026-01-01", value: 0.55 },
    ],
  },
  {
    id: "vix",
    slug: "vix",
    name: "VIX",
    category: "Credit & Volatility",
    unit: "index",
    descriptionShort: "A measure of expected near-term volatility.",
    descriptionLong:
      "The VIX reflects the market's expectation for short-dated options volatility. It jumps when risk is re-priced sharply, and it is often low when complacency is high.",
    whyItMatters:
      "Low VIX readings can mean investors are comfortable, but that same complacency can be fragile when an exogenous shock arrives. High VIX readings are a stress signal.",
    caveats:
      "Low VIX is not a safety signal. It often means the market is underpricing the possibility of a sudden move.",
    sourceName: "FRED VIXCLS",
    sourceUrl: "https://fred.stlouisfed.org/series/VIXCLS",
    updateFrequency: "Daily",
    orientationHigherIsFrothier: false,
    includedInComposite: true,
    history: [
      { date: "1998-01-01", value: 19 },
      { date: "2000-01-01", value: 25 },
      { date: "2002-01-01", value: 29 },
      { date: "2004-01-01", value: 15 },
      { date: "2006-01-01", value: 12 },
      { date: "2008-01-01", value: 34 },
      { date: "2008-11-01", value: 80.86 },
      { date: "2010-01-01", value: 17 },
      { date: "2012-01-01", value: 14 },
      { date: "2014-01-01", value: 13 },
      { date: "2016-01-01", value: 14 },
      { date: "2018-01-01", value: 17 },
      { date: "2020-01-01", value: 24 },
      { date: "2020-03-01", value: 82.69 },
      { date: "2022-01-01", value: 29 },
      { date: "2024-01-01", value: 14 },
      { date: "2026-01-01", value: 17.4 },
    ],
  },
  {
    id: "credit-spread",
    slug: "high-yield-credit-spread",
    name: "High-Yield Credit Spread",
    category: "Credit & Volatility",
    unit: "%",
    descriptionShort: "The extra yield investors demand to hold junk bonds.",
    descriptionLong:
      "The high-yield spread measures how much more yield investors demand for lower-quality corporate debt. Tight spreads often accompany complacency and excess risk appetite.",
    whyItMatters:
      "When spreads compress too far, the market can become more vulnerable to a sudden repricing. Wide spreads usually signal stress and reduced risk appetite.",
    caveats:
      "This is a credit market signal, not a direct stock-market forecast. It can stay tight for a long time in a strong economy.",
    sourceName: "FRED BAMLH0A0HYM2",
    sourceUrl: "https://fred.stlouisfed.org/series/BAMLH0A0HYM2",
    updateFrequency: "Daily",
    orientationHigherIsFrothier: false,
    includedInComposite: true,
    history: [
      { date: "1998-01-01", value: 5.8 },
      { date: "2000-01-01", value: 8.2 },
      { date: "2002-01-01", value: 9.9 },
      { date: "2004-01-01", value: 4.8 },
      { date: "2006-01-01", value: 3.9 },
      { date: "2008-01-01", value: 16.4 },
      { date: "2008-12-01", value: 21.82 },
      { date: "2010-01-01", value: 6.8 },
      { date: "2012-01-01", value: 4.7 },
      { date: "2014-01-01", value: 3.4 },
      { date: "2016-01-01", value: 4.2 },
      { date: "2018-01-01", value: 4.5 },
      { date: "2020-01-01", value: 6.1 },
      { date: "2020-03-01", value: 10.87 },
      { date: "2022-01-01", value: 6.8 },
      { date: "2024-01-01", value: 3.6 },
      { date: "2026-01-01", value: 2.74 },
    ],
  },
  {
    id: "investment-grade-oas",
    slug: "investment-grade-oas",
    name: "Investment-Grade OAS",
    category: "Credit & Volatility",
    unit: "%",
    descriptionShort: "The extra yield investors demand for high-quality corporate bonds.",
    descriptionLong:
      "Investment-grade option-adjusted spread measures the compensation investors require for owning higher-quality corporate credit instead of Treasuries.",
    whyItMatters:
      "Very tight spreads can show broad credit-market comfort. It is a calmer companion to high-yield spreads and helps separate general credit complacency from junk-bond stress.",
    caveats:
      "Investment-grade spreads can stay tight for long periods in healthy expansions. This is a backdrop signal, not a standalone market forecast.",
    sourceName: "FRED BAMLC0A0CM",
    sourceUrl: "https://fred.stlouisfed.org/series/BAMLC0A0CM",
    updateFrequency: "Daily",
    orientationHigherIsFrothier: false,
    includedInComposite: true,
    history: [
      { date: "1998-01-01", value: 1.05 },
      { date: "2000-01-01", value: 1.42 },
      { date: "2002-01-01", value: 2.19 },
      { date: "2004-01-01", value: 0.97 },
      { date: "2006-01-01", value: 0.84 },
      { date: "2008-01-01", value: 4.85 },
      { date: "2010-01-01", value: 1.82 },
      { date: "2012-01-01", value: 1.57 },
      { date: "2014-01-01", value: 1.22 },
      { date: "2016-01-01", value: 1.49 },
      { date: "2018-01-01", value: 1.38 },
      { date: "2020-01-01", value: 2.11 },
      { date: "2022-01-01", value: 1.54 },
      { date: "2024-01-01", value: 1.02 },
      { date: "2026-01-01", value: 0.76 },
    ],
  },
  {
    id: "sp500-m2",
    slug: "sp500-divided-by-m2",
    name: "S&P 500 ÷ M2",
    category: "Valuation",
    unit: "x",
    descriptionShort: "The index level divided by broad money supply, in billions.",
    descriptionLong:
      "This ratio strips out the mechanical effect of money-supply growth on asset prices. It helps frame whether the market is reaching extremes relative to the amount of money circulating in the economy, not just relative to its own price history.",
    whyItMatters:
      "When the index rises faster than the money supply backing it, the market can become increasingly detached from the underlying monetary backdrop -- a liquidity-driven rally rather than one grounded in broader economic growth.",
    caveats:
      "This is a rough liquidity-based context metric, not a precise valuation tool, and there is no single standard formula for it across analysts.",
    sourceName: "FRED SP500 / FRED M2SL",
    sourceUrl: "https://fred.stlouisfed.org/graph/?g=JpB4",
    updateFrequency: "Daily / monthly",
    orientationHigherIsFrothier: true,
    includedInComposite: true,
    history: [
      { date: "1998-01-01", value: 0.238 },
      { date: "2000-01-01", value: 0.305 },
      { date: "2002-01-01", value: 0.209 },
      { date: "2004-01-01", value: 0.186 },
      { date: "2006-01-01", value: 0.19 },
      { date: "2008-01-01", value: 0.183 },
      { date: "2010-01-01", value: 0.133 },
      { date: "2012-01-01", value: 0.133 },
      { date: "2014-01-01", value: 0.164 },
      { date: "2016-01-01", value: 0.153 },
      { date: "2018-01-01", value: 0.201 },
      { date: "2020-01-01", value: 0.213 },
      { date: "2022-01-01", value: 0.211 },
      { date: "2024-01-01", value: 0.231 },
      { date: "2026-01-01", value: 0.309 },
    ],
  },
  {
    id: "crypto-speculation",
    slug: "crypto-speculation",
    name: "Crypto Speculation",
    category: "Sentiment & Leverage",
    unit: "$T",
    descriptionShort: "Total crypto market value as a proxy for speculative appetite.",
    descriptionLong:
      "Total crypto market capitalization is a rough, high-beta read on speculative risk appetite outside traditional equities.",
    whyItMatters:
      "When speculative assets surge alongside stretched equity valuations, it can suggest investors are comfortable reaching far out on the risk curve.",
    caveats:
      "Crypto market cap is noisy, young, and structurally different from equities. It should be treated as a sentiment proxy, not a valuation anchor.",
    sourceName: "CoinGecko",
    sourceUrl: "https://www.coingecko.com/",
    updateFrequency: "Daily",
    orientationHigherIsFrothier: true,
    includedInComposite: true,
    history: [
      { date: "2013-01-01", value: 0.01 },
      { date: "2014-01-01", value: 0.01 },
      { date: "2016-01-01", value: 0.01 },
      { date: "2018-01-01", value: 0.58 },
      { date: "2020-01-01", value: 0.19 },
      { date: "2021-01-01", value: 0.78 },
      { date: "2022-01-01", value: 2.2 },
      { date: "2023-01-01", value: 0.83 },
      { date: "2024-01-01", value: 1.7 },
      { date: "2025-01-01", value: 3.3 },
      { date: "2026-01-01", value: 3.6 },
    ],
  },
  {
    id: "put-call-ratio",
    slug: "cboe-put-call-ratio",
    name: "CBOE Put/Call Ratio",
    category: "Sentiment & Leverage",
    unit: "x",
    descriptionShort: "A popular options-based sentiment read of fear and complacency.",
    descriptionLong:
      "The put/call ratio compares put-volume demand with call-volume demand. It is often used as a contrarian sentiment signal because very high readings suggest fear and very low readings can mean complacency.",
    whyItMatters:
      "When investors are aggressively buying calls and the ratio falls too far, the market can be underpricing downside risk. Elevated ratios often show stress rather than froth.",
    caveats:
      "The signal is short-term and can swing on positioning rather than fundamentals. It works best as a sentiment backdrop, not a standalone timing tool.",
    sourceName: "CBOE",
    sourceUrl: "https://www.cboe.com/",
    updateFrequency: "Daily",
    orientationHigherIsFrothier: false,
    includedInComposite: true,
    history: [
      { date: "1998-01-01", value: 0.88 },
      { date: "2000-01-01", value: 0.74 },
      { date: "2002-01-01", value: 0.91 },
      { date: "2004-01-01", value: 0.72 },
      { date: "2006-01-01", value: 0.64 },
      { date: "2008-01-01", value: 0.93 },
      { date: "2010-01-01", value: 0.74 },
      { date: "2012-01-01", value: 0.66 },
      { date: "2014-01-01", value: 0.62 },
      { date: "2016-01-01", value: 0.68 },
      { date: "2018-01-01", value: 0.73 },
      { date: "2020-01-01", value: 0.81 },
      { date: "2022-01-01", value: 0.89 },
      { date: "2024-01-01", value: 0.64 },
      { date: "2026-01-01", value: 0.71 },
    ],
  },
  {
    id: "margin-debt",
    slug: "margin-debt",
    name: "Margin Debt",
    category: "Sentiment & Leverage",
    unit: "$T",
    descriptionShort: "Borrowed money used to buy securities.",
    descriptionLong:
      "Margin debt rises when investors are using leverage to buy more stocks. A rapid increase often means more risk appetite and more vulnerability if prices turn.",
    whyItMatters:
      "High margin balances can amplify both upside and downside. A market with heavy leverage can feel more euphoric than fundamentals alone would suggest.",
    caveats:
      "Margin debt trends can be slow and are impacted by regulatory changes and market structure. It is better used as a leverage backdrop than a standalone timing signal.",
    sourceName: "FINRA",
    sourceUrl: "https://www.finra.org/",
    updateFrequency: "Monthly",
    orientationHigherIsFrothier: true,
    includedInComposite: true,
    history: [
      { date: "1998-01-01", value: 0.18 },
      { date: "2000-01-01", value: 0.31 },
      { date: "2002-01-01", value: 0.24 },
      { date: "2004-01-01", value: 0.29 },
      { date: "2006-01-01", value: 0.35 },
      { date: "2008-01-01", value: 0.42 },
      { date: "2010-01-01", value: 0.27 },
      { date: "2012-01-01", value: 0.29 },
      { date: "2014-01-01", value: 0.37 },
      { date: "2016-01-01", value: 0.42 },
      { date: "2018-01-01", value: 0.54 },
      { date: "2020-01-01", value: 0.67 },
      { date: "2022-01-01", value: 0.76 },
      { date: "2024-01-01", value: 0.89 },
      { date: "2026-01-01", value: 0.97 },
    ],
  },
  {
    id: "aaii-sentiment",
    slug: "aaii-sentiment",
    name: "AAII Sentiment",
    category: "Sentiment & Leverage",
    unit: "%",
    descriptionShort: "The spread between bullish and bearish responses in the AAII survey.",
    descriptionLong:
      "AAII sentiment captures how bullish or bearish individual investors feel about the market. Extreme optimism can foreshadow lower future returns, while extreme pessimism can signal the opposite.",
    whyItMatters:
      "Very high bullishness often coincides with crowded positioning and lower future risk-adjusted returns. Extreme pessimism can be a useful contrarian sign.",
    caveats:
      "Sentiment surveys are noisy and can stay extreme for a while. They work best as a secondary check rather than a primary trigger.",
    sourceName: "AAII",
    sourceUrl: "https://www.aaii.com/",
    updateFrequency: "Weekly",
    orientationHigherIsFrothier: false,
    includedInComposite: true,
    history: [
      { date: "1998-01-01", value: 24 },
      { date: "2000-01-01", value: 19 },
      { date: "2002-01-01", value: 26 },
      { date: "2004-01-01", value: 22 },
      { date: "2006-01-01", value: 21 },
      { date: "2008-01-01", value: 29 },
      { date: "2010-01-01", value: 20 },
      { date: "2012-01-01", value: 18 },
      { date: "2014-01-01", value: 16 },
      { date: "2016-01-01", value: 19 },
      { date: "2018-01-01", value: 25 },
      { date: "2020-01-01", value: 31 },
      { date: "2022-01-01", value: 24 },
      { date: "2024-01-01", value: 18 },
      { date: "2026-01-01", value: 22 },
    ],
  },
  {
    id: "ten-year-yield",
    slug: "ten-year-treasury-yield",
    name: "10Y Treasury Yield",
    category: "Macro",
    unit: "%",
    descriptionShort: "The yield on a 10-year US Treasury note.",
    descriptionLong:
      "The 10-year Treasury yield is a key anchor for discount rates and a proxy for the market's view of growth and inflation. It also matters because it sets the backdrop for equity risk premium.",
    whyItMatters:
      "Higher yields can pressure valuations, while lower yields tend to support higher prices when the economy is still healthy.",
    caveats:
      "The yield is not a bubble signal on its own, but it can shape the risk-reward backdrop for the market.",
    sourceName: "FRED DGS10",
    sourceUrl: "https://fred.stlouisfed.org/series/DGS10",
    updateFrequency: "Daily",
    orientationHigherIsFrothier: false,
    includedInComposite: false,
    history: [
      { date: "1998-01-01", value: 5.4 },
      { date: "2000-01-01", value: 6.0 },
      { date: "2002-01-01", value: 4.5 },
      { date: "2004-01-01", value: 4.3 },
      { date: "2006-01-01", value: 4.8 },
      { date: "2008-01-01", value: 3.7 },
      { date: "2010-01-01", value: 3.2 },
      { date: "2012-01-01", value: 1.8 },
      { date: "2014-01-01", value: 2.5 },
      { date: "2016-01-01", value: 2.2 },
      { date: "2018-01-01", value: 2.9 },
      { date: "2020-01-01", value: 1.8 },
      { date: "2022-01-01", value: 3.5 },
      { date: "2024-01-01", value: 4.5 },
      { date: "2026-01-01", value: 4.2 },
    ],
  },
  {
    id: "unemployment",
    slug: "unemployment-rate",
    name: "Unemployment Rate",
    category: "Macro",
    unit: "%",
    descriptionShort: "The share of the labor force that is unemployed.",
    descriptionLong:
      "The unemployment rate offers a real-economy check on how the market is being supported by the broader economy.",
    whyItMatters:
      "High unemployment usually implies less consumer strength and more recession risk. It can also be a useful context check on valuations.",
    caveats:
      "It is a lagging indicator, so it is more useful for context than for sounding the first alarm.",
    sourceName: "FRED UNRATE",
    sourceUrl: "https://fred.stlouisfed.org/series/UNRATE",
    updateFrequency: "Monthly",
    orientationHigherIsFrothier: false,
    includedInComposite: false,
    history: [
      { date: "1998-01-01", value: 4.5 },
      { date: "2000-01-01", value: 4.0 },
      { date: "2002-01-01", value: 5.8 },
      { date: "2004-01-01", value: 5.5 },
      { date: "2006-01-01", value: 4.6 },
      { date: "2008-01-01", value: 5.8 },
      { date: "2010-01-01", value: 9.6 },
      { date: "2012-01-01", value: 8.1 },
      { date: "2014-01-01", value: 6.2 },
      { date: "2016-01-01", value: 4.9 },
      { date: "2018-01-01", value: 3.9 },
      { date: "2020-01-01", value: 3.5 },
      { date: "2020-04-01", value: 14.7 },
      { date: "2022-01-01", value: 3.7 },
      { date: "2024-01-01", value: 4.0 },
      { date: "2026-01-01", value: 4.3 },
    ],
  },
  {
    id: "sahm-rule",
    slug: "sahm-rule",
    name: "Sahm Rule",
    category: "Macro",
    unit: "%",
    descriptionShort: "A real-time recession trigger based on unemployment deterioration.",
    descriptionLong:
      "The Sahm Rule tracks how far the unemployment rate has risen above its recent low. It is designed to flag recession risk once labor-market weakness becomes broad enough.",
    whyItMatters:
      "It is not a froth signal, but it keeps the bubble meter grounded in the real economy. A stretched market with rising recession risk is a different setup from a stretched market with sturdy employment.",
    caveats:
      "The Sahm Rule is a recession trigger, not an equity signal. It usually confirms stress after unemployment has already begun moving.",
    sourceName: "FRED SAHMREALTIME",
    sourceUrl: "https://fred.stlouisfed.org/series/SAHMREALTIME",
    updateFrequency: "Monthly",
    orientationHigherIsFrothier: false,
    includedInComposite: false,
    history: [
      { date: "1998-01-01", value: 0.0 },
      { date: "2000-01-01", value: 0.1 },
      { date: "2002-01-01", value: 0.8 },
      { date: "2004-01-01", value: 0.2 },
      { date: "2006-01-01", value: 0.0 },
      { date: "2008-01-01", value: 0.7 },
      { date: "2010-01-01", value: 1.9 },
      { date: "2012-01-01", value: 0.1 },
      { date: "2014-01-01", value: 0.0 },
      { date: "2016-01-01", value: 0.1 },
      { date: "2018-01-01", value: 0.0 },
      { date: "2020-01-01", value: 0.0 },
      { date: "2020-06-01", value: 9.5 },
      { date: "2022-01-01", value: 0.0 },
      { date: "2024-01-01", value: 0.4 },
      { date: "2026-01-01", value: 0.3 },
    ],
  },
  {
    id: "open-weight-gap",
    slug: "open-vs-closed-model-gap",
    name: "Open vs. Closed Model Intelligence Gap",
    category: "AI Buildout",
    unit: "pts",
    descriptionShort: "Arena AI (code leaderboard) Elo gap between the top closed and top open-weight model.",
    descriptionLong:
      "Tracks the Elo gap, on the Arena AI code leaderboard, between the best-scoring proprietary model and the best-scoring open-weight model. A shrinking gap means open-weight releases are closing in on frontier labs' best closed models faster than those labs can extend their lead.",
    whyItMatters:
      "The premium valuations placed on frontier AI labs and the hyperscalers bankrolling them lean on the assumption that closed-model capability stays meaningfully ahead of free alternatives. A fast-closing gap chips away at that moat narrative even though it says nothing about near-term revenue.",
    caveats:
      "This is a watch item, not part of the composite score. Artificial Analysis's own model-comparison API would need a $400/mo Pro plan for this data, so this instead reads github.com/oolong-tea-2026/arena-ai-leaderboards, a free, keyless, daily-scraped mirror of the Arena AI leaderboards that already tags each model's license (open vs. proprietary). That mirror is a single-maintainer side project, not Arena's own feed, and has no durability guarantee -- a prior similar mirror silently stopped updating for over a year with no visible warning. Ingestion checks the mirror's own \"latest snapshot\" date on every run and refuses to use data more than 4 days old; if that trips, the metric simply stops updating and a GitHub issue is filed automatically on the repo so staleness gets noticed instead of silently going unnoticed.",
    sourceName: "Arena AI code leaderboard (via arena-ai-leaderboards mirror)",
    sourceUrl: "https://github.com/oolong-tea-2026/arena-ai-leaderboards",
    updateFrequency: "Daily (automated, keyless)",
    orientationHigherIsFrothier: false,
    includedInComposite: false,
    history: [{ date: "2026-07-20", value: 92 }],
  },
  {
    id: "hyperscaler-capex-divergence",
    slug: "hyperscaler-capex-divergence",
    name: "Hyperscaler Capex-to-Revenue Divergence",
    category: "AI Buildout",
    unit: "pp",
    descriptionShort: "How much faster combined hyperscaler capex is growing than their revenue.",
    descriptionLong:
      "Compares the year-over-year growth rate of combined capital expenditures at Microsoft, Amazon, Alphabet, and Meta with the year-over-year growth rate of their combined revenue, computed directly from each company's SEC XBRL filings. A rising gap means AI infrastructure spending is compounding faster than the sales it is meant to support.",
    whyItMatters:
      "Capex at these four companies has been growing far faster than revenue through the AI buildout. That gap is the clearest numeric expression of the 'spending now, monetizing later' bet underpinning the AI trade -- the wider it gets, the more the trade depends on future demand showing up on schedule.",
    caveats:
      "Live updates are computed from each company's PaymentsToAcquirePropertyPlantAndEquipment and revenue XBRL facts via SEC EDGAR's free companyconcept API (no key required), matched by calendar year of fiscal-year-end and only combined when all four companies report both the current and prior year. The single seed value below is one real, precisely computed point (FY2024 to FY2025 combined revenue, from each company's own 10-K/earnings release, +14.7%, versus Epoch AI's reported 2024-to-2025 combined hyperscaler capex growth of +81.4%; note that Epoch AI's capex figure includes Oracle alongside these four, a scope mismatch this one bootstrap point inherits -- the live SEC-only feed replaces it with an apples-to-apples figure once ingestion runs). The four companies have different fiscal year ends (Microsoft's is June 30), so calendar-year bucketing blends slightly offset fiscal periods. Revenue growth is total company revenue, not AI-specific revenue, since AI-only revenue is not separately disclosed.",
    sourceName: "SEC EDGAR XBRL (company filings)",
    sourceUrl: "https://data.sec.gov/api/xbrl/companyconcept/CIK0000789019/us-gaap/Revenues.json",
    updateFrequency: "Annual (automated, keyless)",
    orientationHigherIsFrothier: true,
    includedInComposite: true,
    history: [{ date: "2025-12-31", value: 66.8 }],
  },
];

export const compositeCategoryWeights: Record<string, number> = {
  Valuation: 1,
  "Credit & Volatility": 1,
  "Sentiment & Leverage": 1,
  "AI Buildout": 1,
};

export function resolveMetricCatalog(liveMetrics: MetricDefinition[], fallbackMetrics: MetricDefinition[]) {
  const minimumLiveMetrics = Math.max(6, Math.ceil(fallbackMetrics.length * 0.75));
  if (!liveMetrics.length || liveMetrics.length < minimumLiveMetrics) {
    return { metrics: fallbackMetrics, fromSupabase: false };
  }

  return { metrics: liveMetrics, fromSupabase: true };
}

export function getMetrics() {
  return baseMetrics;
}

export function getMetricBySlug(slug: string) {
  return baseMetrics.find((metric) => metric.slug === slug) ?? null;
}

function percentileRank(values: number[], currentValue: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.filter((value) => value <= currentValue).length;
  return Math.round((count / sorted.length) * 100);
}

function orientValues(metric: MetricDefinition) {
  const values = metric.history.map((point) => point.value);
  if (metric.orientationHigherIsFrothier) {
    return values;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  return values.map((value) => max + min - value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function buildMetricSnapshot(metric: MetricDefinition): MetricSnapshot {
  const orientedValues = orientValues(metric);
  const latest = metric.history[metric.history.length - 1];
  const latestOrientedValue = orientedValues[orientedValues.length - 1];
  const percentile = percentileRank(orientedValues, latestOrientedValue);
  const subscore = clamp(percentile, 0, 100);
  const historyMedian = median(orientedValues);
  const historyMax = Math.max(...orientedValues);
  const distanceToPeak =
    historyMax === historyMedian
      ? 0
      : clamp(((latestOrientedValue - historyMedian) / (historyMax - historyMedian)) * 100, 0, 100);

  return {
    metric,
    currentValue: latest.value,
    percentile: Math.round(percentile),
    subscore,
    distanceToPeak: Math.round(distanceToPeak),
    currentRead: "",
    latestDate: latest.date,
  };
}

export function buildMetricSnapshots() {
  return buildMetricSnapshotsFromDefinitions(getMetrics());
}

export function buildMetricSnapshotsFromDefinitions(metrics: MetricDefinition[]) {
  return metrics.map((metric) => {
    const snapshot = buildMetricSnapshot(metric);
    return {
      ...snapshot,
      currentRead: buildCurrentRead(metric, snapshot),
    };
  });
}

export function buildCompositeSnapshot(snapshots: MetricSnapshot[]) {
  const compositeMetrics = snapshots.filter((snapshot) => snapshot.metric.includedInComposite);
  const categoryScores: Record<string, number> = {};
  const availableCategories = Object.keys(compositeCategoryWeights).filter((category) =>
    compositeMetrics.some((snapshot) => snapshot.metric.category === category),
  );

  for (const category of availableCategories) {
    const categoryMetrics = compositeMetrics.filter((snapshot) => snapshot.metric.category === category);
    categoryScores[category] = average(categoryMetrics.map((snapshot) => snapshot.subscore));
  }

  const weightedTotal = availableCategories.reduce(
    (total, category) => total + categoryScores[category] * compositeCategoryWeights[category],
    0,
  );
  const totalWeight = availableCategories.reduce((total, category) => total + compositeCategoryWeights[category], 0);
  const compositeScore = totalWeight === 0 ? 0 : weightedTotal / totalWeight;
  const zone = resolveZone(compositeScore);
  const topDrivers = compositeMetrics
    .slice()
    .sort((left, right) => right.subscore - left.subscore)
    .slice(0, 3);

  return {
    score: Math.round(compositeScore),
    zone: zone.label,
    color: zone.color,
    summary: buildHeroSummary(compositeScore, topDrivers),
    topDrivers,
    categoryScores,
  };
}

export const ZONES = [
  { label: "Bargain bin", min: 0, max: 19, color: "from-emerald-500 to-green-500" },
  { label: "Cool and calm", min: 20, max: 39, color: "from-emerald-400 to-lime-500" },
  { label: "Getting warm", min: 40, max: 59, color: "from-amber-400 to-orange-500" },
  { label: "Frothy", min: 60, max: 79, color: "from-orange-500 to-rose-500" },
  { label: "Bubble bath", min: 80, max: 100, color: "from-rose-600 to-red-600" },
];

export function resolveZone(score: number) {
  return ZONES.find((zone) => score <= zone.max) ?? ZONES[ZONES.length - 1];
}

export function buildCurrentRead(metric: MetricDefinition, snapshot: MetricSnapshot) {
  const percentile = snapshot.percentile;
  const startYear = new Date(metric.history[0].date).getUTCFullYear();
  let tail = "running close to the middle of its history";

  if (percentile >= 90) {
    tail = "near the top of its historical range";
  } else if (percentile >= 75) {
    tail = "hotter than most prior readings";
  } else if (percentile <= 25) {
    tail = "below historical norms";
  }

  return `${metric.name} is at the ${percentile}th percentile since ${startYear}, ${tail}.`;
}

export function buildHeroSummary(score: number, topDrivers: MetricSnapshot[]) {
  const driverNames = topDrivers.map((driver) => driver.metric.name).join(", ");
  const zone = resolveZone(score);
  return `The market is in ${zone.label.toLowerCase()} territory: ${Math.round(score)} out of 100 on the composite bubble meter, with ${driverNames} leading the pack.`;
}

export function formatValue(value: number, metric: MetricDefinition) {
  const rounded = Number(value.toFixed(metric.unit === "%" ? 1 : 2));
  if (metric.unit === "%") {
    return `${rounded}%`;
  }
  if (metric.unit === "x") {
    return `${rounded}x`;
  }
  if (metric.unit === "$T") {
    return `$${rounded}T`;
  }
  if (metric.unit === "pp") {
    return `${rounded}pp`;
  }
  if (metric.unit === "pts") {
    return `${rounded}pts`;
  }
  return `${rounded}`;
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function buildAggregateInterpretation(snapshots: MetricSnapshot[]) {
  const hot = snapshots.filter((snapshot) => snapshot.subscore >= 70).length;
  const top = snapshots
    .slice()
    .sort((left, right) => right.subscore - left.subscore)
    .slice(0, 2)
    .map((snapshot) => snapshot.metric.name)
    .join(" and ");
  return `Across the leading signals, ${hot} of ${snapshots.length} indicators are reading above their historical norm, with ${top} doing the most work. The mix describes conditions and relative risk, not timing: markets can stay extreme or grow more extreme for years.`;
}
