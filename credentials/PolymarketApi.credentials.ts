import {
  IAuthenticateGeneric,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class PolymarketApi implements ICredentialType {
  name = 'polymarketApi';
  displayName = 'Polymarket API';
  documentationUrl = 'https://docs.polymarket.com';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Polymarket API key',
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Polymarket API secret',
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Ethereum wallet private key (without 0x prefix) for signing transactions',
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'options',
      options: [
        {
          name: 'Polygon Mainnet',
          value: 137,
        },
        {
          name: 'Mumbai Testnet',
          value: 80001,
        },
      ],
      default: 137,
      description: 'The blockchain network to use for transactions',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'Authorization': '=Bearer {{$credentials.apiKey}}',
        'X-Api-Secret': '={{$credentials.apiSecret}}',
      },
    },
  };
}
