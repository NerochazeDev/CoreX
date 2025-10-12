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

      // ANTI-FRAUD MEASURE: Check recent transactions for matching amounts
      // Only check unspent outputs and ensure transaction is recent enough
      const now = Date.now();
      const maxAgeHours = 2; // Only consider transactions from last 2 hours
      
      for (const txref of addressInfo.txrefs.slice(0, 5)) { // Reduced to 5 for security
        // SECURITY: Verify transaction is recent and unspent
        const txAge = now - new Date(txref.confirmed).getTime();
        if (!txref.spent && 
            txref.value >= (expectedSatoshis - tolerance) && 
            txref.value <= (expectedSatoshis + tolerance) &&
            txAge <= (maxAgeHours * 60 * 60 * 1000)) {
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

        // Enhanced security: Require minimum confirmations and verify transaction integrity
        const minConfirmations = 2; // Prevent fake deposits with higher confirmation requirement
        if (result.confirmations >= minConfirmations) {
          // Additional verification: Ensure this transaction hasn't been processed before
          const existingSession = await storage.getDepositSessionByTxHash(result.transaction.hash);
          if (existingSession && existingSession.sessionToken !== session.sessionToken) {
            console.error(`❌ Transaction ${result.transaction.hash} already used for another deposit session`);
            return;
          }

          await this.processConfirmedDeposit(session, result.actualAmountBTC || session.amount, result.transaction.hash);
        } else {
          console.log(`⏳ Waiting for more confirmations: ${result.confirmations}/${minConfirmations} for ${session.sessionToken}`);
        }
      } else {
        // Check if user confirmed they sent Bitcoin but no transaction found after timeout
        await this.checkForUnconfirmedClaims(session);
      }
    } catch (error) {
      console.error(`❌ Error verifying deposit session ${session.sessionToken}:`, error);
    }
  }

  // Check for sessions where user claimed to send Bitcoin but no transaction detected after timeout
  private async checkForUnconfirmedClaims(session: DepositSession): Promise<void> {
    try {
      // If user confirmed they sent Bitcoin but no transaction found
      if (session.userConfirmedSent) {
        const timeSinceClaim = new Date().getTime() - new Date(session.createdAt).getTime();
        const timeoutMinutes = 10; // 10 minutes after user claims they sent Bitcoin
        
        // If more than 10 minutes have passed since user claimed they sent Bitcoin
        if (timeSinceClaim > timeoutMinutes * 60 * 1000) {
          console.log(`⏰ No transaction found for ${session.sessionToken} after ${timeoutMinutes} minutes, declining...`);
          
          // Mark session as declined
          await storage.updateDepositSessionStatus(session.sessionToken, 'declined', new Date());
          
          // Create notification to user
          await storage.createNotification({
            userId: session.userId,
            title: '❌ Deposit Declined',
            message: `Your deposit session has been declined. No Bitcoin transaction was detected at the provided address after ${timeoutMinutes} minutes. Please ensure you sent the exact amount to the correct address and try again.`,
            type: 'error'
          });
          
          console.log(`❌ Deposit session ${session.sessionToken} declined - no transaction detected`);
        }
      }
    } catch (error) {
      console.error(`❌ Error checking unconfirmed claims for session ${session.sessionToken}:`, error);
    }
  }

  // Process a confirmed deposit
  private async processConfirmedDeposit(session: DepositSession, actualAmount: string, txHash: string): Promise<void> {
    try {
      console.log(`✅ Processing confirmed deposit for user ${session.userId}: ${actualAmount} USDT`);

      // SECURITY: Final fraud check before processing
      const fraudCheck = await this.performFinalFraudCheck(session, actualAmount, txHash);
      if (!fraudCheck.safe) {
        console.error(`🚨 FRAUD DETECTED - ${fraudCheck.reason}`);
        await storage.updateDepositSessionStatus(session.sessionToken, 'declined', new Date());
        await storage.createNotification({
          userId: session.userId,
          title: '⚠️ Deposit Security Alert',
          message: `Your deposit could not be processed due to security concerns. Please contact support. Reference: ${txHash.substring(0, 16)}`,
          type: 'error'
        });
        return;
      }

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

      // SECURITY: Create audit log entry
      console.log(`🔐 AUDIT: Deposit confirmed - User: ${session.userId}, Amount: $${actualAmount}, TxHash: ${txHash}, Session: ${session.sessionToken}`);

      // Create success notification
      await storage.createNotification({
        userId: session.userId,
        title: '💰 Deposit Confirmed!',
        message: `Your deposit of $${actualAmount} USDT has been confirmed and added to your balance.`,
        type: 'success'
      });

      // Sweep funds to vault address
      await this.sweepToVault(session, actualAmount, txHash);

      console.log(`✅ Deposit processed successfully for user ${session.userId}`);

    } catch (error) {
      console.error('❌ Error processing confirmed deposit:', error);
    }
  }

  // Final fraud detection before processing deposit
  private async performFinalFraudCheck(session: DepositSession, actualAmount: string, txHash: string): Promise<{
    safe: boolean;
    reason?: string;
  }> {
    try {
      // Check 1: Verify transaction hash hasn't been used before
      const existingSession = await storage.getDepositSessionByTxHash(txHash);
      if (existingSession && existingSession.sessionToken !== session.sessionToken) {
        return { safe: false, reason: 'Transaction hash already used for another deposit' };
      }

      // Check 2: Verify amount matches within tolerance
      const expectedAmount = parseFloat(session.amount);
      const receivedAmount = parseFloat(actualAmount);
      const tolerance = 0.01; // 1% tolerance
      
      if (Math.abs(receivedAmount - expectedAmount) > (expectedAmount * tolerance)) {
        return { safe: false, reason: `Amount mismatch: expected $${expectedAmount}, received $${receivedAmount}` };
      }

      // Check 3: Verify session hasn't expired
      if (new Date() > new Date(session.expiresAt)) {
        return { safe: false, reason: 'Session expired before confirmation' };
      }

      // Check 4: Verify this user's deposit pattern (prevent rapid multiple deposits)
      const userSessions = await storage.getUserDepositSessions(session.userId);
      const recentConfirmed = userSessions.filter(s => 
        s.status === 'confirmed' && 
        new Date(s.completedAt || 0).getTime() > (Date.now() - 3600000) // Last hour
      );
      
      if (recentConfirmed.length >= 5) {
        return { safe: false, reason: 'Suspicious activity: Too many deposits in short time' };
      }

      return { safe: true };
    } catch (error) {
      console.error('❌ Fraud check error:', error);
      return { safe: false, reason: 'Fraud check failed' };
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

  // Sweep deposited funds to vault address
  private async sweepToVault(session: DepositSession, actualAmount: string, depositTxHash: string): Promise<void> {
    try {
      console.log(`🏦 Initiating vault sweep for ${actualAmount} BTC from ${session.depositAddress}...`);

      // Get admin config with vault address
      const adminConfig = await storage.getAdminConfig();
      if (!adminConfig?.vaultAddress) {
        console.error('❌ No vault address configured in admin settings');
        return;
      }

      // SECURITY: Validate vault address format
      if (!this.isValidBitcoinAddress(adminConfig.vaultAddress)) {
        console.error('❌ Invalid vault address format');
        return;
      }

      // Get user's private key for the deposit address
      const user = await storage.getUser(session.userId);
      if (!user?.privateKey) {
        console.error(`❌ No private key found for user ${session.userId}`);
        return;
      }

      // SECURITY: Double-check transaction exists and has sufficient confirmations
      const txVerification = await this.verifyTransactionSecurity(depositTxHash, session.depositAddress, actualAmount);
      if (!txVerification.valid) {
        console.error(`❌ Transaction verification failed: ${txVerification.reason}`);
        return;
      }

      console.log(`✅ Vault sweep will be processed after enhanced verification`);
      console.log(`🔒 Security checks passed for transaction ${depositTxHash}`);
      
      // For now, we'll log the successful security check
      // The actual sweeping will be implemented with proper wallet integration
      await storage.updateDepositSessionVault(session.sessionToken, `pending_sweep_${Date.now()}`);
      
      console.log(`✅ Vault sweep initiated (security-enhanced)`);

    } catch (error) {
      console.error('❌ Error during vault sweep:', error);
    }
  }

  // Verify Bitcoin address format
  private isValidBitcoinAddress(address: string): boolean {
    // Basic Bitcoin address validation
    const p2pkhRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const bech32Regex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$/;
    return p2pkhRegex.test(address) || bech32Regex.test(address);
  }

  // Enhanced transaction security verification
  private async verifyTransactionSecurity(txHash: string, expectedAddress: string, expectedAmount: string): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    try {
      // Get fresh transaction data
      const txDetails = await this.getTransactionDetails(txHash);
      if (!txDetails) {
        return { valid: false, reason: 'Transaction not found' };
      }

      // Verify transaction has sufficient confirmations
      if (txDetails.confirmations < 2) {
        return { valid: false, reason: `Insufficient confirmations: ${txDetails.confirmations}` };
      }

      // Verify transaction outputs contain our address
      const hasExpectedOutput = txDetails.outputs.some(output => 
        output.addresses.includes(expectedAddress)
      );
      
      if (!hasExpectedOutput) {
        return { valid: false, reason: 'Address not found in transaction outputs' };
      }

      // Verify transaction amount matches
      const expectedSatoshis = this.btcToSatoshis(expectedAmount);
      const tolerance = 1000;
      const hasValidAmount = txDetails.outputs.some(output => {
        const outputValue = output.value;
        return output.addresses.includes(expectedAddress) &&
               outputValue >= (expectedSatoshis - tolerance) &&
               outputValue <= (expectedSatoshis + tolerance);
      });

      if (!hasValidAmount) {
        return { valid: false, reason: 'Amount mismatch' };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, reason: `Verification error: ${error}` };
    }
  }

  // Get UTXO information for a specific address and transaction
  private async getUTXOForAddress(address: string, txHash: string): Promise<{
    outputIndex: number;
    rawTransaction: string;
  } | null> {
    try {
      // Get transaction details
      const txDetails = await this.getTransactionDetails(txHash);
      if (!txDetails) {
        return null;
      }

      // Find the output that pays to our address
      let outputIndex = -1;
      for (let i = 0; i < txDetails.outputs.length; i++) {
        if (txDetails.outputs[i].addresses.includes(address)) {
          outputIndex = i;
          break;
        }
      }

      if (outputIndex === -1) {
        console.error(`❌ Could not find output for address ${address} in transaction ${txHash}`);
        return null;
      }

      // For BlockCypher, we need to construct the raw transaction differently
      // Since BlockCypher doesn't provide raw transaction hex in the standard API
      // We'll use a simpler approach for now
      const rawTx = 'placeholder_raw_tx'; // This would be replaced with actual implementation
      console.warn('⚠️ Raw transaction fetching not fully implemented - using placeholder');

      return {
        outputIndex,
        rawTransaction: rawTx
      };

    } catch (error) {
      console.error('❌ Error getting UTXO:', error);
      return null;
    }
  }

  // Get raw transaction hex
  private async getRawTransaction(txHash: string): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/txs/${txHash}?includeHex=true${this.apiKey ? `&token=${this.apiKey}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`BlockCypher API error: ${response.status}`);
      }

      const data = await response.json();
      return data.hex || null;
    } catch (error) {
      console.error('❌ Error getting raw transaction:', error);
      return null;
    }
  }

  // Broadcast a transaction to the Bitcoin network
  private async broadcastTransaction(txHex: string): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/txs/push${this.apiKey ? `?token=${this.apiKey}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tx: txHex })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Transaction broadcast failed:', errorData);
        return null;
      }

      const data = await response.json();
      return data.tx?.hash || null;
    } catch (error) {
      console.error('❌ Error broadcasting transaction:', error);
      return null;
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