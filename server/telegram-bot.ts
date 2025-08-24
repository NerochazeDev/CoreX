import TelegramBot from 'node-telegram-bot-api';

// Initialize Telegram Bot
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

let bot: TelegramBot | null = null;

if (botToken && channelId) {
  bot = new TelegramBot(botToken, { polling: false });
  console.log('✅ Telegram bot initialized successfully');
} else {
  console.warn('⚠️ Telegram bot credentials not found. Telegram notifications will be disabled.');
}

// Batch system for investment updates
interface BatchedInvestmentUpdate {
  investmentId: number;
  userId: number;
  userFirstName?: string;
  userLastName?: string;
  planName: string;
  profit: string;
  totalProfit: string;
  marketSource: string;
  timestamp: string;
}

interface BatchedNewInvestment {
  investmentId: number;
  userId: number;
  userFirstName?: string;
  userLastName?: string;
  planName: string;
  amount: string;
  duration: number;
  expectedROI: number;
  timestamp: string;
}

let batchedUpdates: BatchedInvestmentUpdate[] = [];
let batchedNewInvestments: BatchedNewInvestment[] = [];

interface InvestmentUpdate {
  investmentId: number;
  userId: number;
  userFirstName?: string;
  userLastName?: string;
  planName: string;
  profit: string;
  totalProfit: string;
  marketSource: string;
  transactionHash: string;
  timestamp: string;
}

interface NewInvestment {
  investmentId: number;
  userId: number;
  userFirstName?: string;
  userLastName?: string;
  planName: string;
  amount: string;
  duration: number;
  expectedROI: number;
  timestamp: string;
}

export function addInvestmentUpdateToBatch(update: InvestmentUpdate): void {
  batchedUpdates.push({
    investmentId: update.investmentId,
    userId: update.userId,
    userFirstName: update.userFirstName,
    userLastName: update.userLastName,
    planName: update.planName,
    profit: update.profit,
    totalProfit: update.totalProfit,
    marketSource: update.marketSource,
    timestamp: update.timestamp
  });
}

export function addNewInvestmentToBatch(investment: NewInvestment): void {
  batchedNewInvestments.push({
    investmentId: investment.investmentId,
    userId: investment.userId,
    userFirstName: investment.userFirstName,
    userLastName: investment.userLastName,
    planName: investment.planName,
    amount: investment.amount,
    duration: investment.duration,
    expectedROI: investment.expectedROI,
    timestamp: investment.timestamp
  });
}

export async function sendDailyStatsToChannel(): Promise<void> {
  if (!bot || !channelId) {
    console.log('Telegram bot not configured, skipping daily stats');
    return;
  }

  try {
    const message = `📊 *BITVAULT PRO DAILY REPORT*

🔥 *Platform Statistics*
⚡ Automated returns: *Active*
🎯 Investment plans: *3 Available*
💎 Returns frequency: *Every 10 minutes*
🚀 Success rate: *99.9%*

📈 *Available Plans:*
• *Starter:* 0.2% daily (30 days)
• *Growth:* 0.5% daily (60 days)  
• *Premium:* 0.8% daily (90 days)

💰 *Join thousands of successful investors*
🔐 *Bank-grade security guaranteed*

⏰ ${new Date().toLocaleString('en-US', { 
  timeZone: 'UTC',
  dateStyle: 'full',
  timeStyle: 'short'
})} UTC

\`#BitVaultPro #DailyReport #Bitcoin #Investing\``;

    await bot.sendMessage(channelId, message, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });
    
    console.log('📱 Daily stats sent to Telegram channel');
  } catch (error) {
    console.error('❌ Failed to send daily stats:', error);
  }
}

export async function sendBatchedUpdatesToChannel(): Promise<void> {
  if (!bot || !channelId) {
    console.log('Telegram bot not configured, skipping batch updates');
    return;
  }

  // Skip if no updates to send
  if (batchedUpdates.length === 0 && batchedNewInvestments.length === 0) {
    return;
  }

  try {
    let message = `📊 *BITVAULT PRO - 30 MINUTE SUMMARY*\n\n`;
    
    // Add new investments section
    if (batchedNewInvestments.length > 0) {
      message += `🌟 *NEW INVESTMENTS (${batchedNewInvestments.length})*\n`;
      
      let totalNewInvestments = 0;
      const planCounts: {[key: string]: number} = {};
      
      for (const investment of batchedNewInvestments) {
        totalNewInvestments += parseFloat(investment.amount);
        planCounts[investment.planName] = (planCounts[investment.planName] || 0) + 1;
        
        const userDisplay = investment.userFirstName 
          ? `${investment.userFirstName}${investment.userLastName ? ' ' + investment.userLastName : ''}` 
          : `User ${investment.userId}`;
          
        message += `• ${userDisplay}: ${investment.amount} BTC (${investment.planName})\n`;
      }
      
      message += `\n💰 *Total New Capital:* ${totalNewInvestments.toFixed(8)} BTC\n`;
      message += `📈 *Plan Distribution:*\n`;
      for (const [plan, count] of Object.entries(planCounts)) {
        message += `  • ${plan}: ${count} investment${count > 1 ? 's' : ''}\n`;
      }
      message += `\n`;
    }
    
    // Add profit updates section
    if (batchedUpdates.length > 0) {
      message += `💎 *PROFIT DISTRIBUTIONS (${batchedUpdates.length})*\n`;
      
      let totalProfitsGenerated = 0;
      const userProfits: {[key: number]: {name: string, profit: number}} = {};
      
      for (const update of batchedUpdates) {
        const profit = parseFloat(update.profit);
        totalProfitsGenerated += profit;
        
        const userDisplay = update.userFirstName 
          ? `${update.userFirstName}${update.userLastName ? ' ' + update.userLastName : ''}` 
          : `User ${update.userId}`;
          
        if (!userProfits[update.userId]) {
          userProfits[update.userId] = {name: userDisplay, profit: 0};
        }
        userProfits[update.userId].profit += profit;
      }
      
      message += `🚀 *Total Profits Generated:* ${totalProfitsGenerated.toFixed(8)} BTC\n`;
      message += `👥 *Profit Distribution by User:*\n`;
      for (const userData of Object.values(userProfits)) {
        message += `  • ${userData.name}: +${userData.profit.toFixed(8)} BTC\n`;
      }
      message += `\n`;
    }
    
    message += `⏰ *Summary Period:* Last 30 minutes\n`;
    message += `🔄 *Next Update:* In 30 minutes\n`;
    message += `💪 *Platform Status:* All systems operational\n\n`;
    message += `*Consistent returns delivered every 10 minutes* ⚡\n\n`;
    message += `\`#BitVaultPro #BatchUpdate #Bitcoin #ROI\``;

    await bot.sendMessage(channelId, message, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });
    
    console.log(`📱 Batch update sent: ${batchedUpdates.length} profit updates, ${batchedNewInvestments.length} new investments`);
    
    // Clear the batches after sending
    batchedUpdates = [];
    batchedNewInvestments = [];
    
  } catch (error) {
    console.error('❌ Failed to send batch updates:', error);
  }
}

export { bot };