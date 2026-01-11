import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { Wallet } from 'ethers';
import { ClobClient, Side, OrderType } from '@polymarket/clob-client';
import { BuilderConfig, BuilderApiKeyCreds } from '@polymarket/builder-signing-sdk';

export class Polymarket implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Polymarket',
    name: 'polymarket',
    icon: 'file:polymarket.png',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Polymarket - Market Discovery & Trading',
    defaults: {
      name: 'Polymarket',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'polymarketApi',
        required: false,
        displayOptions: {
          show: {
            operation: ['marketInfo'],
          },
        },
      },
      {
        name: 'polymarketApi',
        required: true,
        displayOptions: {
          show: {
            operation: ['trading'],
          },
        },
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Market Info (Gamma API)',
            value: 'marketInfo',
            description: 'Discover and fetch market data',
          },
          {
            name: 'Trading (CLOB API)',
            value: 'trading',
            description: 'Create orders, cancel orders, manage positions',
          },
          {
            name: 'User Data (Data API) - Coming Soon',
            value: 'userData',
            description: '🚧 In Development',
          },
        ],
        default: 'marketInfo',
      },

      // ==================== COMING SOON ====================
      {
        displayName: 'Feature Under Development',
        name: 'comingSoonMessage',
        type: 'notice',
        default: '🚧 Coming Soon',
        displayOptions: {
          show: {
            operation: ['userData'],
          },
        },
      },

      // ==================== MARKET INFO ====================
      {
        displayName: 'Fetch Method',
        name: 'fetchMethod',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['marketInfo'],
          },
        },
        options: [
          { name: 'By Slug', value: 'bySlug' },
          { name: 'By Tags', value: 'byTags' },
          { name: 'Via Events Endpoint', value: 'viaEvents' },
          { name: 'Search', value: 'search' },
          { name: 'Get Tags List', value: 'getTagsList' },
        ],
        default: 'viaEvents',
      },

      {
        displayName: 'Resource Type',
        name: 'resourceType',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['marketInfo'],
            fetchMethod: ['bySlug', 'byTags', 'viaEvents'],
          },
        },
        options: [
          { name: 'Event', value: 'event' },
          { name: 'Market', value: 'market' },
        ],
        default: 'event',
      },

      {
        displayName: 'Slug',
        name: 'slug',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['marketInfo'],
            fetchMethod: ['bySlug'],
          },
        },
        default: '',
        required: true,
      },

      {
        displayName: 'Tag ID',
        name: 'tagId',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['marketInfo'],
            fetchMethod: ['byTags'],
          },
        },
        default: '',
        required: true,
      },

      {
        displayName: 'Include Related Tags',
        name: 'relatedTags',
        type: 'boolean',
        displayOptions: {
          show: {
            operation: ['marketInfo'],
            fetchMethod: ['byTags'],
          },
        },
        default: false,
      },

      {
        displayName: 'Search Query',
        name: 'searchQuery',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['marketInfo'],
            fetchMethod: ['search'],
          },
        },
        default: '',
        required: true,
      },

      {
        displayName: 'Filters',
        name: 'filters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        displayOptions: {
          show: {
            operation: ['marketInfo'],
            fetchMethod: ['byTags', 'viaEvents', 'search'],
          },
        },
        options: [
          { displayName: 'Active', name: 'active', type: 'boolean', default: true },
          { displayName: 'Closed', name: 'closed', type: 'boolean', default: false },
          { displayName: 'Archived', name: 'archived', type: 'boolean', default: false },
          { displayName: 'Limit', name: 'limit', type: 'number', default: 50 },
          { displayName: 'Offset', name: 'offset', type: 'number', default: 0 },
          {
            displayName: 'Order By',
            name: 'order',
            type: 'options',
            options: [
              { name: 'ID', value: 'id' },
              { name: 'Created At', value: 'created_at' },
              { name: 'Volume', value: 'volume' },
              { name: 'Liquidity', value: 'liquidity' },
            ],
            default: 'id',
          },
          {
            displayName: 'Sort Direction',
            name: 'ascending',
            type: 'options',
            options: [
              { name: 'Ascending', value: true },
              { name: 'Descending', value: false },
            ],
            default: false,
          },
        ],
      },

      {
        displayName: 'Options',
        name: 'tagsOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
          show: {
            operation: ['marketInfo'],
            fetchMethod: ['getTagsList'],
          },
        },
        options: [
          { displayName: 'Limit', name: 'limit', type: 'number', default: 100 },
          { displayName: 'Offset', name: 'offset', type: 'number', default: 0 },
        ],
      },

      // ==================== TRADING ====================
      {
        displayName: 'Trading Action',
        name: 'tradingAction',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['trading'],
          },
        },
        options: [
          { name: 'Create Order', value: 'createOrder' },
          { name: 'Cancel Order', value: 'cancelOrder' },
          { name: 'Cancel All Orders', value: 'cancelAllOrders' },
          { name: 'Get Open Orders', value: 'getOpenOrders' },
          { name: 'Get Order', value: 'getOrder' },
          { name: 'Get Orderbook', value: 'getOrderbook' },
          { name: 'Get Price', value: 'getPrice' },
        ],
        default: 'createOrder',
      },

      // CREATE ORDER
      {
        displayName: 'Token ID',
        name: 'tokenId',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['trading'],
            tradingAction: ['createOrder', 'getOrderbook', 'getPrice'],
          },
        },
        default: '',
        required: true,
      },

      {
        displayName: 'Side',
        name: 'side',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['trading'],
            tradingAction: ['createOrder', 'getPrice'],
          },
        },
        options: [
          { name: 'Buy', value: 'BUY' },
          { name: 'Sell', value: 'SELL' },
        ],
        default: 'BUY',
        required: true,
      },

      {
        displayName: 'Price',
        name: 'price',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['trading'],
            tradingAction: ['createOrder'],
          },
        },
        default: 0.5,
        required: true,
        typeOptions: {
          minValue: 0.01,
          maxValue: 0.99,
          numberPrecision: 4,
        },
      },

      {
        displayName: 'Size',
        name: 'size',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['trading'],
            tradingAction: ['createOrder'],
          },
        },
        default: 10,
        required: true,
        typeOptions: {
          minValue: 0.01,
          numberPrecision: 2,
        },
      },

      {
        displayName: 'Order Type',
        name: 'orderType',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['trading'],
            tradingAction: ['createOrder'],
          },
        },
        options: [
          { name: 'GTC (Good Till Cancelled)', value: 'GTC' },
          { name: 'FOK (Fill or Kill)', value: 'FOK' },
          { name: 'GTT (Good Till Time)', value: 'GTT' },
        ],
        default: 'GTC',
      },

      {
        displayName: 'Expiration (seconds)',
        name: 'expiration',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['trading'],
            tradingAction: ['createOrder'],
            orderType: ['GTT'],
          },
        },
        default: 3600,
      },

      // CANCEL ORDER
      {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['trading'],
            tradingAction: ['cancelOrder', 'getOrder'],
          },
        },
        default: '',
        required: true,
      },

      // CANCEL ALL
      {
        displayName: 'Market ID',
        name: 'marketId',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['trading'],
            tradingAction: ['cancelAllOrders'],
          },
        },
        default: '',
        placeholder: 'Leave empty to cancel all orders',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const axios = (await import('axios')).default;
    const GAMMA_API = 'https://gamma-api.polymarket.com';
    
    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;
        let responseData: any;

        // ==================== COMING SOON ====================
        if (operation === 'userData') {
          throw new NodeOperationError(
            this.getNode(),
            '🚧 User Data API - Coming Soon!',
            { itemIndex: i }
          );
        }

        // ==================== MARKET INFO ====================
        if (operation === 'marketInfo') {
          const fetchMethod = this.getNodeParameter('fetchMethod', i) as string;

          if (fetchMethod === 'getTagsList') {
            const options = this.getNodeParameter('tagsOptions', i, {}) as any;
            const params: any = {};
            if (options.limit) params.limit = options.limit;
            if (options.offset) params.offset = options.offset;
            const response = await axios.get(`${GAMMA_API}/tags`, { params });
            responseData = response.data;
          }

          else if (fetchMethod === 'search') {
            const searchQuery = this.getNodeParameter('searchQuery', i) as string;
            const filters = this.getNodeParameter('filters', i, {}) as any;
            const params: any = { query: searchQuery };
            if (filters.limit) params.limit = filters.limit;
            if (filters.offset) params.offset = filters.offset;
            const response = await axios.get(`${GAMMA_API}/search`, { params });
            responseData = response.data;
          }

          else if (fetchMethod === 'bySlug') {
            const resourceType = this.getNodeParameter('resourceType', i) as string;
            const slug = this.getNodeParameter('slug', i) as string;
            const endpoint = resourceType === 'event' ? `/events/slug/${slug}` : `/markets/${slug}`;
            const response = await axios.get(`${GAMMA_API}${endpoint}`);
            responseData = response.data;
          }

          else if (fetchMethod === 'byTags') {
            const resourceType = this.getNodeParameter('resourceType', i) as string;
            const tagId = this.getNodeParameter('tagId', i) as string;
            const relatedTags = this.getNodeParameter('relatedTags', i) as boolean;
            const filters = this.getNodeParameter('filters', i, {}) as any;

            const params: any = { tag_id: tagId };
            params.active = filters.active !== undefined ? filters.active : true;
            params.closed = filters.closed !== undefined ? filters.closed : false;
            params.archived = filters.archived !== undefined ? filters.archived : false;
            if (filters.limit) params.limit = filters.limit;
            if (filters.offset) params.offset = filters.offset;
            if (filters.order) params.order = filters.order;
            if (filters.ascending !== undefined) params.ascending = filters.ascending;
            if (relatedTags) params.related_tags = true;

            const endpoint = resourceType === 'event' ? '/events' : '/markets';
            const response = await axios.get(`${GAMMA_API}${endpoint}`, { params });
            responseData = response.data;
          }

          else if (fetchMethod === 'viaEvents') {
            const resourceType = this.getNodeParameter('resourceType', i) as string;
            const filters = this.getNodeParameter('filters', i, {}) as any;

            const params: any = {};
            params.active = filters.active !== undefined ? filters.active : true;
            params.closed = filters.closed !== undefined ? filters.closed : false;
            params.archived = filters.archived !== undefined ? filters.archived : false;
            if (filters.limit) params.limit = filters.limit;
            if (filters.offset) params.offset = filters.offset;
            if (filters.order) params.order = filters.order;
            if (filters.ascending !== undefined) params.ascending = filters.ascending;

            const endpoint = resourceType === 'event' ? '/events' : '/markets';
            const response = await axios.get(`${GAMMA_API}${endpoint}`, { params });
            responseData = response.data;
          }
        }

        // ==================== TRADING (CLOB Client) ====================
        else if (operation === 'trading') {
          const credentials = await this.getCredentials('polymarketApi');
          const tradingAction = this.getNodeParameter('tradingAction', i) as string;

          // 1. Builder credentials
          const builderCreds = new BuilderApiKeyCreds({
            key: credentials.builderApiKey as string,
            secret: credentials.builderApiSecret as string,
            passphrase: credentials.builderApiPassphrase as string,
          });

          // 2. Builder config
          const builderConfig = new BuilderConfig({
            localBuilderCreds: builderCreds,
          });

          // 3. Create signer (ethers v5)
          const privateKey = credentials.privateKey as string;
          const signer = new Wallet(
            privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
          );

          const proxyWalletAddress = credentials.proxyWalletAddress as string;
          const chainId = credentials.chainId as number;

          // 4. Create or derive user API credentials
          const tempClient = new ClobClient(
            'https://clob.polymarket.com',
            chainId,
            signer
          );
          const apiCreds = await tempClient.createOrDeriveApiKey();

          // 5. Create authenticated ClobClient with builder config
          const clobClient = new ClobClient(
            'https://clob.polymarket.com',
            chainId,
            signer,
            apiCreds,
            2, // signatureType: 2 for Safe/Proxy wallet
            proxyWalletAddress,
            undefined,
            false,
            builderConfig
          );

          // CREATE ORDER
          if (tradingAction === 'createOrder') {
            const tokenId = this.getNodeParameter('tokenId', i) as string;
            const side = this.getNodeParameter('side', i) as string;
            const price = this.getNodeParameter('price', i) as number;
            const size = this.getNodeParameter('size', i) as number;
            const orderType = this.getNodeParameter('orderType', i, 'GTC') as string;

            let expiration = 0;
            if (orderType === 'GTT') {
              const expirationSeconds = this.getNodeParameter('expiration', i) as number;
              expiration = Math.floor(Date.now() / 1000) + expirationSeconds;
            }

            const orderArgs = {
              tokenID: tokenId,
              price,
              size,
              side: side === 'BUY' ? Side.BUY : Side.SELL,
              feeRateBps: 0,
              nonce: Date.now(),
              expiration,
            };

            const signedOrder = await clobClient.createOrder(orderArgs);
            
            let orderTypeEnum: OrderType;
            if (orderType === 'FOK') {
              orderTypeEnum = OrderType.FOK;
            } else if (orderType === 'GTT') {
              orderTypeEnum = OrderType.GTT;
            } else {
              orderTypeEnum = OrderType.GTC;
            }

            responseData = await clobClient.postOrder(signedOrder, orderTypeEnum);
          }

          // CANCEL ORDER
          else if (tradingAction === 'cancelOrder') {
            const orderId = this.getNodeParameter('orderId', i) as string;
            responseData = await clobClient.cancelOrder(orderId);
          }

          // CANCEL ALL ORDERS
          else if (tradingAction === 'cancelAllOrders') {
            const marketId = this.getNodeParameter('marketId', i, '') as string;
            responseData = await clobClient.cancelOrders(marketId ? { market: marketId } : undefined);
          }

          // GET OPEN ORDERS
          else if (tradingAction === 'getOpenOrders') {
            responseData = await clobClient.getOrders();
          }

          // GET ORDER
          else if (tradingAction === 'getOrder') {
            const orderId = this.getNodeParameter('orderId', i) as string;
            responseData = await clobClient.getOrder(orderId);
          }

          // GET ORDERBOOK
          else if (tradingAction === 'getOrderbook') {
            const tokenId = this.getNodeParameter('tokenId', i) as string;
            responseData = await clobClient.getOrderBook(tokenId);
          }

          // GET PRICE
          else if (tradingAction === 'getPrice') {
            const tokenId = this.getNodeParameter('tokenId', i) as string;
            const side = this.getNodeParameter('side', i) as string;
            responseData = await clobClient.getPrice(tokenId, side);
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
              details: error.response?.data || error,
              status: error.response?.status,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeOperationError(
          this.getNode(),
          `Polymarket Error: ${error.message}`,
          { itemIndex: i }
        );
      }
    }

    return [returnData];
  }
}
