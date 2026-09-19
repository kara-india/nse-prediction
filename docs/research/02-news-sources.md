# 02 — News Sources and NLP Feature Engineering
*Indian Stock Intelligence Dashboard · Research Brief · Sep 2026*

---

## A. Historical News Sources for ML Training

### A1. Aggregators and APIs

| Source | Indian Coverage | Historical Depth | Free Tier | Access Method | ToS Risk |
|---|---|---|---|---|---|
| GDELT Project (gdeltproject.org) | Moderate - machine-coded global corpus; India filterable via country code + theme | 1979-present (events); GKG from 2013 | Free (BigQuery charges for large queries) | BigQuery SQL / bulk CSV download | Low - open data |
| Alpha Vantage News and Sentiment | Limited - primarily US-centric; NSE/BSE tickers inconsistent | ~1-2 years | 25 req/day, 5 req/min | REST JSON API | Low |
| NewsAPI.org | Moderate - country=in filter; major Indian outlets | 1 month (free); unlimited (/mo paid) | 100 req/day, 24-hour delay on free | REST JSON API | Medium - no production use on free tier |

### A2. Indian Financial Media - RSS Feeds

| Source | RSS URL Pattern | Historical Archiving | Notes |
|---|---|---|---|
| Economic Times | economictimes.indiatimes.com/rssfeeds.cms | No - live feed only | Multiple category feeds |
| Business Standard | business-standard.com/rss | No - live feed only | Official RSS page |
| Moneycontrol | No official RSS | No | UNRESOLVED stability via third-party generators |
| The Hindu Business Line | thehindubusinessline.com/feeder/default.rss | No | Official feed |

**Key limitation**: RSS feeds are stateless - no historical backfill. For ML training you must capture and store them continuously from day 1.

### A3. Exchange Official Announcements

| Exchange | Portal URL | Format | Historical Depth | Point-in-Time ML Use |
|---|---|---|---|---|
| BSE Corporate Announcements | bseindia.com/corporates/ann.html | HTML; unofficial JSON endpoint (unstable) | ~10+ years via portal | YES - timestamp field reliable; PDFs available |
| NSE Corporate Filings | nseindia.com/companies-listing/corporate-filings-announcements | HTML; RSS for board meetings/results | UNRESOLVED depth; paid SFTP for professionals | YES - timestamps available |
| SEBI XBRL | efiling.sebi.gov.in | XBRL structured | Structured filings | YES for financials; limited news |

Library references:
- BennyThadikaran/BseIndiaApi (GitHub) for BSE
- nsepython (PyPI) for NSE

### A4. Premium / Institutional Sources

| Source | Coverage | Cost | Notes |
|---|---|---|---|
| LSEG / Refinitiv (Reuters) | Global + India (machine-readable news feed) | -/yr entry | Best programmatic option; not viable for personal projects |
| Bloomberg | Global + India | -/yr per seat | B-PIPE for data; not viable |

---

## B. Live / Near-Live News for Dashboard

### B1. Sources Providing News Within 0-60 Minutes

| Source | Typical Lag | Method | Notes |
|---|---|---|---|
| BSE RSS Feed | 2-5 min | RSS polling (60s interval) | Most reliable for official announcements |
| NSE RSS Feed | 2-5 min | RSS polling | Board meetings, results, corporate actions |
| Economic Times RSS | 5-15 min | RSS polling | Broad financial news |
| Business Standard RSS | 5-15 min | RSS polling | - |
| GDELT DOC 2.0 API | 15-30 min | REST JSON | Rolling ~3-month window; good for volume metrics |
| NewsAPI.org (paid) | ~5 min | REST JSON | Requires Business plan (/mo) |

### B2. Post-Market Window Detection

`
Market close:  15:30 IST
Pre-open:      09:00 IST next trading day  
Overnight window: 15:30 -> 09:00 IST (~17.5 hours)

Classification logic:
  15:30 <= pub_ts IST -> OVERNIGHT (assign to next trading day)
  00:00 <= pub_ts < 09:15 IST -> OVERNIGHT (assign to same trading day)
  09:15 <= pub_ts <= 15:30 IST -> INTRADAY (exclude from EOD features)
`

### B3. Required Metadata Schema

`
article_timestamp_ist: ISO 8601 with +05:30 offset
retrieval_timestamp_utc: when we fetched it
source: Economic Times | BSE RSS | NSE RSS | etc.
headline: string
url: string
company_name: string (from entity recognition)
nse_symbol: string (validated against NSE master)
bse_code: string
sector: string
country: string (ISO 2-letter)
publication_window: OVERNIGHT | INTRADAY | PRE_OPEN
assigned_trading_date: YYYY-MM-DD
`

---

## C. NLP Feature Engineering for ML

### C1. Sentiment Models Comparison

| Model | Open Source | Indian Fin. Accuracy | Compute | Recommendation |
|---|---|---|---|---|
| FinBERT (ProsusAI/finbert) | YES - HuggingFace | ~76-82% (fine-tuned on Indian) | Medium (BERT-base ~440MB) | PRIMARY - best general choice |
| Vansh180/FinBERT-India-v1 | YES - HuggingFace | Better for Indian context | Same as FinBERT | Consider as fine-tuned variant |
| distilbert-finance | YES - HuggingFace | UNRESOLVED on Indian data | Low (distilled ~260MB) | 2x faster; good for high-volume |
| VADER | YES - NLTK | Poor - not domain-adapted | Negligible | Baseline only |
| TextBlob | YES | Poor | Negligible | Avoid for financial text |

### C2. Event Types That Matter for Stock Prices

| Tier | Event Type | Price Impact Horizon |
|---|---|---|
| High | Earnings surprise, guidance revision, M&A announcement, block deal | 1-2 days |
| High | Management change (CEO/CFO), regulatory action, SEBI order, court ruling | 1-5 days |
| Medium | RBI policy announcement, macro data (CPI, IIP), FII/DII flow data | 1-3 days |
| Medium | Debt upgrade/downgrade (ICRA/CRISIL/Moody's), analyst rating change | 1-3 days |
| Low | AGM announcements, routine dividend declaration, bonus/split | 0-1 day |
| Contextual | Global macro (Fed rate, China PMI), commodity prices | Sector-dependent |

### C3. Structured Event Extraction Schema

`python
@dataclass
class NewsFeatureVector:
    company_sentiment: float       # [-1, 1] - FinBERT score
    event_type: str                # EARNINGS | MGMT_CHANGE | M_AND_A | REGULATORY |
                                   # LEGAL | MACRO_POLICY | DEBT_RATING | AGM | OTHER
    event_severity: float          # [0, 1] - LLM or rule-based; 1 = highest impact
    novelty_score: float           # [0, 1] - cosine distance from rolling 7-day centroid
    market_relevance: float        # [0, 1] - is the company in an index?
    sector_relevance: float        # [0, 1] - sector match
    global_relevance: float        # [0, 1] - non-India dateline or global macro flag
    news_volume_zscore: float      # z-score of article count vs 30-day mean
    sentiment_momentum: float      # EWM of company_sentiment, span=5 days
    event_severity_max: float      # max event_severity in overnight window
`

### C4. LLM-Based Structured Extraction

| Dimension | Assessment |
|---|---|
| Determinism | Non-deterministic; mitigate with temperature=0 + JSON schema enforcement |
| Cost (GPT-4o-mini) | ~.15/1M input tokens - viable for headlines at scale |
| Cost (Gemini 1.5 Flash) | ~.075/1M tokens - lower cost; good Indian English understanding |
| Latency | 500ms-2s per article; use async batching |
| Reliability | Hallucination risk on entity names - always validate tickers vs NSE symbol master |

**Recommended pipeline**:
1. FinBERT -> company_sentiment (fast, deterministic)
2. LLM (Flash/GPT-4o-mini) -> event_type, event_severity, entities (batch overnight)
3. Sentence transformer embedding -> novelty_score via cosine similarity

### C5. Embedding-Based Features

- Model: sentence-transformers/all-MiniLM-L6-v2 (384-dim, fast) or BAAI/bge-small-en-v1.5
- novelty_score: cosine distance from 7-day rolling centroid of stored embeddings
- Deduplication: cluster near-duplicate articles (threshold ~0.95 cosine similarity)
- Storage: FAISS or ChromaDB for vector search

---

## D. NSE/BSE Official Announcements Reference

| Item | BSE | NSE |
|---|---|---|
| Portal URL | bseindia.com/corporates/ann.html | nseindia.com/companies-listing/corporate-filings-announcements |
| RSS Feed | bseindia.com/Newsnonsecure/home_rss.aspx | Available per category |
| Unofficial JSON | api.bseindia.com/BseIndiaAPI/api/AnnGetData/... | No equivalent |
| Library | BennyThadikaran/BseIndiaApi (GitHub) | nsepython (PyPI) |
| Format | HTML portal; PDF attachments | HTML portal; PDF filings |
| Historical depth | ~10 years via portal | UNRESOLVED |
| Point-in-time ML | YES - timestamp field reliable | YES - timestamps available |
| Cost | Free (unofficial); licensed feed via datafeed.sales@bseindia.com | Free (RSS); paid SFTP |

---

## E. Causal / Point-in-Time News Pipeline Design

### E1. Look-Ahead Bias Prevention Rule

`
News article published at T_pub may only be used as a feature for market date D where:
  T_pub < market_open(D)  [09:15 IST]

  D = next_trading_day(T_pub)  if  T_pub >= 15:30 IST  (post-market)
  D = current_trading_day      if  T_pub < 09:15 IST   (pre-open)
  EXCLUDE from EOD features    if  09:15 <= T_pub <= 15:30 IST (market hours)
`

### E2. Pre-Market vs Post-Market Handling

| Window | IST Range | Assigned To | Feature Role |
|---|---|---|---|
| Pre-open | 00:00-09:14 | Same day D | Overnight feature for D |
| Market hours | 09:15-15:29 | Excluded from EOD features | Intraday model only |
| Post-close | 15:30-23:59 | Next trading day D+1 | Overnight feature for D+1 |

### E3. Timezone Implementation Checklist

- Store ALL raw timestamps in UTC in the database
- Apply Asia/Kolkata conversion only at classification step
- Use pandas_market_calendars (NSE calendar) for next_trading_day() logic
- Validate that retrieval_ts_utc >= pub_ts_utc (catches malformed feeds)
- For BSE/NSE announcements: use exchange-stamped pubDate from RSS, not HTTP response time

---

## Key UNRESOLVED Items

1. Moneycontrol RSS - no official feed; third-party generators have stability risk
2. NSE portal historical depth - unclear how far back searchable archive goes
3. distilbert-finance accuracy on Indian financial news - no benchmarks found
4. Alpha Vantage News coverage for NSE/BSE tickers - inconsistent per ticker

Sources: gdeltproject.org | alphavantage.co/documentation/ | newsapi.org | bseindia.com | nseindia.com | economictimes.indiatimes.com/rssfeeds.cms | huggingface.co/ProsusAI/finbert | lseg.com | Sep 2026
