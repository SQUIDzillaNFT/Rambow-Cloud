import Onboard from 'bnc-onboard'

const ACTIVE_NETWORK_ID = 1
const INFURA_KEY = "2062ceb6ec1b4869a44098b2fee98203"
const APP_URL = "https://www.bolixmint.com/"
const CONTACT_EMAIL = "nrwisch@gmail.com"
const RPC_URL = "https://mainnet.infura.io/v3/2062ceb6ec1b4869a44098b2fee98203"
const APP_NAME = "BolixMINT"

const wallets = [
  { walletName: "metamask" },
  {
    walletName: "walletConnect",
    infuraKey: INFURA_KEY
  },
  {
    walletName: 'ledger',
    rpcUrl: RPC_URL
  },
  { walletName: "coinbase"},
  { walletName: "trust", rpcUrl: RPC_URL},
  {
    walletName: 'trezor',
    appUrl: APP_URL,
    email: CONTACT_EMAIL,
    rpcUrl: RPC_URL
  }
]

export const onboard = Onboard({
  //... other options
  dappId: 'cfc3e1e8-75ab-498e-9869-c4a3a68917ef',
  networkId: ACTIVE_NETWORK_ID,
  walletSelect: {
    wallets: wallets,
  },
});

export function initOnboard(subscriptions) {
  return Onboard({
    dappId: 'cfc3e1e8-75ab-498e-9869-c4a3a68917ef',
    networkId: ACTIVE_NETWORK_ID,
    subscriptions,
    walletSelect: {
      wallets: wallets,
    },
    walletCheck: [
      {checkName: 'derivationPath'},
      {checkName: 'connect'},
      {checkName: 'accounts'},
      {checkName: 'network'},
    ],
  });
}