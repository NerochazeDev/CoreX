import { storage } from './storage';
import { DepositSession } from '@shared/schema';

interface BlockchainTransaction {
  hash: string;
  confirmed: boolean;
  confirmations: number;
  block_height?: number;
  block_hash?: string;
  received: string; // Amount in satoshis
  inputs: Array<{
    prev_hash: string;
    output_index: number;
    script: string;
    output_value: number;
    sequence: number;
    addresses: string[];
    script_type: string;
  }>;
  outputs: Array<{
    value: number; // satoshis
    script: string;
    addresses: string[];
    script_type: string;
  }>;
}

interface AddressInfo {
  address: string;
  total_received: number; // satoshis
  total_sent: number;
  balance: number;
  unconfirmed_balance: number;
  final_balance: number;
  n_tx: number;
  unconfirmed_n_tx: number;
  final_n_tx: number;
  txrefs?: Array<{
    tx_hash: string;
    block_height: number;
    tx_input_n: number;
    tx_output_n: number;
    value: number;
    ref_balance: number;
    spent: boolean;
    confirmations: number;
    confirmed: string;
    double_spend: boolean;
  }>;
}

export class BlockchainMonitor {
  private apiKey: string | undefined;
  private baseUrl: string;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Using BlockCypher API (free tier: 200 req/hr, 3 req/sec)
    this.apiKey = process.env.BLOCKCYPHER_API_KEY; // Optional for higher limits
    this.baseUrl = 'https://api.blockcypher.com/v1/btc/main';
  }

  // Convert satoshis to BTC
  private satoshisToBTC(satoshis: number): string {
    return (satoshis / 100000000).toFixed(8);
  }

  // Convert BTC to satoshis
  private btcToSatoshis(btc: string): number {
    return Math.round(parseFloat(btc) * 100000000);
  }

  // Check if an address has received a specific amount
  async checkAddressForDeposit(address: string, expectedAmountBTC: string): Promise<{
    found: boolean;
    transaction?: BlockchainTransaction;
    actualAmountBTC?: string;
    confirmations?: number;
  }> {
    try {
      console.log(`🔍 Checking address ${address} for deposit of ${expectedAmountBTC} BTC...`);
      
      const url = `${this.baseUrl}/addrs/${address}${this.apiKey ? `?token=${this.apiKey}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️ BlockCypher rate limit reached, retrying in 60 seconds...');
          return { found: false };
        }
        throw new Error(`BlockCypher API error: ${response.status}`);
      }

      const addressInfo: AddressInfo = await response.json();
      
      if (!addressInfo.txrefs || addressInfo.txrefs.length === 0) {
        console.log(`📭 No transactions found for address ${address}`);
        return { found: false };
      }

      const expectedSatoshis = this.btcToSatoshis(expectedAmountBTC);
      const tolerance = 1000; // 0.00001 BTC tolerance for fees

      // Check recent transactions for matching amounts
      for (const txref of addressInfo.txrefs.slice(0, 10)) { // Check last 10 transactions
        if (!txref.spent && txref.value >= (expectedSatoshis - tolerance) && txref.value <= (expectedSatoshis + tolerance)) {
          // Found a matching transaction, get full transaction details
          const txDetails = await this.getTransactionDetails(txref.tx_hash);
          
          if (txDetails) {
            console.log(`✅ Found matching deposit: ${txref.tx_hash} with ${this.satoshisToBTC(txref.value)} BTC (${txref.confirmations} confirmations)`);
            
            return {
              found: true,
              transaction: txDetails,
              actualAmountBTC: this.satoshisToBTC(txref.value),
              confirmations: txref.confirmations
            };
          }
        }
      }

      console.log(`❌ No matching deposits found for ${expectedAmountBTC} BTC on address ${address}`);
      return { found: false };

    } catch (error) {
      console.error('❌ Error checking address for deposit:', error);
      return { found: false };
    }
  }

  // Get full transaction details
  async getTransactionDetails(txHash: string): Promise<BlockchainTransaction | null> {
    try {
      const url = `${this.baseUrl}/txs/${txHash}${this.apiKey ? `?token=${this.apiKey}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`BlockCypher API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting transaction details:', error);
      return null;
    }
  }

  // Start monitoring all active deposit sessions
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('🔄 Blockchain monitoring already running');
      return;
    }

    console.log('🚀 Starting blockchain monitoring for deposit sessions...');
    this.isMonitoring = true;

    // Monitor every 30 seconds (well within rate limits)
    this.monitoringInterval = setInterval(async () => {
      await this.checkAllPendingDeposits();
      await this.expireOldSessions();
    }, 30000);

    // Do an initial check
    await this.checkAllPendingDeposits();
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🛑 Blockchain monitoring stopped');
  }

  // Check all pending deposit sessions for confirmations
  private async checkAllPendingDeposits(): Promise<void> {
    try {
      const pendingSessions = await storage.getActivePendingDepositSessions();
      
      if (pendingSessions.length === 0) {
        return;
      }

      console.log(`🔍 Checking ${pendingSessions.length} pending deposit sessions...`);

      for (const session of pendingSessions) {
        await this.verifyDepositSession(session);
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error('❌ Error checking pending deposits:', error);
    }
  }

  // Verify a specific deposit session
  private async verifyDepositSession(session: DepositSession): Promise<void> {
    try {
      const result = await this.checkAddressForDeposit(session.depositAddress, session.amount);
      
      if (result.found && result.transaction && result.confirmations !== undefined) {
        // Update the session with blockchain info
        await storage.updateDepositSessionBlockchain(
          session.sessionToken,
          result.transaction.hash,
          result.confirmations,
          result.actualAmountBTC || session.amount
        );

        // If transaction has enough confirmations (1+), process the deposit
        if (result.confirmations >= 1) {
          await this.processConfirmedDeposit(session, result.actualAmountBTC || session.amount, result.transaction.hash);
        }
      }
    } catch (error) {
      console.error(`❌ Error verifying deposit session ${session.sessionToken}:`, error);
    }
  }

  // Process a confirmed deposit
  private async processConfirmedDeposit(session: DepositSession, actualAmount: string, txHash: string): Promise<void> {
    try {
      console.log(`✅ Processing confirmed deposit for user ${session.userId}: ${actualAmount} BTC`);

      // Update user balance
      const user = await storage.getUser(session.userId);
      if (!user) {
        console.error(`❌ User ${session.userId} not found for deposit processing`);
        return;
      }

      const newBalance = (parseFloat(user.balance) + parseFloat(actualAmount)).toFixed(8);
      await storage.updateUserBalance(session.userId, newBalance);

      // Mark session as confirmed
      await storage.updateDepositSessionStatus(session.sessionToken, 'confirmed', new Date());

      // Create success notification
      await storage.createNotification({
        userId: session.userId,
        title: '💰 Deposit Confirmed!',
        message: `Your deposit of ${actualAmount} BTC has been confirmed and added to your balance.`,
        type: 'success'
      });

      // TODO: Implement vault sweeping here
      // await this.sweepToVault(session.depositAddress, actualAmount, txHash);

      console.log(`✅ Deposit processed successfully for user ${session.userId}`);

    } catch (error) {
      console.error('❌ Error processing confirmed deposit:', error);
    }
  }

  // Expire old deposit sessions
  private async expireOldSessions(): Promise<void> {
    try {
      await storage.expireDepositSessions();
    } catch (error) {
      console.error('❌ Error expiring old sessions:', error);
    }
  }

  // Get monitoring status
  getStatus(): { isMonitoring: boolean; apiKey: boolean } {
    return {
      isMonitoring: this.isMonitoring,
      apiKey: !!this.apiKey
    };
  }
}

// Export singleton instance
export const blockchainMonitor = new BlockchainMonitor();