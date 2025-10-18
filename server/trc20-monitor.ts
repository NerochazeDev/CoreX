import { storage } from './storage';
import { DepositSession } from '@shared/schema';
import { trc20WalletManager, USDT_TRC20_CONTRACT } from './trc20-wallet';

interface TRC20Transaction {
  transaction_id: string;
  token_info: {
    symbol: string;
    address: string;
    decimals: number;
    name: string;
  };
  block_timestamp: number;
  from: string;
  to: string;
  type: string;
  value: string;
  confirmations?: number;
}

interface TronGridResponse {
  success: boolean;
  data?: TRC20Transaction[];
  error?: string;
}

export class TRC20Monitor {
  private tronGridApiKey: string | undefined;
  private tronGridUrl: string;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.tronGridApiKey = process.env.TRONGRID_API_KEY;
    this.tronGridUrl = 'https://api.trongrid.io';
  }

  private sunToUsdt(sun: string): string {
    return (parseInt(sun) / 1000000).toFixed(2);
  }

  private usdtToSun(usdt: string): number {
    return Math.round(parseFloat(usdt) * 1000000);
  }

  async checkAddressForDeposit(address: string, expectedAmountUSD: string): Promise<{
    found: boolean;
    transaction?: TRC20Transaction;
    actualAmountUSD?: string;
    confirmations?: number;
  }> {
    try {
      console.log(`🔍 [TRC20] Checking address ${address} for deposit of $${expectedAmountUSD} USDT...`);
      
      const headers: Record<string, string> = {};
      if (this.tronGridApiKey) {
        headers['TRON-PRO-API-KEY'] = this.tronGridApiKey;
      }

      const url = `${this.tronGridUrl}/v1/accounts/${address}/transactions/trc20?limit=20&contract_address=${USDT_TRC20_CONTRACT}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️ TronGrid rate limit reached, retrying later...');
          return { found: false };
        }
        throw new Error(`TronGrid API error: ${response.status}`);
      }

      const result: TronGridResponse = await response.json();
      
      if (!result.success || !result.data || result.data.length === 0) {
        console.log(`📭 No TRC20 transactions found for address ${address}`);
        return { found: false };
      }

      const expectedSun = this.usdtToSun(expectedAmountUSD);
      const tolerance = 100000; // $0.10 tolerance for fees
      const now = Date.now();
      const maxAgeHours = 2;

      for (const tx of result.data.slice(0, 10)) {
        if (tx.to.toLowerCase() !== address.toLowerCase()) {
          continue;
        }

        const txAge = now - tx.block_timestamp;
        const txValue = parseInt(tx.value);

        if (
          tx.type === 'Transfer' &&
          txValue >= (expectedSun - tolerance) &&
          txValue <= (expectedSun + tolerance) &&
          txAge <= (maxAgeHours * 60 * 60 * 1000)
        ) {
          const confirmations = await this.getTransactionConfirmations(tx.transaction_id);
          
          console.log(`✅ [TRC20] Found matching deposit: ${tx.transaction_id} with $${this.sunToUsdt(tx.value)} USDT (${confirmations} confirmations)`);
          
          return {
            found: true,
            transaction: { ...tx, confirmations },
            actualAmountUSD: this.sunToUsdt(tx.value),
            confirmations
          };
        }
      }

      console.log(`❌ [TRC20] No matching deposits found for $${expectedAmountUSD} USDT on address ${address}`);
      return { found: false };

    } catch (error) {
      console.error('❌ [TRC20] Error checking address for deposit:', error);
      return { found: false };
    }
  }

  async getTransactionConfirmations(txHash: string): Promise<number> {
    try {
      const headers: Record<string, string> = {};
      if (this.tronGridApiKey) {
        headers['TRON-PRO-API-KEY'] = this.tronGridApiKey;
      }

      const url = `${this.tronGridUrl}/wallet/gettransactioninfobyid?value=${txHash}`;
      const response = await fetch(url, { 
        method: 'POST',
        headers 
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Could not get confirmations for ${txHash}`);
        return 0;
      }

      const txInfo = await response.json();
      
      if (!txInfo.blockNumber) {
        return 0;
      }

      const currentBlockUrl = `${this.tronGridUrl}/wallet/getnowblock`;
      const currentBlockResponse = await fetch(currentBlockUrl, {
        method: 'POST',
        headers
      });
      
      if (!currentBlockResponse.ok) {
        return 1;
      }

      const currentBlock = await currentBlockResponse.json();
      const confirmations = currentBlock.block_header?.raw_data?.number 
        ? currentBlock.block_header.raw_data.number - txInfo.blockNumber 
        : 1;

      return Math.max(1, confirmations);
    } catch (error) {
      console.error('❌ [TRC20] Error getting transaction confirmations:', error);
      return 1;
    }
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('🔄 [TRC20] Monitoring already running');
      return;
    }

    console.log('🚀 [TRC20] Starting TRON blockchain monitoring for deposit sessions...');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      await this.checkAllPendingDeposits();
      await this.expireOldSessions();
    }, 30000);

    await this.checkAllPendingDeposits();
    console.log('✅ [TRC20] Monitoring started successfully');
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    console.log('🛑 [TRC20] Stopping blockchain monitoring...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    console.log('✅ [TRC20] Monitoring stopped');
  }

  private async checkAllPendingDeposits(): Promise<void> {
    try {
      const pendingSessions = await storage.getActivePendingDepositSessions();
      
      if (pendingSessions.length === 0) {
        return;
      }

      console.log(`🔍 [TRC20] Checking ${pendingSessions.length} pending deposit sessions...`);

      for (const session of pendingSessions) {
        await this.verifyDepositSession(session);
      }
    } catch (error) {
      console.error('❌ [TRC20] Error checking pending deposits:', error);
    }
  }

  private async verifyDepositSession(session: DepositSession): Promise<void> {
    try {
      const result = await this.checkAddressForDeposit(session.depositAddress, session.amount);
      
      if (result.found && result.transaction && result.confirmations !== undefined) {
        await storage.updateDepositSessionBlockchain(
          session.sessionToken,
          result.transaction.transaction_id,
          result.confirmations,
          result.actualAmountUSD || session.amount
        );

        const minConfirmations = parseFloat(session.amount) >= 1000 ? 20 : 10;
        
        if (result.confirmations >= minConfirmations) {
          const existingSession = await storage.getDepositSessionByTxHash(result.transaction.transaction_id);
          if (existingSession && existingSession.sessionToken !== session.sessionToken) {
            console.error(`❌ [TRC20] Transaction ${result.transaction.transaction_id} already used for another deposit session`);
            return;
          }

          await this.processConfirmedDeposit(session, result.actualAmountUSD || session.amount, result.transaction.transaction_id);
        } else {
          console.log(`⏳ [TRC20] Waiting for more confirmations: ${result.confirmations}/${minConfirmations} for ${session.sessionToken}`);
        }
      } else {
        await this.checkForUnconfirmedClaims(session);
      }
    } catch (error) {
      console.error(`❌ [TRC20] Error verifying deposit session ${session.sessionToken}:`, error);
    }
  }

  private async checkForUnconfirmedClaims(session: DepositSession): Promise<void> {
    try {
      if (session.userConfirmedSent) {
        const timeSinceClaim = new Date().getTime() - new Date(session.createdAt).getTime();
        const timeoutMinutes = 15;
        
        if (timeSinceClaim > timeoutMinutes * 60 * 1000) {
          console.log(`⏰ [TRC20] No transaction found for ${session.sessionToken} after ${timeoutMinutes} minutes, declining...`);
          
          await storage.updateDepositSessionStatus(session.sessionToken, 'declined', new Date());
          
          await storage.createNotification({
            userId: session.userId,
            title: '❌ Deposit Declined',
            message: `Your deposit session has been declined. No USDT transaction was detected at the provided address after ${timeoutMinutes} minutes. Please ensure you sent the exact amount to the correct TRC20 address and try again.`,
            type: 'error'
          });
          
          console.log(`❌ [TRC20] Deposit session ${session.sessionToken} declined - no transaction detected`);
        }
      }
    } catch (error) {
      console.error(`❌ [TRC20] Error checking unconfirmed claims for session ${session.sessionToken}:`, error);
    }
  }

  private async processConfirmedDeposit(session: DepositSession, actualAmount: string, txHash: string): Promise<void> {
    try {
      console.log(`💰 [TRC20] Processing confirmed deposit for session ${session.sessionToken}`);

      const fraudCheck = await this.performFinalFraudCheck(session, actualAmount, txHash);
      if (!fraudCheck.safe) {
        console.error(`🚨 [TRC20] FRAUD DETECTED: ${fraudCheck.reason}`);
        await storage.updateDepositSessionStatus(session.sessionToken, 'declined', new Date());
        await storage.createNotification({
          userId: session.userId,
          title: '🚨 Deposit Declined - Security Alert',
          message: `Your deposit was declined due to security concerns: ${fraudCheck.reason}. Please contact support if you believe this is an error.`,
          type: 'error'
        });
        return;
      }

      await storage.updateDepositSessionStatus(session.sessionToken, 'confirmed', new Date());

      const user = await storage.getUser(session.userId);
      if (user) {
        const currentBalance = parseFloat(user.balance);
        const depositAmount = parseFloat(actualAmount);
        const newBalance = (currentBalance + depositAmount).toFixed(2);
        
        await storage.updateUserBalance(session.userId, newBalance);

        await storage.createNotification({
          userId: session.userId,
          title: '✅ Deposit Confirmed',
          message: `Your deposit of $${actualAmount} USDT has been confirmed and added to your account. Transaction: ${txHash.substring(0, 10)}...`,
          type: 'success'
        });

        console.log(`✅ [TRC20] Deposit confirmed for user ${session.userId}: $${actualAmount} USDT`);

        // Send Telegram notification to admin
        await this.sendAdminTelegramNotification(user, actualAmount, txHash, 'deposit');

        // Automatically sweep funds to vault
        await this.sweepToVault(session, actualAmount, txHash, user.id);
      }
    } catch (error) {
      console.error(`❌ [TRC20] Error processing confirmed deposit:`, error);
    }
  }

  private async sendAdminTelegramNotification(user: any, amount: string, txHash: string, type: 'deposit' | 'withdrawal'): Promise<void> {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

      if (!botToken || !adminChatId) {
        console.log('⚠️ Telegram admin notifications disabled - missing credentials');
        return;
      }

      const emoji = type === 'deposit' ? '💰' : '💸';
      const title = type === 'deposit' ? 'New Deposit Received' : 'Withdrawal Request';
      
      const message = `${emoji} *${title}*

👤 *User:* ${user.firstName || ''} ${user.lastName || ''}
📧 *Email:* ${user.email}
🆔 *User ID:* ${user.id}
💵 *Amount:* $${amount} USDT
🔗 *TX Hash:* \`${txHash}\`
📅 *Time:* ${new Date().toLocaleString()}

${type === 'deposit' ? '✅ Deposit confirmed and credited to user account' : '⏳ Awaiting admin approval'}`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      if (response.ok) {
        console.log(`✅ Admin Telegram notification sent for ${type}`);
      } else {
        console.error(`❌ Failed to send admin Telegram notification:`, await response.text());
      }
    } catch (error) {
      console.error('❌ Error sending admin Telegram notification:', error);
    }
  }

  private async sweepToVault(session: DepositSession, actualAmount: string, depositTxHash: string, userId: number): Promise<void> {
    try {
      console.log(`🏦 [TRC20] Initiating vault sweep for ${actualAmount} USDT from ${session.depositAddress}...`);

      const config = await storage.getAdminConfig();
      if (!config?.trc20VaultAddress) {
        console.error('❌ [TRC20] No vault address configured');
        return;
      }

      if (!config?.trc20HdSeed) {
        console.error('❌ [TRC20] No HD seed configured');
        return;
      }

      // Import TRC20 withdrawal service for sweeping
      const { trc20WithdrawalService } = await import('./trc20-withdrawal');

      console.log(`🔐 [TRC20] Sweeping from user address index ${userId} to vault ${config.trc20VaultAddress}`);

      // Use the user's deposit address private key to send funds to vault
      const sweepResult = await trc20WithdrawalService.sendTRC20USDT(
        config.trc20HdSeed,
        userId, // User ID is the derivation index
        config.trc20VaultAddress,
        actualAmount
      );

      if (sweepResult.success && sweepResult.txHash) {
        console.log(`✅ [TRC20] Vault sweep successful: ${sweepResult.txHash}`);
        
        // Update session with vault transaction hash (internal record only)
        await storage.updateDepositSessionVault(session.sessionToken, sweepResult.txHash);

        console.log(`✅ [TRC20] Vault sweep complete for session ${session.sessionToken}`);
      } else {
        console.error(`❌ [TRC20] Vault sweep failed: ${sweepResult.error}`);
        
        // Log the failure internally - funds are still safe in user's address
        // No user notification - this is an internal operational process
        console.log(`⚠️ [TRC20] Vault sweep will be retried for session ${session.sessionToken}`);
      }
    } catch (error) {
      console.error('❌ [TRC20] Error during vault sweep:', error);
    }
  }

  private async performFinalFraudCheck(session: DepositSession, actualAmount: string, txHash: string): Promise<{
    safe: boolean;
    reason?: string;
  }> {
    try {
      const existingSession = await storage.getDepositSessionByTxHash(txHash);
      if (existingSession && existingSession.sessionToken !== session.sessionToken) {
        return { safe: false, reason: 'Transaction hash already used for another deposit' };
      }

      const expectedAmount = parseFloat(session.amount);
      const receivedAmount = parseFloat(actualAmount);
      const tolerance = 0.02;
      
      if (Math.abs(receivedAmount - expectedAmount) > (expectedAmount * tolerance)) {
        return { safe: false, reason: `Amount mismatch: expected $${expectedAmount}, received $${receivedAmount}` };
      }

      if (new Date() > new Date(session.expiresAt)) {
        return { safe: false, reason: 'Session expired before confirmation' };
      }

      const userSessions = await storage.getUserDepositSessions(session.userId);
      const recentConfirmed = userSessions.filter(s => 
        s.status === 'confirmed' && 
        new Date(s.completedAt || 0).getTime() > (Date.now() - 3600000)
      );
      
      if (recentConfirmed.length >= 5) {
        return { safe: false, reason: 'Suspicious activity: Too many deposits in short time' };
      }

      return { safe: true };
    } catch (error) {
      console.error('❌ [TRC20] Fraud check error:', error);
      return { safe: false, reason: 'Fraud check failed' };
    }
  }

  private async expireOldSessions(): Promise<void> {
    try {
      await storage.expireDepositSessions();
    } catch (error) {
      console.error('❌ [TRC20] Error expiring old sessions:', error);
    }
  }
}

export const trc20Monitor = new TRC20Monitor();
