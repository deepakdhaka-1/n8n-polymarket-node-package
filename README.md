
# n8n-nodes-polymarket

[![npm version](https://badge.fury.io/js/n8n-nodes-polymarket.svg)](https://badge.fury.io/js/n8n-nodes-polymarket)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is an n8n community node package that provides integration with [Polymarket](https://polymarket.com), a decentralized prediction market platform built on Polygon.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Features

### 📊 Market Operations
- **Get All Markets**: Retrieve all available markets with filtering options
- **Get Market Details**: Fetch detailed information for specific markets
- **Get Market Stats**: Access trading volume, liquidity, and other statistics
- **Search Markets**: Find markets by keyword

### 📝 Order Management
- **Create Orders**: Place buy (Yes) or sell (No) orders with limit/market options
- **Cancel Orders**: Cancel pending orders
- **View Open Orders**: Monitor all active orders
- **Order History**: Access complete order history
- **Get Order Details**: Retrieve information for specific orders

### 💼 Position Tracking
- **View All Positions**: See all your current market positions
- **Get Market Position**: Check your position in a specific market

### 📈 Trade History
- **Personal Trade History**: Access your complete trading history
- **Market Trades**: View all trades for any market

### 🔔 Automated Triggers
- **New Market Alerts**: Trigger workflows when new markets are created
- **Price Change Notifications**: Get notified when prices move by a threshold
- **Order Fill Alerts**: Know immediately when your orders execute
- **Market Resolution**: Trigger when markets resolve

## Installation

### In n8n (Recommended)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-polymarket` in the **Enter npm package name** field
4. Click **Install**

### Manual Installation
```bash
npm install n8n-nodes-polymarket
```

For manual installation, ensure you restart n8n after installation.

## Credentials Setup

Before using this node, you need to configure your Polymarket API credentials:

### Getting Your Credentials

1. **API Key & Secret**:
   - Visit [Polymarket](https://polymarket.com)
   - Navigate to your account settings
   - Go to API section
   - Generate new API credentials

2. **Private Key**:
   - Export your wallet's private key from MetaMask or your wallet provider
   - **Important**: Never share your private key with anyone
   - Remove the `0x` prefix if present

3. **Chain ID**:
   - Use `137` for Polygon Mainnet (production)
   - Use `80001` for Mumbai Testnet (testing)

### Adding Credentials in n8n

1. Open any Polymarket node
2. Click on **Credentials** dropdown
3. Select **Create New**
4. Fill in:
   - **API Key**: Your Polymarket API key
   - **API Secret**: Your Polymarket API secret
   - **Private Key**: Your wallet private key (without 0x)
   - **Chain ID**: Select your network
5. Click **Save**

## Usage Examples

### Example 1: Automated Market Discovery & Trading

Create a workflow that monitors new markets and automatically places bids based on criteria:
````
┌──────────────────────┐
│ Polymarket Trigger   │
│ (New Market)         │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ IF Node              │
│ Filter by volume     │
│ > 10,000             │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ HTTP Request         │
│ Fetch related news   │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ AI Node (optional)   │
│ Analyze sentiment    │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ Polymarket           │
│ Create Order         │
└──────────────────────┘
