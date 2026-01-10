import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class PolymarketApi implements ICredentialType {
  public name = 'polymarketApi';
  public displayName = 'Polymarket API';
  public documentationUrl = 'https://docs.polymarket.com/developers/CLOB/authentication';

  public properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Polymarket Builder API Key (from Settings → Builder API)',
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your Polymarket Builder API Secret',
    },
    {
      displayName: 'API Passphrase',
      name: 'apiPassphrase',
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
      description: 'Your wallet private key (exported from Magic Link, without 0x prefix)',
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
