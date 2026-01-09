import {
  INodeType,
  INodeTypeDescription,
  ITriggerFunctions,
  ITriggerResponse,
  IDataObject,
  NodeOperationError,
} from 'n8n-workflow';
import axios from 'axios';

export class PolymarketTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Polymarket Trigger',
    name: 'polymarketTrigger',
    icon: 'file:polymarket.svg',
    group: ['trigger'],
    version: 1,
    description: 'Triggers workflow based on Polymarket events',
    defaults: { name: 'Polymarket Trigger' },
    inputs: [],
    outputs: ['main'],
    credentials: [{ name: 'polymarketApi', required: true }],
    polling: true,

    properties: [
      {
        displayName: 'Trigger On',
        name: 'triggerOn',
        type: 'options',
        options: [
          { name: 'New Market', value: 'newMarket' },
          { name: 'Price Change', value: 'priceChange' },
          { name: 'Order Filled', value: 'orderFilled' },
          { name: 'Market Resolution', value: 'marketResolution' },
        ],
        default: 'newMarket',
      },
      { displayName: 'Market ID', name: 'marketId', type: 'string', default: '' },
      { displayName: 'Price Threshold %', name: 'priceThreshold', type: 'number', default: 5 },
      { displayName: 'Poll Interval (Minutes)', name: 'pollInterval', type: 'number', default: 5 },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        default: {},
        options: [
          { displayName: 'Include Market Details', name: 'includeMarketDetails', type: 'boolean', default: true },
          { displayName: 'Minimum Volume', name: 'minVolume', type: 'number', default: 0 },
        ],
      },
    ],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const triggerOn = this.getNodeParameter('triggerOn') as string;
    const pollInterval = this.getNodeParameter('pollInterval') as number;
    const credentials = await this.getCredentials('polymarketApi');
    const options = this.getNodeParameter('options', {}) as IDataObject;

    const baseUrl = 'https://clob.polymarket.com';
    const config = {
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        'X-Api-Secret': credentials.apiSecret as string,
      },
    };

    let lastState: IDataObject = {};

    const pollFunction = async () => {
      try {
        let shouldTrigger = false;
        let data: any = null;

        if (triggerOn === 'newMarket') {
          const res = await axios.get(`${baseUrl}/markets`, config);
          const markets = res.data;
          const prev = (lastState.marketIds as string[]) || [];
          const fresh = markets.filter((m: any) => !prev.includes(m.id));

          if (fresh.length) {
            shouldTrigger = true;
            data = fresh;
            lastState.marketIds = markets.map((m: any) => m.id);
          } else if (!prev.length) {
            lastState.marketIds = markets.map((m: any) => m.id);
          }
        }

        else if (triggerOn === 'priceChange') {
          const marketId = this.getNodeParameter('marketId') as string;
          const threshold = this.getNodeParameter('priceThreshold') as number;

          const res = await axios.get(`${baseUrl}/markets/${marketId}`, config);
          const market = res.data;
          const price = parseFloat(market.price || '0');

          if (lastState.lastPrice !== undefined) {
            const prev = lastState.lastPrice as number;
            const change = Math.abs((price - prev) / prev * 100);

            if (change >= threshold) {
              shouldTrigger = true;
              data = { ...market, change, prev, price };
            }
          }
          lastState.lastPrice = price;
        }

        else if (triggerOn === 'orderFilled') {
          const res = await axios.get(`${baseUrl}/trades`, config);
          const trades = res.data;
          const prev = (lastState.tradeIds as string[]) || [];
          const fresh = trades.filter((t: any) => !prev.includes(t.id));

          if (fresh.length) {
            shouldTrigger = true;
            data = fresh;
            lastState.tradeIds = trades.map((t: any) => t.id).slice(0, 100);
          }
        }

        else if (triggerOn === 'marketResolution') {
          const marketId = this.getNodeParameter('marketId') as string;
          const res = await axios.get(`${baseUrl}/markets/${marketId}`, config);
          const market = res.data;

          if (market.resolved && !lastState.resolved) {
            shouldTrigger = true;
            data = market;
          }
          lastState.resolved = market.resolved;
        }

        if (shouldTrigger && data) {
          this.emit([this.helpers.returnJsonArray(data)]);
        }

      } catch (e: any) {
        if (this.getMode() === 'manual') {
          throw new NodeOperationError(this.getNode(), e.message);
        }
      }
    };

    const interval = setInterval(pollFunction, pollInterval * 60 * 1000);
    await pollFunction();

    return {
      closeFunction: async () => clearInterval(interval),
    };
  }
}
