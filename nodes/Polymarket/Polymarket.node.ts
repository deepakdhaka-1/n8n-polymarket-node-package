import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import axios, { AxiosRequestConfig } from 'axios';
import { ethers } from 'ethers';

export class Polymarket implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Polymarket',
    name: 'polymarket',
    icon: 'file:polymarket.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Polymarket API for trading and market data',
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
          {
            name: 'Market',
            value: 'market',
          },
          {
            name: 'Order',
            value: 'order',
          },
          {
            name: 'Position',
            value: 'position',
          },
          {
            name: 'Trade',
            value: 'trade',
          },
        ],
        default: 'market',
        description: 'The resource to operate on',
      },

      // ============================================
      //               Market Operations
      // ============================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['market'],
          },
        },
        options: [
          {
            name: 'Get All Markets',
            value: 'getAll',
            description: 'Retrieve all available markets',
            action: 'Get all markets',
          },
          {
            name: 'Get Market',
            value: 'get',
            description: 'Get details for a specific market',
            action: 'Get a market',
          },
          {
            name: 'Get Market Stats',
            value: 'getStats',
            description: 'Get statistics for a specific market',
            action: 'Get market stats',
          },
          {
            name: 'Search Markets',
            value: 'search',
            description: 'Search for markets by keyword',
            action: 'Search markets',
          },
        ],
        default: 'getAll',
      },
      {
        displayName: 'Market ID',
        name: 'marketId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['market'],
            operation: ['get', 'getStats'],
          },
        },
        description: 'The unique identifier of the market',
      },
      {
        displayName: 'Search Query',
        name: 'searchQuery',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['market'],
            operation: ['search'],
          },
        },
        description: 'Search term to find markets',
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 50,
        displayOptions: {
          show: {
            resource: ['market'],
            operation: ['getAll', 'search'],
          },
        },
        description: 'Maximum number of results to return',
        typeOptions: {
          minValue: 1,
          maxValue: 1000,
        },
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: {
            resource: ['market'],
            operation: ['getAll'],
          },
        },
        options: [
          {
            displayName: 'Active Only',
            name: 'active',
            type: 'boolean',
            default: true,
            description: 'Whether to filter for active markets only',
          },
          {
            displayName: 'Include Closed',
            name: 'closed',
            type: 'boolean',
            default: false,
            description: 'Whether to include closed markets',
          },
          {
            displayName: 'Offset',
            name: 'offset',
            type: 'number',
            default: 0,
            description: 'Number of results to skip (for pagination)',
          },
          {
            displayName: 'Sort By',
            name: 'sortBy',
            type: 'options',
            options: [
              { name: 'Volume', value: 'volume' },
              { name: 'Liquidity', value: 'liquidity' },
              { name: 'Created Date', value: 'created' },
            ],
            default: 'volume',
            description: 'Field to sort results by',
          },
        ],
      },

      // ============================================
      //               Order Operations
      // ============================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['order'],
          },
        },
        options: [
          {
            name: 'Create Order',
            value: 'create',
            description: 'Place a new buy or sell order',
            action: 'Create an order',
          },
          {
            name: 'Cancel Order',
            value: 'cancel',
            description: 'Cancel an existing order',
            action: 'Cancel an order',
          },
          {
            name: 'Get Open Orders',
            value: 'getOpen',
            description: 'Get all your open orders',
            action: 'Get open orders',
          },
          {
            name: 'Get Order History',
            value: 'getHistory',
            description: 'Get your complete order history',
            action: 'Get order history',
          },
          {
            name: 'Get Order',
            value: 'get',
            description: 'Get details for a specific order',
            action: 'Get an order',
          },
        ],
        default: 'create',
      },
      {
        displayName: 'Token ID',
        name: 'tokenId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['create'],
          },
        },
        description: 'The outcome token ID to trade',
      },
      {
        displayName: 'Side',
        name: 'side',
        type: 'options',
        options: [
          {
            name: 'Buy (Yes)',
            value: 'BUY',
            description: 'Buy Yes tokens (bullish)',
          },
          {
            name: 'Sell (No)',
            value: 'SELL',
            description: 'Sell/Short No tokens (bearish)',
          },
        ],
        default: 'BUY',
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['create'],
          },
        },
        description: 'Whether to buy Yes or sell No',
      },
      {
        displayName: 'Price',
        name: 'price',
        type: 'number',
        default: 0.5,
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['create'],
          },
        },
        description: 'Price per share (between 0 and 1)',
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
        default: 10,
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['create'],
          },
        },
        description: 'Number of shares to trade',
        typeOptions: {
          minValue: 1,
        },
      },
      {
        displayName: 'Order Type',
        name: 'orderType',
        type: 'options',
        options: [
          { name: 'Limit Order', value: 'LIMIT' },
          { name: 'Market Order', value: 'MARKET' },
        ],
        default: 'LIMIT',
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['create'],
          },
        },
        description: 'Type of order to place',
      },
      {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['cancel', 'get'],
          },
        },
        description: 'The unique identifier of the order',
      },

      // ============================================
      //               Position Operations
      // ============================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['position'],
          },
        },
        options: [
          {
            name: 'Get All Positions',
            value: 'getAll',
            description: 'Get all your current positions',
            action: 'Get all positions',
          },
          {
            name: 'Get Position',
            value: 'get',
            description: 'Get position for a specific market',
            action: 'Get a position',
          },
        ],
        default: 'getAll',
      },
      {
        displayName: 'Market ID',
        name: 'marketId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['position'],
            operation: ['get'],
          },
        },
        description: 'The unique identifier of the market',
      },

      // ============================================
      //               Trade Operations
      // ============================================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['trade'],
          },
        },
        options: [
          {
            name: 'Get Trade History',
            value: 'getHistory',
            description: 'Get your complete trade history',
            action: 'Get trade history',
          },
          {
            name: 'Get Market Trades',
            value: 'getMarketTrades',
            description: 'Get all trades for a specific market',
            action: 'Get market trades',
          },
        ],
        default: 'getHistory',
      },
      {
        displayName: 'Market ID',
        name: 'marketId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['trade'],
            operation: ['getMarketTrades'],
          },
        },
        description: 'The unique identifier of the market',
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 100,
        displayOptions: {
          show: {
            resource: ['trade'],
          },
        },
        description: 'Maximum number of trades to return',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('polymarketApi');
    
    // Base URL for Polymarket CLOB API
    const baseUrl = 'https://clob.polymarket.com';
    
    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;

        let responseData: any;
        const config: AxiosRequestConfig = {
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
            'X-Api-Secret': credentials.apiSecret as string,
            'Content-Type': 'application/json',
          },
        };

        // ============================================
        //               Market Operations
        // ============================================
        if (resource === 'market') {
          if (operation === 'getAll') {
            const limit = this.getNodeParameter('limit', i) as number;
            const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
            
            const params: any = { limit };
            if (additionalFields.active !== undefined) {
              params.active = additionalFields.active;
            }
            if (additionalFields.closed !== undefined) {
              params.closed = additionalFields.closed;
            }
            if (additionalFields.offset) {
              params.offset = additionalFields.offset;
            }
            if (additionalFields.sortBy) {
              params.sort_by = additionalFields.sortBy;
            }

            const response = await axios.get(`${baseUrl}/markets`, {
              ...config,
              params,
            });
            responseData = response.data;
            
          } else if (operation === 'get') {
            const marketId = this.getNodeParameter('marketId', i) as string;
            const response = await axios.get(`${baseUrl}/markets/${marketId}`, config);
            responseData = response.data;
            
          } else if (operation === 'getStats') {
            const marketId = this.getNodeParameter('marketId', i) as string;
            const response = await axios.get(`${baseUrl}/markets/${marketId}/stats`, config);
            responseData = response.data;
            
          } else if (operation === 'search') {
            const searchQuery = this.getNodeParameter('searchQuery', i) as string;
            const limit = this.getNodeParameter('limit', i) as number;
            const response = await axios.get(`${baseUrl}/markets/search`, {
              ...config,
              params: { q: searchQuery, limit },
            });
            responseData = response.data;
          }
        }

        // ============================================
        //               Order Operations
        // ============================================
        else if (resource === 'order') {
          if (operation === 'create') {
            const tokenId = this.getNodeParameter('tokenId', i) as string;
            const side = this.getNodeParameter('side', i) as string;
            const price = this.getNodeParameter('price', i) as number;
            const size = this.getNodeParameter('size', i) as number;
            const orderType = this.getNodeParameter('orderType', i) as string;

            // Create wallet from private key
            const privateKey = credentials.privateKey as string;
            const wallet = new ethers.Wallet(
              privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
            );
            
            const timestamp = Date.now();
            const nonce = Math.floor(Math.random() * 1000000);
            
            // Prepare order data
            const orderData = {
              token_id: tokenId,
              side,
              price: price.toString(),
              size: size.toString(),
              type: orderType,
              timestamp,
              nonce,
              maker: wallet.address,
            };

            // Sign the order
            const message = JSON.stringify(orderData);
            const signature = await wallet.signMessage(message);

            // Submit order
            const response = await axios.post(
              `${baseUrl}/orders`,
              {
                ...orderData,
                signature,
              },
              config
            );
            responseData = response.data;
            
          } else if (operation === 'cancel') {
            const orderId = this.getNodeParameter('orderId', i) as string;
            const response = await axios.delete(`${baseUrl}/orders/${orderId}`, config);
            responseData = response.data || { success: true, orderId };
            
          } else if (operation === 'getOpen') {
            const response = await axios.get(`${baseUrl}/orders`, config);
            responseData = response.data;
            
          } else if (operation === 'getHistory') {
            const response = await axios.get(`${baseUrl}/orders/history`, config);
            responseData = response.data;
            
          } else if (operation === 'get') {
            const orderId = this.getNodeParameter('orderId', i) as string;
            const response = await axios.get(`${baseUrl}/orders/${orderId}`, config);
            responseData = response.data;
          }
        }

        // ============================================
        //               Position Operations
        // ============================================
        else if (resource === 'position') {
          if (operation === 'getAll') {
            const response = await axios.get(`${baseUrl}/positions`, config);
            responseData = response.data;
            
          } else if (operation === 'get') {
            const marketId = this.getNodeParameter('marketId', i) as string;
            const response = await axios.get(`${baseUrl}/positions/${marketId}`, config);
            responseData = response.data;
          }
        }

        // ============================================
        //               Trade Operations
        // ============================================
        else if (resource === 'trade') {
          const limit = this.getNodeParameter('limit', i, 100) as number;
          
          if (operation === 'getHistory') {
            const response = await axios.get(`${baseUrl}/trades`, {
              ...config,
              params: { limit },
            });
            responseData = response.data;
            
          } else if (operation === 'getMarketTrades') {
            const marketId = this.getNodeParameter('marketId', i) as string;
            const response = await axios.get(`${baseUrl}/markets/${marketId}/trades`, {
              ...config,
              params: { limit },
            });
            responseData = response.data;
          }
        }

        // Construct execution data
        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData),
          { itemData: { item: i } }
        );
        returnData.push(...executionData);

      } catch (error: any) {
        if (this.continueOnFail()) {
          const errorData = {
            json: {
              error: error.message,
              errorDetails: error.response?.data || {},
              statusCode: error.response?.status,
            },
            pairedItem: { item: i },
          };
          returnData.push(errorData);
          continue;
        }
        
        const errorMessage = error.response?.data?.message || error.message;
        throw new NodeOperationError(
          this.getNode(),
          `Polymarket API Error: ${errorMessage}`,
          { itemIndex: i }
        );
      }
    }

    return [returnData];
  }
}
