# n8n-nodes-polymarket

[![npm version](https://img.shields.io/npm/v/n8n-nodes-polymarket.svg)](https://www.npmjs.com/package/n8n-nodes-polymarket)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is an n8n community node that provides integration with [Polymarket](https://polymarket.com), a decentralized prediction market platform. Discover tradeable markets, filter by categories, and access real-time market data directly in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

---

## 📦 Installation

### In n8n (Recommended)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-polymarket` in the npm package name field
4. Click **Install**
5. Restart n8n

### Manual Installation

```bash
npm install n8n-nodes-polymarket
```

After installation, restart n8n to load the new node.

---

## ✨ Current Features (Part 1: Market Info)

### 🟢 Available Now - Gamma API Integration

Discover and analyze prediction markets with comprehensive market data access:

#### **5 Fetch Methods**

1. **Get Tags List** - Retrieve all market categories (Politics, Crypto, Sports, etc.)
2. **By Slug** - Fetch specific markets or events by URL slug
3. **By Tags** - Filter markets by category/topic
4. **Via Events Endpoint** - Browse all active markets efficiently
5. **Search** - Find markets using keywords

#### **Resource Types**

- **Events** - Groups of related markets (e.g., "2024 US Election" with multiple outcome markets)
- **Markets** - Individual tradeable prediction markets

#### **Advanced Filtering**

- Active/Closed/Archived status
- Pagination (limit, offset)
- Sorting (by volume, liquidity, created date, ID)
- Tag-based filtering with related tags
- Default: Active markets only (no old/closed data)

#### **Data Retrieved**

- Market questions and descriptions
- Token IDs for trading preparation
- Current outcome prices
- Trading volume and liquidity
- Market metadata and status
- Category tags and classifications

---

## 🚧 Coming Soon

### Part 2: Trading Operations (CLOB API) - In Development

- Create buy/sell orders (Market & Limit orders)
- Cancel orders
- View orderbook depth
- Real-time price feeds
- Order management

### Part 3: User Data & Positions (Data API) - Planned

- View all positions
- Track profit/loss
- Trade history
- Portfolio analytics
- Performance metrics

---

## 🚀 Quick Start

### Example 1: Get All Market Categories

```
1. Add Polymarket node to workflow
2. Operation: Market Info (Gamma API)
3. Fetch Method: Get Tags List
4. Execute
```

**Result**: List of all categories with IDs (Politics, Crypto, Sports, etc.)

### Example 2: Browse Active Crypto Markets

```
1. Operation: Market Info (Gamma API)
2. Fetch Method: By Tags
3. Resource Type: Market
4. Tag ID: 21 (Crypto - get from Tags List)
5. Filters:
   - Active: Yes
   - Closed: No
   - Limit: 20
6. Execute
```

**Result**: Active cryptocurrency prediction markets

### Example 3: Search for Specific Markets

```
1. Operation: Market Info (Gamma API)
2. Fetch Method: Search
3. Search Query: "bitcoin"
4. Execute
```

**Result**: All markets mentioning "bitcoin"

### Example 4: Get Market Details for Trading

```
1. Operation: Market Info (Gamma API)
2. Fetch Method: By Slug
3. Resource Type: Market
4. Slug: bitcoin-above-100k-by-2025
5. Execute
```

**Result**: Complete market data including token IDs needed for trading

---

## 📖 Usage Examples

### Workflow 1: Daily Market Report

```
Schedule (Daily 9AM)
  ↓
Polymarket (Get Active Events)
  ↓
Filter (volume > 100000)
  ↓
Email (Send report)
```

### Workflow 2: Category Monitor

```
Schedule (Every hour)
  ↓
Polymarket (By Tags: Politics)
  ↓
Sort (by volume)
  ↓
Slack (Alert on high volume)
```

### Workflow 3: Market Discovery Bot

```
Schedule (Every 30 min)
  ↓
Polymarket (Via Events Endpoint)
  ↓
Filter (new markets)
  ↓
Database (Store for analysis)
```

### Workflow 4: Price Alert System

```
Schedule (Every 5 min)
  ↓
Polymarket (By Slug: specific market)
  ↓
Compare (price vs threshold)
  ↓
Notification (if condition met)
```

---

## 🎯 Operations Reference

### Market Info (Gamma API)

| Fetch Method | Best For | Returns |
|--------------|----------|---------|
| Get Tags List | Finding categories | Tag IDs and labels |
| By Slug | Specific market/event lookup | Single result |
| By Tags | Category filtering | Markets in category |
| Via Events | Browsing all markets | Bulk market data |
| Search | Keyword search | Matching markets |

### Available Filters

| Filter | Type | Default | Description |
|--------|------|---------|-------------|
| Active | Boolean | Yes | Only active markets |
| Closed | Boolean | No | Include closed markets |
| Archived | Boolean | No | Include archived markets |
| Limit | Number | 50 | Results per page |
| Offset | Number | 0 | Pagination offset |
| Order By | String | ID | Sort field |
| Sort Direction | Boolean | Descending | Sort order |

---

## 🔑 Important Data Fields

### From Market Response

```json
{
  "id": "789",
  "question": "Will Bitcoin reach $100k by 2025?",
  "conditionId": "0xe3b423...",
  "slug": "bitcoin-100k-2025",
  "clobTokenIds": [
    "token_yes_id",  // Index 0 = Yes outcome
    "token_no_id"    // Index 1 = No outcome
  ],
  "outcomePrices": ["0.65", "0.35"],
  "volume": "1000000.50",
  "liquidity": "50000.00",
  "active": true,
  "closed": false
}
```

**Key fields for trading prep:**
- `clobTokenIds`: Token IDs for placing orders
- `conditionId`: Market identifier
- `outcomePrices`: Current market prices
- `slug`: For URL references

---

## 📚 API Documentation

This node integrates with Polymarket's APIs:

- **Gamma API** (Current): Market discovery and metadata
  - Base URL: `https://gamma-api.polymarket.com`
  - [Gamma API Docs](https://docs.polymarket.com/developers/gamma-markets-api/fetch-markets-guide)

- **CLOB API** (Coming Soon): Trading operations
  - Base URL: `https://clob.polymarket.com`
  - [CLOB API Docs](https://docs.polymarket.com/developers/CLOB/quickstart)

- **Data API** (Planned): User positions and history
  - Base URL: `https://data-api.polymarket.com`

---

## 🗺️ Roadmap

### ✅ Phase 1: Market Discovery (Complete)
- [x] Gamma API integration
- [x] Tag-based filtering
- [x] Search functionality
- [x] Event and market browsing
- [x] Advanced filtering and sorting

### 🔨 Phase 2: Trading Operations (In Progress)
- [ ] CLOB API authentication
- [ ] Order creation (Market & Limit)
- [ ] Order cancellation
- [ ] Orderbook access
- [ ] Real-time pricing

### 📋 Phase 3: User Data (Planned)
- [ ] Position tracking
- [ ] Trade history
- [ ] Portfolio analytics
- [ ] P&L calculations
- [ ] Performance metrics

### 🌟 Phase 4: Real-time Updates (Future)
- [ ] WebSocket integration
- [ ] Live price feeds
- [ ] Order status updates
- [ ] Market notifications

---

## 🐛 Troubleshooting

### Common Issues

**Getting old/closed markets**
- ✅ Solution: Ensure filters are set to `Active: Yes` and `Closed: No`

**Can't find category**
- ✅ Solution: Use "Get Tags List" to find correct tag IDs

**No results returned**
- ✅ Solution: Try removing filters or increasing limit

**Tag filtering not working**
- ✅ Solution: Use Tag ID (number) not tag name (string)

### Enable Debug Logging

In n8n, enable debug mode to see detailed request/response data:
```bash
export N8N_LOG_LEVEL=debug
n8n start
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/n8n-nodes-polymarket.git
cd n8n-nodes-polymarket

# Install dependencies
npm install

# Build
npm run build

# Link for local testing
npm link

# In your n8n installation
npm link n8n-nodes-polymarket

# Restart n8n
```

### Project Structure

```
n8n-nodes-polymarket/
├── package.json
├── tsconfig.json
├── gulpfile.js
├── README.md
├── credentials/
│   └── PolymarketApi.credentials.ts
└── nodes/
    └── Polymarket/
        ├── Polymarket.node.ts
        └── polymarket.png
```

---

## 📄 License

[MIT](LICENSE)

---

## 🔗 Resources

- [Polymarket Website](https://polymarket.com)
- [Polymarket Documentation](https://docs.polymarket.com)
- [n8n Documentation](https://docs.n8n.io)
- [n8n Community](https://community.n8n.io)

---

## ⚠️ Disclaimer

This is a community-developed integration and is not officially affiliated with or endorsed by Polymarket or n8n.io.

**Trading Warning**: Prediction markets involve risk. This tool is for informational and automation purposes. Always verify data and trade responsibly. Past performance does not guarantee future results.

---

## 💬 Support

- 🐛 [Report Issues](https://github.com/deepakdhaka-1/n8n-polymarket-node-package/issues)
- 💡 [Feature Requests](https://github.com/deepakdhaka-1/n8n-polymarket-node-package/issues)
- 📖 [Documentation](https://docs.polymarket.com)
- 💬 [n8n Community Forum](https://community.n8n.io)

---

## 🎉 Acknowledgments

- [Polymarket](https://polymarket.com) - Prediction market platform
- [n8n](https://n8n.io) - Workflow automation
- Community contributors and testers

---

**Built with ❤️ for the n8n community**

**Current Version**: 1.0.0 (Part 1: Market Info)

**Last Updated**: January 2026
