import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class Polymarket implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Polymarket',
    name: 'polymarket',
    icon: 'file:polymarket.png',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Polymarket API - Market Discovery & Data',
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
            operation: ['trading', 'positions'],
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
            description: 'Discover and fetch market data - Events, Markets, Tags',
          },
          {
            name: 'Trading (CLOB API) - Coming Soon',
            value: 'trading',
            description: '🚧 Create orders, cancel orders, get orderbook - In Development',
          },
          {
            name: 'User Data (Data API) - Coming Soon',
            value: 'userData',
            description: '🚧 Get positions, trade history, portfolio - In Development',
          },
        ],
        default: 'marketInfo',
      },

      // ==================== COMING SOON NOTICE ====================
      {
        displayName: 'Coming Soon',
        name: 'comingSoonNotice',
        type: 'notice',
        default: '',
        displayOptions: {
          show: {
            operation: ['trading', 'userData'],
          },
        },
      },
      {
        displayName: 'Feature Under Development',
        name: 'comingSoonMessage',
        type: 'notice',
        default: '🚧 This feature is currently under development and will be available soon.\n\n📍 Current Status:\n• Part 1: Market Info (Gamma API) - ✅ Available\n• Part 2: Trading Operations (CLOB API) - 🔨 In Progress\n• Part 3: User Data & Positions (Data API) - 📋 Planned\n\nStay tuned for updates!',
        displayOptions: {
          show: {
            operation: ['trading', 'userData'],
          },
        },
      },

      // ==================== MARKET INFO OPERATION ====================
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
          {
            name: 'By Slug',
            value: 'bySlug',
            description: 'Best for fetching specific individual markets or events',
          },
          {
            name: 'By Tags',
            value: 'byTags',
            description: 'Ideal for filtering markets by category or sport',
          },
          {
            name: 'Via Events Endpoint',
            value: 'viaEvents',
            description: 'Most efficient for retrieving all active markets',
          },
          {
            name: 'Search',
            value: 'search',
            description: 'Search markets by keywords',
          },
          {
            name: 'Get Tags List',
            value: 'getTagsList',
            description: 'Get all available tags/categories',
          },
        ],
        default: 'viaEvents',
        description: 'Choose how to fetch market data',
      },

      // ==================== RESOURCE TYPE ====================
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
          {
            name: 'Event',
            value: 'event',
            description: 'Fetch event (contains set of markets)',
          },
          {
            name: 'Market',
            value: 'market',
            description: 'Fetch individual market',
          },
        ],
        default: 'event',
        description: 'Choose whether to fetch events or markets',
      },

      // ==================== BY SLUG ====================
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
        placeholder: 'fed-decision-in-october',
        description: 'Event or market slug from URL',
      },

      // ==================== BY TAGS ====================
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
        placeholder: '21',
        description: 'Tag ID to filter by (use "Get Tags List" to find IDs)',
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
        description: 'Whether to include markets with related tags',
      },

      // ==================== SEARCH ====================
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
        placeholder: 'bitcoin',
        description: 'Search keywords',
      },

      // ==================== FILTERS (Common for Events/Markets) ====================
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
          {
            displayName: 'Active',
            name: 'active',
            type: 'boolean',
            default: true,
            description: 'Whether to show only active markets/events',
          },
          {
            displayName: 'Closed',
            name: 'closed',
            type: 'boolean',
            default: false,
            description: 'Whether to include closed markets/events',
          },
          {
            displayName: 'Archived',
            name: 'archived',
            type: 'boolean',
            default: false,
            description: 'Whether to include archived markets/events',
          },
          {
            displayName: 'Limit',
            name: 'limit',
            type: 'number',
            default: 50,
            typeOptions: {
              minValue: 1,
              maxValue: 100,
            },
            description: 'Number of results to return (max 100)',
          },
          {
            displayName: 'Offset',
            name: 'offset',
            type: 'number',
            default: 0,
            description: 'Number of results to skip (for pagination)',
          },
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
            description: 'Field to sort results by',
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
            description: 'Sort direction',
          },
        ],
      },

      // ==================== TAGS LIST OPTIONS ====================
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
          {
            displayName: 'Limit',
            name: 'limit',
            type: 'number',
            default: 100,
            description: 'Number of tags to return',
          },
          {
            displayName: 'Offset',
            name: 'offset',
            type: 'number',
            default: 0,
            description: 'Number of tags to skip',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Dynamic import axios
    const axios = (await import('axios')).default;
    
    const GAMMA_API = 'https://gamma-api.polymarket.com';
    
    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;
        let responseData: any;

        // ==================== COMING SOON OPERATIONS ====================
        if (operation === 'trading' || operation === 'userData') {
          const featureName = operation === 'trading' ? 'Trading Operations (CLOB API)' : 'User Data & Positions (Data API)';
          throw new NodeOperationError(
            this.getNode(),
            `🚧 ${featureName} - Coming Soon!\n\nThis feature is currently under development.\n\nAvailable Now:\n✅ Part 1: Market Info (Gamma API)\n\nComing Soon:\n🔨 Part 2: Trading Operations (CLOB API)\n📋 Part 3: User Data & Positions (Data API)`,
            { itemIndex: i }
          );
        }

        if (operation === 'marketInfo') {
          const fetchMethod = this.getNodeParameter('fetchMethod', i) as string;

          // ==================== GET TAGS LIST ====================
          if (fetchMethod === 'getTagsList') {
            const options = this.getNodeParameter('tagsOptions', i, {}) as any;
            
            const params: any = {};
            if (options.limit) params.limit = options.limit;
            if (options.offset) params.offset = options.offset;

            const response = await axios.get(`${GAMMA_API}/tags`, { params });
            responseData = response.data;
          }

          // ==================== SEARCH ====================
          else if (fetchMethod === 'search') {
            const searchQuery = this.getNodeParameter('searchQuery', i) as string;
            const filters = this.getNodeParameter('filters', i, {}) as any;

            const params: any = {
              query: searchQuery,
            };

            if (filters.limit) params.limit = filters.limit;
            if (filters.offset) params.offset = filters.offset;

            const response = await axios.get(`${GAMMA_API}/search`, { params });
            responseData = response.data;
          }

          // ==================== BY SLUG ====================
          else if (fetchMethod === 'bySlug') {
            const resourceType = this.getNodeParameter('resourceType', i) as string;
            const slug = this.getNodeParameter('slug', i) as string;

            if (resourceType === 'event') {
              const response = await axios.get(`${GAMMA_API}/events/slug/${slug}`);
              responseData = response.data;
            } else {
              // For markets, slug can be used directly
              const response = await axios.get(`${GAMMA_API}/markets/${slug}`);
              responseData = response.data;
            }
          }

          // ==================== BY TAGS ====================
          else if (fetchMethod === 'byTags') {
            const resourceType = this.getNodeParameter('resourceType', i) as string;
            const tagId = this.getNodeParameter('tagId', i) as string;
            const relatedTags = this.getNodeParameter('relatedTags', i) as boolean;
            const filters = this.getNodeParameter('filters', i, {}) as any;

            const params: any = {
              tag_id: tagId,
            };

            // Apply filters (default to active if not specified)
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

          // ==================== VIA EVENTS ENDPOINT ====================
          else if (fetchMethod === 'viaEvents') {
            const resourceType = this.getNodeParameter('resourceType', i) as string;
            const filters = this.getNodeParameter('filters', i, {}) as any;

            const params: any = {};

            // Apply filters (default to active if not specified)
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
              method: error.config?.method,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeOperationError(
          this.getNode(),
          `Polymarket Error: ${error.response?.data?.message || error.message}`,
          { 
            itemIndex: i,
            description: `${error.config?.method} ${error.config?.url}`,
          }
        );
      }
    }

    return [returnData];
  }
}
