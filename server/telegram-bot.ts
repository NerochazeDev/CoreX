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
  console.log('📊 Attempting to send daily stats to Telegram...');
  
  if (!bot || !channelId) {
    console.log('❌ Telegram bot not configured for daily stats');
    console.log('Bot token present:', !!botToken);
    console.log('Channel ID present:', !!channelId);
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
    
    console.log('📱 Daily stats sent to Telegram');
  } catch (error) {
    console.error('❌ Failed to send daily stats:', error);
  }
}

export async function sendBatchedUpdatesToChannel(): Promise<void> {
  console.log('🔍 Telegram Debug - Bot configured:', !!bot, 'Channel ID:', channelId);
  
  if (!bot || !channelId) {
    console.log('❌ Telegram bot not configured, skipping batch updates');
    console.log('Bot token present:', !!botToken);
    console.log('Channel ID present:', !!channelId);
    return;
  }

  try {
    console.log('📱 Attempting to send Telegram update...');
    
    // Always send for testing - remove the 30% chance temporarily
    // if (Math.random() > 0.3) {
    //   console.log('Skipping batch updates this round (30% chance)');
    //   return;
    // }

    // Get current Bitcoin price and platform stats
    const { storage } = await import('./storage');
    
    // Simple Bitcoin price fetching function
    const bitcoinPrice = await (async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,gbp,eur&include_24hr_change=true');
        if (!response.ok) throw new Error('API failed');
        const data = await response.json();
        const bitcoin = data.bitcoin;
        return {
          usd: { price: bitcoin.usd, change24h: bitcoin.usd_24h_change || 0 },
          gbp: { price: bitcoin.gbp, change24h: bitcoin.gbp_24h_change || 0 },
          eur: { price: bitcoin.eur, change24h: bitcoin.eur_24h_change || 0 }
        };
      } catch (error) {
        // Fallback prices
        return {
          usd: { price: 115400, change24h: -0.8 },
          gbp: { price: 85400, change24h: -0.8 },
          eur: { price: 98500, change24h: -0.8 }
        };
      }
    })();
    const allUsers = await storage.getAllUsers();
    const allInvestments = await storage.getAllInvestments();
    const activeInvestments = allInvestments.filter(inv => inv.isActive);
    
    // Calculate platform stats
    const totalPlatformInvestment = activeInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const totalPlatformProfit = activeInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0);
    
    // Get top performing investors
    const userProfits = new Map<number, { 
      user: any, 
      totalInvestment: number, 
      totalProfit: number, 
      roi: number,
      investments: any[]
    }>();
    
    // Calculate profits per user
    for (const investment of activeInvestments) {
      const userId = investment.userId;
      const user = allUsers.find(u => u.id === userId);
      if (!user) continue;
      
      const investmentAmount = parseFloat(investment.amount);
      const profitAmount = parseFloat(investment.currentProfit || '0');
      
      if (!userProfits.has(userId)) {
        userProfits.set(userId, {
          user,
          totalInvestment: 0,
          totalProfit: 0,
          roi: 0,
          investments: []
        });
      }
      
      const userStats = userProfits.get(userId)!;
      userStats.totalInvestment += investmentAmount;
      userStats.totalProfit += profitAmount;
      userStats.investments.push(investment);
    }
    
    // Calculate ROI and sort by profit
    const topInvestors = Array.from(userProfits.values())
      .map(stats => ({
        ...stats,
        roi: stats.totalInvestment > 0 ? (stats.totalProfit / stats.totalInvestment * 100) : 0
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 30); // Top 30 investors
    
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    const timeString = currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
    
    // Investment tiers for variety
    const tiers = ['Starter', 'Professional', 'VIP', 'Elite'];
    
    let message = `🏆 BITVAULT PRO • Investment Update\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📅 ${dateString} at ${timeString} UTC\n`;
    message += `₿ Bitcoin: $${bitcoinPrice.usd.price.toLocaleString()} USD\n`;
    message += `👥 Active Investors: ${Math.min(30, topInvestors.length)}/${allUsers.length} shown\n`;
    message += `💰 Total Platform Investment: $${(totalPlatformInvestment * bitcoinPrice.usd.price).toLocaleString()}\n`;
    message += `📈 Total Platform Profit: $${(totalPlatformProfit * bitcoinPrice.usd.price).toLocaleString()}\n\n`;
    
    if (topInvestors.length > 0) {
      message += `📊 TOP PERFORMING INVESTORS\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      
      topInvestors.forEach((investor, index) => {
        const rank = index + 1;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        const userName = `${investor.user.firstName} ${investor.user.lastName}`;
        const portfolioUSD = (investor.totalInvestment * bitcoinPrice.usd.price);
        const profitUSD = (investor.totalProfit * bitcoinPrice.usd.price);
        const tier = tiers[Math.floor(Math.random() * tiers.length)];
        
        message += `${rankEmoji} ${userName}\n`;
        message += `    🔹 Portfolio: $${portfolioUSD.toLocaleString()} | ROI: +${investor.roi.toFixed(1)}%\n`;
        message += `    🔹 Profit: $${profitUSD.toLocaleString()} (₿${investor.totalProfit.toFixed(6)})\n`;
        message += `    🔹 Tier: ${tier}\n\n`;
      });
    }
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💼 INSTITUTIONAL-GRADE BITCOIN INVESTING\n\n`;
    message += `🔐 Swiss-Level Security • 🏆 Proven Returns\n`;
    message += `📈 Smart Contract Automation • 🌍 Global Access\n\n`;
    message += `Join BitVault Pro's exclusive community\n`;
    message += `Where Bitcoin wealth is built systematically`;

    // Send message in chunks if too long (Telegram limit is 4096 characters)
    const maxLength = 4000;
    if (message.length <= maxLength) {
      await bot.sendMessage(channelId, message, { 
        disable_web_page_preview: true 
      });
    } else {
      // Split into header + top investors chunks
      const headerEnd = message.indexOf('📊 TOP PERFORMING INVESTORS');
      const header = message.substring(0, headerEnd);
      const investorsSection = message.substring(headerEnd);
      
      await bot.sendMessage(channelId, header, { 
        disable_web_page_preview: true 
      });
      
      // Send investors in smaller chunks
      const lines = investorsSection.split('\n');
      let chunk = '';
      for (const line of lines) {
        if ((chunk + line + '\n').length > maxLength) {
          if (chunk) {
            await bot.sendMessage(channelId, chunk, { 
              disable_web_page_preview: true 
            });
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }
          chunk = line + '\n';
        } else {
          chunk += line + '\n';
        }
      }
      if (chunk) {
        await bot.sendMessage(channelId, chunk, { 
          disable_web_page_preview: true 
        });
      }
    }

    console.log(`✅ Sent investment update to Telegram`);

    // Clear the batches
    batchedUpdates = [];
    batchedNewInvestments = [];
    
  } catch (error: any) {
    console.error('❌ Failed to send batch updates to Telegram:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
  }
}

export { bot };