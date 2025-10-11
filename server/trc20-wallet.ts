import { TronWeb } from 'tronweb';

const TRON_MAINNET = {
  fullNode: 'https://api.trongrid.io',
  solidityNode: 'https://api.trongrid.io',
  eventServer: 'https://api.trongrid.io',
};

const TRON_DERIVATION_PATH_PREFIX = "m/44'/195'/0'/0/";

export class TRC20WalletManager {
  private tronWeb: any;
  
  constructor() {
    this.tronWeb = new TronWeb(
      TRON_MAINNET.fullNode,
      TRON_MAINNET.solidityNode,
      TRON_MAINNET.eventServer
    );
  }

  generateHDWallet(): { mnemonic: string; vaultAddress: string } {
    const hdWallet = TronWeb.createRandom();
    
    if (!hdWallet.mnemonic) {
      throw new Error('Failed to generate HD wallet mnemonic');
    }
    
    return {
      mnemonic: hdWallet.mnemonic.phrase,
      vaultAddress: hdWallet.address,
    };
  }

  deriveAddressFromSeed(mnemonic: string, index: number): string {
    const derivationPath = `${TRON_DERIVATION_PATH_PREFIX}${index}`;
    const wallet = TronWeb.fromMnemonic(mnemonic, derivationPath);
    
    const address = wallet.address;
    if (typeof address === 'string') {
      return address;
    } else if (address && typeof address === 'object' && 'base58' in address) {
      return (address as any).base58;
    }
    throw new Error('Failed to derive TRON address');
  }

  async getTRC20Balance(address: string, tokenContract: string): Promise<string> {
    try {
      const contract = await this.tronWeb.contract().at(tokenContract);
      const balance = await contract.balanceOf(address).call();
      return this.tronWeb.fromSun(balance.toString());
    } catch (error) {
      console.error('Error getting TRC20 balance:', error);
      return '0';
    }
  }

  async getTRXBalance(address: string): Promise<number> {
    try {
      const balance = await this.tronWeb.trx.getBalance(address);
      return balance / 1000000;
    } catch (error) {
      console.error('Error getting TRX balance:', error);
      return 0;
    }
  }

  validateAddress(address: string): boolean {
    return this.tronWeb.isAddress(address);
  }
}

export const trc20WalletManager = new TRC20WalletManager();

export const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
