import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class PolymarketApi implements ICredentialType {
  name = 'polymarketApi';
  displayName = 'Polymarket API';
  documentationUrl = 'https://docs.polymarket.com/developers/builders/builder-api';
  properties: INodeProperties[] = [
    {
      displayName: 'Builder API Key',
      name: 'builderApiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Polymarket Builder API Key from Builder Profile',
    },
    {
      displayName: 'Builder API Secret',
      name: 'builderApiSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Polymarket Builder API Secret',
    },
    {
      displayName: 'Builder API Passphrase',
      name: 'builderApiPassphrase',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Polymarket Builder API Passphrase',
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Ethereum wallet private key (without 0x prefix) - used for signing orders',
    },
    {
      displayName: 'Proxy Wallet Address',
      name: 'proxyWalletAddress',
      type: 'string',
      default: '',
      required: true,
      description: 'Your Polymarket Proxy Wallet address (Safe wallet deployed via Relayer)',
      placeholder: '0x...',
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
          name: 'Amoy Testnet',
          value: 80002,
        },
      ],
      default: 137,
      description: 'Blockchain network (use Polygon Mainnet for production)',
    },
  ];
}
