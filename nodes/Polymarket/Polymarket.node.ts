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
    icon: 'file:polymarket.png',
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
            operation: ['get'],
          },
        },
        description: 'The unique identifier of the market (conditionId)',
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
          maxValue: 100,
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
            displayName: 'Closed',
            name: 'closed',
            type: 'boolean',
            default: false,
            description: 'Whether to show closed markets',
          },
          {
            displayName: 'Offset',
            name: 'offset',
            type: 'number',
            default: 0,
            description: 'Number of results to skip (for pagination)',
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
            name: 'Get Orders',
            value: 'getOrders',
            description: 'Get your orders',
            action: 'Get orders',
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
        description: 'The outcome token ID to trade (from clobTokenIds array)',
      },
      {
        displayName: 'Side',
        name: 'side',
        type: 'options',
        options: [
          {
            name: 'Buy',
            value: 'BUY',
            description: 'Buy tokens',
          },
          {
            name: 'Sell',
            value: 'SELL',
            description: 'Sell tokens',
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
        description: 'Whether to buy or sell',
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
        description: 'Price per share (between 0.01 and 0.99)',
        typeOptions: {
          minValue: 0.01,
          maxValue: 0.99,
          numberPrecision: 4,
        },
      },
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'number',
        default: 10,
        required: true,
        displayOptions: {
          show: {
            resource: ['order'],
            operation: ['create'],
          },
        },
        description: 'Amount in USDC to trade',
        typeOptions: {
          minValue: 1,
        },
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
            operation: ['cancel'],
          },
        },
        description: 'The unique identifier of the order to cancel',
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
            name: 'Get Trades',
            value: 'getTrades',
            description: 'Get trades for a market',
            action: 'Get trades',
          },
        ],
        default: 'getTrades',
      },
      {
        displayName: 'Token ID',
        name: 'tokenId',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['trade'],
            operation: ['getTrades'],
          },
        },
        description: 'Token ID to get trades for',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('polymarketApi');
    
    // Polymarket API endpoints
    const gammaUrl = 'https://gamma-api.polymarket.com';
    const clobUrl = 'https://clob.polymarket.com';
    
    // Create wallet instance from private key
    const privateKey = credentials.privateKey as string;
    const wallet = new ethers.Wallet(
      privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
    );
    
    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;

        let responseData: any;

        // ============================================
        //               Market Operations
        // ============================================
        if (resource === 'market') {
          if (operation === 'getAll') {
            const limit = this.getNodeParameter('limit', i) as number;
            const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
            
            const params: any = {
              limit: limit || 20,
              offset: additionalFields.offset || 0,
            };
            
            if (additionalFields.active !== undefined) {
              params.active = additionalFields.active;
            }
            if (additionalFields.closed !== undefined) {
              params.closed = additionalFields.closed;
            }

            const response = await axios.get(`${gammaUrl}/markets`, { params });
            responseData = response.data;
            
          } else if (operation === 'get') {
            const marketId = this.getNodeParameter('marketId', i) as string;
            const response = await axios.get(`${gammaUrl}/markets/${marketId}`);
            responseData = response.data;
            
          } else if (operation === 'search') {
            const searchQuery = this.getNodeParameter('searchQuery', i) as string;
            const limit = this.getNodeParameter('limit', i) as number;
            
            const response = await axios.get(`${gammaUrl}/markets`, {
              params: {
                limit,
                offset: 0,
              },
            });
            
            // Filter results by search query
            const allMarkets = response.data;
            responseData = allMarkets.filter((market: any) => 
              market.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              market.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
        }

        // ============================================
        //               Order Operations  
        // ============================================
        else if (resource === 'order') {
          const apiKey = credentials.apiKey as string;
          const apiSecret = credentials.apiSecret as string;
          const passphrase = credentials.apiPassphrase as string;
          
          if (operation === 'create') {
            const tokenId = this.getNodeParameter('tokenId', i) as string;
            const side = this.getNodeParameter('side', i) as string;
            const price = this.getNodeParameter('price', i) as number;
            const amount = this.getNodeParameter('amount', i) as number;

            // Calculate size based on amount and price
            const size = amount / price;

            // Create timestamp and nonce
            const timestamp = Date.now();
            const nonce = timestamp;

            // Create order payload
            const orderPayload = {
              tokenID: tokenId,
              price: price.toFixed(4),
              size: size.toFixed(2),
              side: side,
              feeRateBps: '0',
              nonce: nonce,
              maker: wallet.address,
              expiration: Math.floor(Date.now() / 1000) + 86400, // 24 hours
            };

            // Sign with private key using EIP-712
            const domain = {
              name: 'Polymarket CTF Exchange',
              version: '1',
              chainId: parseInt(credentials.chainId as string) || 137,
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

            const signature = await wallet.signTypedData(domain, types, orderPayload);

            // Submit order
            const response = await axios.post(
              `${clobUrl}/order`,
              {
                ...orderPayload,
                signature,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'POLY-ADDRESS': wallet.address,
                  'POLY-SIGNATURE': signature,
                  'POLY-TIMESTAMP': timestamp.toString(),
                  'POLY-NONCE': nonce.toString(),
                  'POLY-API-KEY': apiKey,
                  'POLY-PASSPHRASE': passphrase,
                },
              }
            );
            responseData = response.data;
            
          } else if (operation === 'cancel') {
            const orderId = this.getNodeParameter('orderId', i) as string;
            const timestamp = Date.now();
            
            const response = await axios.delete(`${clobUrl}/order`, {
              data: { orderID: orderId },
              headers: {
                'POLY-ADDRESS': wallet.address,
                'POLY-TIMESTAMP': timestamp.toString(),
                'POLY-API-KEY': apiKey,
                'POLY-PASSPHRASE': passphrase,
              },
            });
            responseData = response.data || { success: true, orderId };
            
          } else if (operation === 'getOrders') {
            const timestamp = Date.now();
            
            const response = await axios.get(`${clobUrl}/orders`, {
              headers: {
                'POLY-ADDRESS': wallet.address,
                'POLY-TIMESTAMP': timestamp.toString(),
                'POLY-API-KEY': apiKey,
                'POLY-PASSPHRASE': passphrase,
              },
            });
            responseData = response.data;
          }
        }

        // ============================================
        //               Trade Operations
        // ============================================
        else if (resource === 'trade') {
          if (operation === 'getTrades') {
            const tokenId = this.getNodeParameter('tokenId', i, '') as string;
            
            const params: any = {};
            if (tokenId) {
              params.token_id = tokenId;
            }
            
            const response = await axios.get(`${clobUrl}/trades`, { params });
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
          const errorData = {
            json: {
              error: error.message,
              errorDetails: error.response?.data || {},
              statusCode: error.response?.status,
              endpoint: error.config?.url,
              method: error.config?.method,
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
          { 
            itemIndex: i,
            description: `Endpoint: ${error.config?.url}`,
          }
        );
      }
    }

    return [returnData];
  }
}
