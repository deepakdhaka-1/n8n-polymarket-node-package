import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

export class Polymarket implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Polymarket',
    name: 'polymarket',
    icon: 'file:polymarket.png',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Polymarket API - Markets, Events, Trading & Positions',
    defaults: {
      name: 'Polymarket',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'polymarketApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Market', value: 'market', description: 'Market data and discovery' },
          { name: 'Event', value: 'event', description: 'Event groups and categories' },
          { name: 'Order', value: 'order', description: 'Trading operations' },
          { name: 'Position', value: 'position', description: 'User positions and portfolio' },
          { name: 'Trade', value: 'trade', description: 'Trade history' },
          { name: 'Price', value: 'price', description: 'Real-time prices and orderbook' },
        ],
        default: 'market',
      },

      // ==================== MARKET OPERATIONS (Gamma API) ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['market'] } },
        options: [
          { name: 'Get Markets', value: 'getMarkets', action: 'Get markets', description: 'Fetch markets with filters' },
          { name: 'Get Market by ID', value: 'getById', action: 'Get market by ID', description: 'Get specific market by condition ID' },
          { name: 'Get Market by Slug', value: 'getBySlug', action: 'Get market by slug', description: 'Get specific market by slug' },
        ],
        default: 'getMarkets',
      },
      {
        displayName: 'Market ID',
        name: 'marketId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['market'], operation: ['getById'] } },
        description: 'Market condition ID (0x...)',
        placeholder: '0xe3b423dfad8c22ff75c9899c4e8176f628cf4ad4...',
      },
      {
        displayName: 'Slug',
        name: 'slug',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['market'], operation: ['getBySlug'] } },
        description: 'Market slug from URL',
        placeholder: 'will-trump-win-2024',
      },
      {
        displayName: 'Filters',
        name: 'marketFilters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        displayOptions: { show: { resource: ['market'], operation: ['getMarkets'] } },
        options: [
          {
            displayName: 'Limit',
            name: 'limit',
            type: 'number',
            default: 20,
            description: 'Number of markets to return',
          },
          {
            displayName: 'Offset',
            name: 'offset',
            type: 'number',
            default: 0,
            description: 'Number of markets to skip',
          },
          {
            displayName: 'Active Only',
            name: 'active',
            type: 'boolean',
            default: true,
            description: 'Whether to show only active markets',
          },
          {
            displayName: 'Closed',
            name: 'closed',
            type: 'boolean',
            default: false,
            description: 'Whether to include closed markets',
          },
          {
            displayName: 'Archived',
            name: 'archived',
            type: 'boolean',
            default: false,
            description: 'Whether to include archived markets',
          },
          {
            displayName: 'Tag',
            name: 'tag',
            type: 'string',
            default: '',
            description: 'Filter by tag (e.g., politics, sports, crypto)',
            placeholder: 'politics',
          },
        ],
      },

      // ==================== EVENT OPERATIONS (Gamma API) ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['event'] } },
        options: [
          { name: 'Get Events', value: 'getEvents', action: 'Get events', description: 'Get all events' },
          { name: 'Get Event by Slug', value: 'getBySlug', action: 'Get event by slug', description: 'Get specific event' },
        ],
        default: 'getEvents',
      },
      {
        displayName: 'Event Slug',
        name: 'eventSlug',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['event'], operation: ['getBySlug'] } },
        description: 'Event slug',
        placeholder: '2024-presidential-election',
      },
      {
        displayName: 'Filters',
        name: 'eventFilters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        displayOptions: { show: { resource: ['event'], operation: ['getEvents'] } },
        options: [
          {
            displayName: 'Limit',
            name: 'limit',
            type: 'number',
            default: 20,
          },
          {
            displayName: 'Offset',
            name: 'offset',
            type: 'number',
            default: 0,
          },
          {
            displayName: 'Active Only',
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            displayName: 'Closed',
            name: 'closed',
            type: 'boolean',
            default: false,
          },
        ],
      },

      // ==================== ORDER OPERATIONS (CLOB API) ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['order'] } },
        options: [
          { name: 'Create Order', value: 'create', action: 'Create order' },
          { name: 'Cancel Order', value: 'cancel', action: 'Cancel order' },
          { name: 'Cancel All Orders', value: 'cancelAll', action: 'Cancel all orders' },
          { name: 'Get Orders', value: 'getOrders', action: 'Get orders' },
          { name: 'Get Order by ID', value: 'getById', action: 'Get order by ID' },
        ],
        default: 'create',
      },
      {
        displayName: 'Token ID',
        name: 'tokenId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['order'], operation: ['create'] } },
        description: 'Outcome token ID from market clobTokenIds array',
        placeholder: '53135072462907880191400140706440867753044989936304433583131786753949599718775',
      },
      {
        displayName: 'Side',
        name: 'side',
        type: 'options',
        options: [
          { name: 'Buy', value: 'BUY', description: 'Buy tokens (bet Yes/long)' },
          { name: 'Sell', value: 'SELL', description: 'Sell tokens (bet No/short)' },
        ],
        default: 'BUY',
        required: true,
        displayOptions: { show: { resource: ['order'], operation: ['create'] } },
      },
      {
        displayName: 'Price',
        name: 'price',
        type: 'number',
        default: 0.5,
        required: true,
        displayOptions: { show: { resource: ['order'], operation: ['create'] } },
        description: 'Price per share (0.01 to 0.99)',
        typeOptions: { minValue: 0.01, maxValue: 0.99, numberPrecision: 4 },
      },
      {
        displayName: 'Size',
        name: 'size',
        type: 'number',
        default: 10,
        required: true,
        displayOptions: { show: { resource: ['order'], operation: ['create'] } },
        description: 'Number of shares to trade',
        typeOptions: { minValue: 0.01, numberPrecision: 2 },
      },
      {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['order'], operation: ['cancel', 'getById'] } },
        description: 'Order ID to cancel or retrieve',
      },
      {
        displayName: 'Market',
        name: 'market',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['order'], operation: ['cancelAll'] } },
        description: 'Market condition ID (leave empty to cancel all orders across all markets)',
      },

      // ==================== POSITION OPERATIONS (Data API) ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['position'] } },
        options: [
          { name: 'Get All Positions', value: 'getAll', action: 'Get all positions' },
          { name: 'Get Position by Market', value: 'getByMarket', action: 'Get position by market' },
        ],
        default: 'getAll',
      },
      {
        displayName: 'Condition ID',
        name: 'conditionId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['position'], operation: ['getByMarket'] } },
        description: 'Market condition ID',
      },

      // ==================== TRADE OPERATIONS (CLOB API) ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['trade'] } },
        options: [
          { name: 'Get Trades', value: 'getTrades', action: 'Get trades' },
        ],
        default: 'getTrades',
      },
      {
        displayName: 'Filters',
        name: 'tradeFilters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        displayOptions: { show: { resource: ['trade'] } },
        options: [
          {
            displayName: 'Token ID',
            name: 'tokenId',
            type: 'string',
            default: '',
            description: 'Filter by token ID',
          },
          {
            displayName: 'Limit',
            name: 'limit',
            type: 'number',
            default: 100,
          },
        ],
      },

      // ==================== PRICE OPERATIONS (CLOB API) ====================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['price'] } },
        options: [
          { name: 'Get Price', value: 'getPrice', action: 'Get price' },
          { name: 'Get Orderbook', value: 'getOrderbook', action: 'Get orderbook' },
        ],
        default: 'getPrice',
      },
      {
        displayName: 'Token ID',
        name: 'tokenId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['price'] } },
        description: 'Token ID to get price/orderbook for',
      },
      {
        displayName: 'Side',
        name: 'side',
        type: 'options',
        options: [
          { name: 'Buy', value: 'BUY' },
          { name: 'Sell', value: 'SELL' },
        ],
        default: 'BUY',
        displayOptions: { show: { resource: ['price'], operation: ['getPrice'] } },
        description: 'Which side to get price for',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('polymarketApi');

    // Dynamic import axios
    const axios = (await import('axios')).default;
    
    // API Endpoints
    const GAMMA_API = 'https://gamma-api.polymarket.com';
    const CLOB_API = 'https://clob.polymarket.com';
    const DATA_API = 'https://data-api.polymarket.com';
    
    // Create wallet from private key
    const privateKey = credentials.privateKey as string;
    const wallet = new ethers.Wallet(
      privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
    );
    const address = wallet.address;
    
    // L1 Authentication Helper (for CLOB API)
    const createL1Headers = (method: string, requestPath: string, body?: any): any => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const bodyStr = body ? JSON.stringify(body) : '';
      const message = timestamp + method + requestPath + bodyStr;
      
      const signature = crypto
        .createHmac('sha256', Buffer.from(credentials.apiSecret as string, 'base64'))
        .update(message)
        .digest('base64');

      return {
        'POLY-ADDRESS': address,
        'POLY-SIGNATURE': signature,
        'POLY-TIMESTAMP': timestamp,
        'POLY-API-KEY': credentials.apiKey as string,
        'POLY-PASSPHRASE': credentials.apiPassphrase as string,
        'Content-Type': 'application/json',
      };
    };

    // L2 Authentication Helper (for Order Signing)
    const signOrder = async (orderData: any): Promise<string> => {
      const domain = {
        name: 'Polymarket CTF Exchange',
        version: '1',
        chainId: credentials.chainId as number,
        verifyingContract: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E',
      };

      const types = {
        Order: [
          { name: 'maker', type: 'address' },
          { name: 'taker', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'makerAmount', type: 'uint256' },
          { name: 'takerAmount', type: 'uint256' },
          { name: 'side', type: 'uint8' },
          { name: 'expiration', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'feeRateBps', type: 'uint256' },
          { name: 'signatureType', type: 'uint8' },
        ],
      };

      return await wallet.signTypedData(domain, types, orderData);
    };
    
    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;
        let responseData: any;

        // ==================== MARKET OPERATIONS (Gamma API - No Auth) ====================
        if (resource === 'market') {
          if (operation === 'getMarkets') {
            const filters = this.getNodeParameter('marketFilters', i, {}) as any;
            const params: any = {
              limit: filters.limit || 20,
              offset: filters.offset || 0,
            };
            if (filters.active !== undefined) params.active = filters.active;
            if (filters.closed !== undefined) params.closed = filters.closed;
            if (filters.archived !== undefined) params.archived = filters.archived;
            if (filters.tag) params.tag = filters.tag;

            const response = await axios.get(`${GAMMA_API}/markets`, { params });
            responseData = response.data;
            
          } else if (operation === 'getById') {
            const marketId = this.getNodeParameter('marketId', i) as string;
            const response = await axios.get(`${GAMMA_API}/markets/${marketId}`);
            responseData = response.data;
            
          } else if (operation === 'getBySlug') {
            const slug = this.getNodeParameter('slug', i) as string;
            const response = await axios.get(`${GAMMA_API}/markets/${slug}`);
            responseData = response.data;
          }
        }

        // ==================== EVENT OPERATIONS (Gamma API - No Auth) ====================
        else if (resource === 'event') {
          if (operation === 'getEvents') {
            const filters = this.getNodeParameter('eventFilters', i, {}) as any;
            const params: any = {
              limit: filters.limit || 20,
              offset: filters.offset || 0,
            };
            if (filters.active !== undefined) params.active = filters.active;
            if (filters.closed !== undefined) params.closed = filters.closed;

            const response = await axios.get(`${GAMMA_API}/events`, { params });
            responseData = response.data;
            
          } else if (operation === 'getBySlug') {
            const eventSlug = this.getNodeParameter('eventSlug', i) as string;
            const response = await axios.get(`${GAMMA_API}/events/${eventSlug}`);
            responseData = response.data;
          }
        }

        // ==================== ORDER OPERATIONS (CLOB API - L1 + L2 Auth) ====================
        else if (resource === 'order') {
          if (operation === 'create') {
            const tokenId = this.getNodeParameter('tokenId', i) as string;
            const side = this.getNodeParameter('side', i) as string;
            const price = this.getNodeParameter('price', i) as number;
            const size = this.getNodeParameter('size', i) as number;

            // Prepare order
            const nonce = Date.now();
            const expiration = 0; // GTC
            
            const orderPayload = {
              maker: address,
              taker: '0x0000000000000000000000000000000000000000',
              tokenId: tokenId,
              makerAmount: (size * 1000000).toString(), // Convert to wei (6 decimals)
              takerAmount: ((side === 'BUY' ? size * price : size * (1 - price)) * 1000000).toString(),
              side: side === 'BUY' ? 0 : 1,
              expiration,
              nonce,
              feeRateBps: 0,
              signatureType: 1,
            };

            // L2 Sign the order
            const signature = await signOrder(orderPayload);

            // L1 Auth headers
            const headers = createL1Headers('POST', '/order', { ...orderPayload, signature });

            // Submit order
            const response = await axios.post(
              `${CLOB_API}/order`,
              { ...orderPayload, signature },
              { headers }
            );
            responseData = response.data;
            
          } else if (operation === 'cancel') {
            const orderId = this.getNodeParameter('orderId', i) as string;
            const body = { orderID: orderId };
            const headers = createL1Headers('DELETE', '/order', body);
            
            const response = await axios.delete(`${CLOB_API}/order`, {
              headers,
              data: body,
            });
            responseData = response.data || { success: true, orderId };
            
          } else if (operation === 'cancelAll') {
            const market = this.getNodeParameter('market', i, '') as string;
            const body = market ? { market } : {};
            const headers = createL1Headers('DELETE', '/orders', body);
            
            const response = await axios.delete(`${CLOB_API}/orders`, {
              headers,
              data: body,
            });
            responseData = response.data;
            
          } else if (operation === 'getOrders') {
            const headers = createL1Headers('GET', '/orders');
            const response = await axios.get(`${CLOB_API}/orders`, { headers });
            responseData = response.data;
            
          } else if (operation === 'getById') {
            const orderId = this.getNodeParameter('orderId', i) as string;
            const headers = createL1Headers('GET', `/order/${orderId}`);
            const response = await axios.get(`${CLOB_API}/order/${orderId}`, { headers });
            responseData = response.data;
          }
        }

        // ==================== POSITION OPERATIONS (Data API - No Auth) ====================
        else if (resource === 'position') {
          if (operation === 'getAll') {
            const response = await axios.get(`${DATA_API}/positions`, {
              params: { user: address },
            });
            responseData = response.data;
            
          } else if (operation === 'getByMarket') {
            const conditionId = this.getNodeParameter('conditionId', i) as string;
            const response = await axios.get(`${DATA_API}/positions`, {
              params: { user: address, condition_id: conditionId },
            });
            responseData = response.data;
          }
        }

        // ==================== TRADE OPERATIONS (CLOB API - Partial Auth) ====================
        else if (resource === 'trade') {
          const filters = this.getNodeParameter('tradeFilters', i, {}) as any;
          const params: any = {
            maker: address,
            limit: filters.limit || 100,
          };
          if (filters.tokenId) params.token_id = filters.tokenId;
          
          const response = await axios.get(`${CLOB_API}/trades`, { params });
          responseData = response.data;
        }

        // ==================== PRICE OPERATIONS (CLOB API - No Auth) ====================
        else if (resource === 'price') {
          const tokenId = this.getNodeParameter('tokenId', i) as string;
          
          if (operation === 'getPrice') {
            const side = this.getNodeParameter('side', i) as string;
            const response = await axios.get(`${CLOB_API}/price`, {
              params: { token_id: tokenId, side },
            });
            responseData = response.data;
            
          } else if (operation === 'getOrderbook') {
            const response = await axios.get(`${CLOB_API}/book`, {
              params: { token_id: tokenId },
            });
            responseData = response.data;
          }
        }

        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData),
          { itemData: { item: i } }
        );
        returnData.push(...executionData);

      } catch (error: any) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
              details: error.response?.data || {},
              status: error.response?.status,
              url: error.config?.url,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeOperationError(
          this.getNode(),
          `Polymarket Error: ${error.response?.data?.message || error.message}`,
          { itemIndex: i, description: `URL: ${error.config?.url}` }
        );
      }
    }

    return [returnData];
  }
}
