import { TronWeb } from 'tronweb';
import { storage } from './storage';
import { USDT_TRC20_CONTRACT } from './trc20-wallet';

const TRON_MAINNET = {
  fullNode: 'https://api.trongrid.io',
  solidityNode: 'https://api.trongrid.io',
  eventServer: 'https://api.trongrid.io',
};

export class TRC20WithdrawalService {
  private tronWeb: any;
  private tronGridApiKey: string | undefined;

  constructor() {
    this.tronGridApiKey = process.env.TRONGRID_API_KEY;
    this.tronWeb = new TronWeb(
      TRON_MAINNET.fullNode,
      TRON_MAINNET.solidityNode,
      TRON_MAINNET.eventServer
    );
  }

  private usdtToSun(usdt: string): number {
    return Math.round(parseFloat(usdt) * 1000000);
  }

  async sendTRC20USDT(
    fromMnemonic: string,
    fromIndex: number,
    toAddress: string,
    amountUSD: string
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      console.log(`💸 [TRC20] Preparing to send $${amountUSD} USDT to ${toAddress}...`);

      const derivationPath = `m/44'/195'/0'/0/${fromIndex}`;
      const wallet = TronWeb.fromMnemonic(fromMnemonic, derivationPath);
      
      this.tronWeb.setPrivateKey(wallet.privateKey);
      const fromAddress = wallet.address;

      console.log(`📤 [TRC20] Sending from vault-derived address: ${fromAddress}`);

      const trxBalance = await this.tronWeb.trx.getBalance(fromAddress);
      const trxBalanceInTRX = trxBalance / 1000000;

      if (trxBalanceInTRX < 10) {
        return {
          success: false,
          error: `Insufficient TRX for fees. Vault address ${fromAddress} has ${trxBalanceInTRX} TRX, needs at least 10 TRX for transaction fees.`
        };
      }

      const contract = await this.tronWeb.contract().at(USDT_TRC20_CONTRACT);
      
      const amountInSun = this.usdtToSun(amountUSD);
      
      console.log(`💰 [TRC20] Amount in sun units: ${amountInSun}`);

      const transaction = await contract.transfer(
        toAddress,
        amountInSun
      ).send({
        feeLimit: 100000000,
        callValue: 0,
        shouldPollResponse: true
      });

      console.log(`✅ [TRC20] Transaction sent successfully!`);
      console.log(`📝 [TRC20] Transaction Hash: ${transaction}`);

      return {
        success: true,
        txHash: transaction
      };

    } catch (error: any) {
      console.error('❌ [TRC20] Error sending USDT:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while sending USDT'
      };
    }
  }

  async sendWithdrawalFromVault(
    toAddress: string,
    amountUSD: string
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      const config = await storage.getAdminConfig();
      
      if (!config?.trc20HdSeed) {
        return {
          success: false,
          error: 'TRC20 vault not configured. Please contact administrator.'
        };
      }

      if (!config?.trc20VaultAddress) {
        return {
          success: false,
          error: 'TRC20 vault address not set. Please contact administrator.'
        };
      }

      console.log(`🏦 [TRC20] Sending withdrawal from vault to ${toAddress}...`);

      const result = await this.sendTRC20USDT(
        config.trc20HdSeed,
        0,
        toAddress,
        amountUSD
      );

      if (result.success) {
        console.log(`✅ [TRC20] Withdrawal completed: ${result.txHash}`);
      } else {
        console.error(`❌ [TRC20] Withdrawal failed: ${result.error}`);
      }

      return result;

    } catch (error: any) {
      console.error('❌ [TRC20] Error processing withdrawal from vault:', error);
      return {
        success: false,
        error: error.message || 'Failed to process withdrawal'
      };
    }
  }

  async getEstimatedFee(): Promise<number> {
    return 10;
  }
}

export const trc20WithdrawalService = new TRC20WithdrawalService();
