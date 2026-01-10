import {
  INodeType,
  INodeTypeDescription,
  ITriggerFunctions,
  ITriggerResponse,
  IDataObject,
  NodeOperationError,
} from 'n8n-workflow';
import type { AxiosRequestConfig } from 'axios';

export class PolymarketTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Polymarket Trigger',
    name: 'polymarketTrigger',
    icon: 'file:polymarket.png',
    group: ['trigger'],
    version: 1,
    description: 'Triggers workflow based on Polymarket events',
    defaults: {
      name: 'Polymarket Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'polymarketApi',
        required: true,
      },
    ],
    polling: true,
    properties: [
      {
        displayName: 'Trigger On',
        name: 'triggerOn',
        type: 'options',
        options: [
          {
            name: 'New Market',
            value: 'newMarket',
            description: 'Trigger when new markets are created',
          },
          {
            name: 'Price Change',
            value: 'priceChange',
            description: 'Trigger when price changes by threshold',
          },
          {
            name: 'Market Resolution',
            value: 'marketResolution',
            description: 'Trigger when a market resolves',
          },
        ],
        default: 'newMarket',
        required: true,
        description: 'The event that triggers the workflow',
      },
      {
        displayName: 'Market ID',
        name: 'marketId',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            triggerOn: ['priceChange', 'marketResolution'],
          },
        },
        description: 'The ID of the market to monitor',
      },
      {
        displayName: 'Price Change Threshold (%)',
        name: 'priceThreshold',
        type: 'number',
        default: 5,
        displayOptions: {
          show: {
            triggerOn: ['priceChange'],
          },
        },
        description: 'Trigger when price changes by this percentage',
        typeOptions: {
          minValue: 0.1,
          maxValue: 100,
          numberPrecision: 2,
        },
      },
      {
        displayName: 'Poll Interval (Minutes)',
        name: 'pollInterval',
        type: 'number',
        default: 5,
        description: 'How often to check for changes (in minutes)',
        typeOptions: {
          minValue: 1,
          maxValue: 1440,
        },
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Include Market Details',
            name: 'includeMarketDetails',
            type: 'boolean',
            default: true,
            description: 'Whether to include full market details in trigger data',
          },
          {
            displayName: 'Minimum Volume',
            name: 'minVolume',
            type: 'number',
            default: 0,
            displayOptions: {
              show: {
                '/triggerOn': ['newMarket'],
              },
            },
            description: 'Only trigger for markets with volume above this amount',
          },
        ],
      },
    ],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const triggerOn = this.getNodeParameter('triggerOn') as string;
    const pollInterval = this.getNodeParameter('pollInterval') as number;
    const credentials = await this.getCredentials('polymarketApi');
    const options = this.getNodeParameter('options', {}) as IDataObject;
    
    const gammaUrl = 'https://gamma-api.polymarket.com';
    
    let lastState: IDataObject = {};

    const pollFunction = async () => {
      try {
        // Dynamic import of axios
        const axios = (await import('axios')).default;
        
        let shouldTrigger = false;
        let data: any = null;

        if (triggerOn === 'newMarket') {
          const response = await axios.get(`${gammaUrl}/markets`, {
            params: { limit: 20, active: true },
          });
          
          const markets = response.data;
          const storedMarketIds = (lastState.marketIds as string[]) || [];
          
          let newMarkets = markets.filter((m: any) => !storedMarketIds.includes(m.id));
          
          if (options.minVolume) {
            newMarkets = newMarkets.filter((m: any) => 
              parseFloat(m.volume || '0') >= (options.minVolume as number)
            );
          }
          
          if (newMarkets.length > 0) {
            shouldTrigger = true;
            data = newMarkets;
            lastState.marketIds = markets.map((m: any) => m.id);
          } else if (storedMarketIds.length === 0) {
            lastState.marketIds = markets.map((m: any) => m.id);
          }
        }

        else if (triggerOn === 'priceChange') {
          const marketId = this.getNodeParameter('marketId') as string;
          const threshold = this.getNodeParameter('priceThreshold') as number;
          
          const response = await axios.get(`${gammaUrl}/markets/${marketId}`);
          const market = response.data;
          const currentPrice = parseFloat(market.outcomePrices?.[0] || '0');
          
          if (lastState.lastPrice !== undefined) {
            const previousPrice = lastState.lastPrice as number;
            const change = Math.abs((currentPrice - previousPrice) / previousPrice * 100);
            
            if (change >= threshold) {
              shouldTrigger = true;
              data = {
                ...market,
                priceChange: change,
                previousPrice,
                currentPrice,
                direction: currentPrice > previousPrice ? 'up' : 'down',
              };
            }
          }
          
          lastState.lastPrice = currentPrice;
        }

        else if (triggerOn === 'marketResolution') {
          const marketId = this.getNodeParameter('marketId') as string;
          
          const response = await axios.get(`${gammaUrl}/markets/${marketId}`);
          const market = response.data;
          
          const isResolved = market.closed === true;
          
          if (isResolved && !lastState.resolved) {
            shouldTrigger = true;
            data = {
              ...market,
              resolvedAt: new Date().toISOString(),
            };
          }
          
          lastState.resolved = isResolved;
        }

        if (shouldTrigger && data) {
          if (options.includeMarketDetails && Array.isArray(data)) {
            for (const item of data) {
              if (item.conditionId) {
                try {
                  const marketResponse = await axios.get(
                    `${gammaUrl}/markets/${item.conditionId}`
                  );
                  Object.assign(item, { fullDetails: marketResponse.data });
                } catch (error) {
                  // Continue if details fetch fails
                }
              }
            }
          }
          
          this.emit([this.helpers.returnJsonArray(data)]);
        }
        
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message;
        
        if (this.getMode() === 'manual') {
          throw new NodeOperationError(
            this.getNode(),
            `Polymarket Trigger Error: ${errorMessage}`
          );
        }
      }
    };

    const intervalObj = setInterval(async () => {
      await pollFunction();
    }, pollInterval * 60 * 1000) as NodeJS.Timeout;
    
    await pollFunction();

    async function closeFunction() {
      clearInterval(intervalObj);
    }

    return {
      closeFunction,
    };
  }
}
