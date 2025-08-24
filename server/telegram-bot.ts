import TelegramBot from 'node-telegram-bot-api';

// Main Telegram Bot - Handles channel updates only
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

let bot: TelegramBot | null = null;
let isInitializing = false;
let isShuttingDown = false;
let instanceId = Math.random().toString(36).substring(7);

// Global bot registry to prevent multiple instances
const GLOBAL_BOT_KEY = 'TELEGRAM_BOT_INSTANCE';
if (!(global as any)[GLOBAL_BOT_KEY]) {
  (global as any)[GLOBAL_BOT_KEY] = null;
}

function setGlobalBot(botInstance: TelegramBot | null) {
  (global as any)[GLOBAL_BOT_KEY] = botInstance;
}

function getGlobalBot(): TelegramBot | null {
  return (global as any)[GLOBAL_BOT_KEY];
}

// Function to cleanup existing bot instance
async function cleanupBot(): Promise<void> {
  const currentGlobalBot = getGlobalBot();
  
  // Clean up local instance
  if (bot) {
    try {
      await bot.stopPolling({ cancel: true, reason: 'Cleaning up instance' });
      console.log(`🧹 Local bot instance ${instanceId} cleaned up`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error: any) {
      console.log('⚠️ Local cleanup error (expected):', error.message);
    }
    bot = null;
  }
  
  // Clean up global instance if it exists and is different
  if (currentGlobalBot && currentGlobalBot !== bot) {
    try {
      await currentGlobalBot.stopPolling({ cancel: true, reason: 'Global cleanup' });
      console.log('🧹 Global bot instance cleaned up');
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error: any) {
      console.log('⚠️ Global cleanup error (expected):', error.message);
    }
  }
  
  setGlobalBot(null);
}

// Function to initialize bot with proper error handling
async function initializeTelegramBot(): Promise<void> {
  if (isInitializing || isShuttingDown) {
    console.log('⏸️ Bot initialization skipped - already initializing or shutting down');
    return;
  }
  
  // Check if there's already a global instance running
  const existingGlobalBot = getGlobalBot();
  if (existingGlobalBot) {
    console.log('♻️ Using existing global bot instance');
    bot = existingGlobalBot;
    return;
  }
  
  isInitializing = true;
  
  try {
    console.log(`🤖 Initializing bot instance ${instanceId}...`);
    
    // Cleanup any existing bot instances
    await cleanupBot();
    
    // Wait longer to ensure Telegram API clears the polling lock
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create bot instance with no polling initially
    bot = new TelegramBot(botToken!, { 
      polling: false
    });
    
    // Set as global instance immediately
    setGlobalBot(bot);
    
    // Start polling with safer settings
    await bot.startPolling({
      restart: false,
      polling: {
        interval: 8000, // Longer interval to reduce conflicts
        autoStart: false,
        params: {
          timeout: 15, // Shorter timeout
          allowed_updates: [] // No specific updates to reduce traffic
        }
      }
    });
    
    console.log(`✅ Telegram bot ${instanceId} initialized and polling started`);
    isInitializing = false;
    
    // Handle polling errors gracefully with exponential backoff
    let conflictRetries = 0;
    const maxConflictRetries = 3;
    
    bot.on('polling_error', (error: any) => {
      console.log('🔄 Telegram polling error:', error.code);
      
      // If it's a conflict error, use exponential backoff
      if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        conflictRetries++;
        
        if (conflictRetries > maxConflictRetries) {
          console.log('⛔ Max conflict retries reached. Stopping bot initialization.');
          if (bot) {
            bot.stopPolling({ cancel: true, reason: 'Max retries exceeded' }).catch(() => {});
            bot = null;
            setGlobalBot(null);
          }
          isInitializing = false;
          return;
        }
        
        console.log(`🔄 Conflict detected (retry ${conflictRetries}/${maxConflictRetries}), stopping bot...`);
        
        // Stop current bot instance
        if (bot) {
          bot.stopPolling({ cancel: true, reason: 'Conflict resolution' }).catch(() => {});
          bot = null;
          setGlobalBot(null);
        }
        
        isInitializing = false;
        
        // Exponential backoff: 45s, 90s, 180s
        const backoffDelay = 45000 * Math.pow(2, conflictRetries - 1);
        console.log(`⏳ Waiting ${backoffDelay/1000} seconds before retry...`);
        
        setTimeout(() => {
          if (!isShuttingDown) {
            console.log('🔄 Attempting bot reinitialization after backoff...');
            initializeTelegramBot().catch(err => {
              console.log('❌ Failed to reinitialize bot:', err.message);
            });
          }
        }, backoffDelay);
      } else {
        // For non-conflict errors, just log them
        console.log('⚠️ Non-conflict polling error:', error.message);
      }
    });
    
    // Main bot handles only channel updates - no member interactions
    
    // Handle general errors
    bot.on('error', (error) => {
      console.log('❌ Telegram bot error:', error.message);
    });
    
  } catch (error: any) {
    console.error('❌ Failed to initialize Telegram bot:', error.message);
    isInitializing = false;
    bot = null;
  }
}

// Process cleanup handlers
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down bot gracefully...');
  isShuttingDown = true;
  await cleanupBot();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down bot gracefully...');
  isShuttingDown = true;
  await cleanupBot();
  process.exit(0);
});

// Delayed initialization to avoid conflicts on startup
if (botToken && channelId) {
  // Wait a bit before initializing to let any existing instances clean up
  setTimeout(() => {
    if (!isShuttingDown) {
      initializeTelegramBot().catch(error => {
        console.error('❌ Bot initialization failed:', error.message);
      });
    }
  }, 5000); // 5-second delay
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
  console.log('📊 Attempting to send 8-hour update to Telegram...');
  
  if (!bot || !channelId) {
    console.log('❌ Telegram bot not configured for updates');
    console.log('Bot token present:', !!botToken);
    console.log('Channel ID present:', !!channelId);
    return;
  }

  try {
    // Try to send banner with fallback options
    const bannerPaths = [
      './attached_assets/IMG_6814_1756042561574.jpeg',
      './attached_assets/generated_images/BitVault_Pro_investment_update_banner_faf1b1f8.png',
      './attached_assets/generated_images/Advanced_BitVault_Pro_themed_banner_5a7ca930.png',
      './attached_assets/generated_images/Perfect_BitVault_Pro_themed_banner_2214a6e2.png'
    ];
    
    let bannerSent = false;
    for (const bannerPath of bannerPaths) {
      try {
        console.log(`📷 Attempting to send banner: ${bannerPath}`);
        await bot.sendPhoto(channelId, bannerPath, {
          caption: `📊 **BITVAULT PRO INVESTMENT UPDATE** 📊`,
          parse_mode: 'Markdown'
        });
        console.log('✅ Investment update banner sent successfully');
        bannerSent = true;
        break;
      } catch (bannerError: any) {
        console.log(`⚠️ Failed to send banner ${bannerPath}:`, bannerError.message);
        continue;
      }
    }
    
    if (!bannerSent) {
      console.log('📝 All banner attempts failed, continuing with text-only update...');
    }
    
    // Small delay then send the update message
    await new Promise(resolve => setTimeout(resolve, 1000));

    const message = `🚀 *BITVAULT PRO - 8 HOUR UPDATE*

🔥 *Platform Status*
⚡ Automated returns: *ACTIVE*
🎯 Investment plans: *4 AVAILABLE*
💎 Profit distribution: *Every 10 minutes*
🚀 Success rate: *99.9%*
📈 Bitcoin performance: *Tracking live*

💰 *Investment Opportunities:*
🔷 *Foundation:* 0.5% daily (15% total in 30 days)
🔶 *Growth:* 0.83% daily (25% total in 60 days)  
🔸 *Premium:* 1.16% daily (35% total in 90 days)
💎 *Institutional:* 1.94% daily (50% total in 180 days)

✨ *Join thousands of successful investors earning passive Bitcoin income*
🔐 *Military-grade security & instant withdrawals*

⏰ Update Time: ${new Date().toLocaleString('en-US', { 
  timeZone: 'UTC',
  dateStyle: 'full',
  timeStyle: 'short'
})} UTC

🚀 **Ready to multiply your Bitcoin holdings?**

\`#BitVaultPro #Bitcoin #PassiveIncome #InvestmentUpdate\``;

    await bot.sendMessage(channelId, message, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });
    
    console.log('📱 8-hour update with banner sent to Telegram');
  } catch (error) {
    console.error('❌ Failed to send update:', error);
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
    
    // First send the banner image upfront
    const bannerPath = './attached_assets/IMG_6814_1756042561574.jpeg';
    try {
      console.log(`📷 Sending banner upfront: ${bannerPath}`);
      await bot.sendPhoto(channelId, bannerPath, {
        caption: `📊 **BITVAULT PRO INVESTMENT UPDATE** 📊`,
        parse_mode: 'Markdown'
      });
      console.log('✅ Investment update banner sent successfully upfront');
      // Small delay before sending the text update
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (bannerError: any) {
      console.log(`⚠️ Failed to send banner upfront:`, bannerError.message);
      console.log('📝 Continuing with text-only update...');
    }
    
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

// Welcome bot functionality removed - main bot focuses only on channel updates

export { bot };