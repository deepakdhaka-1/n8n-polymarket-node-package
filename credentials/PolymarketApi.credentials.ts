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
      description: 'Your Polymarket API key from Builder API section',
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Polymarket API secret from Builder API section',
    },
    {
      displayName: 'API Passphrase',
      name: 'apiPassphrase',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Polymarket API passphrase from Builder API section',
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your wallet private key from Magic Link export (without 0x prefix)',
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'options',
      options: [
        {
          name: 'Polygon Mainnet',
          value: '137',
        },
        {
          name: 'Mumbai Testnet',
          value: '80001',
        },
      ],
      default: '137',
      description: 'The blockchain network to use for transactions',
    },
  ];
}
