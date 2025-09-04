import TelegramBot from 'node-telegram-bot-api';
import { broadcastQueue } from './broadcast-queue';

// Clean Telegram Bot Implementation - No polling conflicts
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

// Simple bot instance - no polling, webhook-ready
let bot: TelegramBot | null = null;

// Initialize bot only when needed, without polling
function initBot(): TelegramBot | null {
  if (!botToken || !channelId) {
    console.warn('⚠️ Telegram credentials missing - notifications disabled');
    return null;
  }

  if (!bot) {
    bot = new TelegramBot(botToken, { polling: false }); // No polling = no conflicts
    console.log('✅ Telegram bot initialized (webhook mode)');
  }

  return bot;
}

// Send message to channel with enhanced retry logic
async function sendToChannel(message: string, options: any = {}, retries: number = 3): Promise<boolean> {
  const botInstance = initBot();
  if (!botInstance || !channelId) return false;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await botInstance.sendMessage(channelId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options
      });
      if (attempt > 1) {
        console.log(`✅ Telegram message sent successfully on attempt ${attempt}`);
      }
      return true;
    } catch (error: any) {
      if (attempt === retries) {
        console.error(`❌ Telegram message failed after ${retries} attempts:`, error.message);
        return false;
      } else {
        console.warn(`⚠️ Telegram message attempt ${attempt} failed, retrying in ${attempt * 2}s:`, error.message);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Exponential backoff
      }
    }
  }
  return false;
}

// Send photo to channel with enhanced retry logic
async function sendPhotoToChannel(photoPath: string, caption?: string, retries: number = 3): Promise<boolean> {
  const botInstance = initBot();
  if (!botInstance || !channelId) return false;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await botInstance.sendPhoto(channelId, photoPath, {
        caption: caption || '',
        parse_mode: 'Markdown'
      });
      if (attempt > 1) {
        console.log(`✅ Telegram photo sent successfully on attempt ${attempt}`);
      }
      return true;
    } catch (error: any) {
      if (attempt === retries) {
        console.error(`❌ Telegram photo failed after ${retries} attempts:`, error.message);
        return false;
      } else {
        console.warn(`⚠️ Telegram photo attempt ${attempt} failed, retrying in ${attempt * 2}s:`, error.message);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Exponential backoff
      }
    }
  }
  return false;
}

// Investment update functions with enhanced tracking
let updateBatchCount = 0;
let newInvestmentBatchCount = 0;

export function addInvestmentUpdateToBatch(update: any): void {
  updateBatchCount++;
  // Reduced logging frequency - only log every 100th update for cleaner logs
  if (updateBatchCount % 100 === 0) {
    console.log(`📊 Investment updates processed: ${updateBatchCount} total updates`);
  }
}

export function addNewInvestmentToBatch(investment: any): void {
  newInvestmentBatchCount++;
  // Only log significant new investments to reduce noise
  if (parseFloat(investment.amount || '0') > 0.01) {
    console.log(`💰 Significant new investment #${newInvestmentBatchCount}: ${investment.amount} BTC`);
  }
}

// Get batch statistics for monitoring
export function getBatchStatistics(): { updates: number; newInvestments: number } {
  return {
    updates: updateBatchCount,
    newInvestments: newInvestmentBatchCount
  };
}

// Enhanced broadcast functions using queue system
export async function queueDailyStats(): Promise<string> {
  return broadcastQueue.addMessage({
    type: 'text',
    content: 'DAILY_STATS_PLACEHOLDER', // Will be generated when processed
    priority: 'high',
    maxRetries: 3
  });
}

export async function queueInvestmentUpdate(): Promise<string> {
  const bannerPath = './attached_assets/IMG_6814_1756042561574.jpeg';
  
  // Queue banner first
  const bannerId = broadcastQueue.addMessage({
    type: 'photo',
    content: '🚨 **PROFIT ALERT!** 🚨\n💰 BITVAULT PRO MONEY MACHINE IS GOING CRAZY! 💰',
    photoPath: bannerPath,
    priority: 'normal',
    maxRetries: 3
  });

  // Queue follow-up message scheduled 5 seconds later
  const messageId = broadcastQueue.addMessage({
    type: 'text',
    content: 'INVESTMENT_UPDATE_PLACEHOLDER', // Will be generated when processed
    priority: 'normal',
    maxRetries: 3,
    scheduledAt: new Date(Date.now() + 5000) // 5 seconds delay
  });

  return `${bannerId},${messageId}`;
}

// Get broadcast queue status
export function getBroadcastStatus(): { pending: number; processing: boolean; nextScheduled?: Date } {
  return broadcastQueue.getStatus();
}

// Generate activity chart for investment plan
function generateActivityChart(activityPercent: number): string {
  const maxBars = 10;
  const filledBars = Math.round((activityPercent / 100) * maxBars);
  const emptyBars = maxBars - filledBars;

  return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
}

// Send daily stats to channel with 0.9% growth increment
export async function sendDailyStatsToChannel(): Promise<void> {
  console.log('📊 Sending daily stats to Telegram with 0.9% growth...');

  try {
    // Import storage here to avoid circular dependencies
    const { storage } = await import('./storage');

    // Calculate platform statistics
    const allUsers = await storage.getAllUsers();
    const allInvestments = await storage.getAllInvestments();
    const investmentPlans = await storage.getInvestmentPlans();

    // Get baseline values from database for daily stats
    const adminConfiguration = await storage.getAdminConfig();
    let baselineUsers = adminConfiguration?.baselineUsers || 420;
    let baselineActiveInvestments = adminConfiguration?.baselineActiveInvestments || 804;
    let baselineTotalBalance = parseFloat(adminConfiguration?.baselineTotalBalance || '70275.171605');
    let baselineTotalProfit = parseFloat(adminConfiguration?.baselineTotalProfit || '460.347340');

    // Apply 0.9% growth to baseline statistics
    const growthRate = 1.009; // 0.9% increase
    baselineUsers = Math.floor(baselineUsers * growthRate);
    baselineActiveInvestments = Math.floor(baselineActiveInvestments * growthRate);
    baselineTotalBalance = baselineTotalBalance * growthRate;
    baselineTotalProfit = baselineTotalProfit * growthRate;

    // Update the baseline values in database for persistence
    await storage.updateBaselineStatistics({
      baselineUsers,
      baselineActiveInvestments,
      baselineTotalBalance: baselineTotalBalance.toFixed(8),
      baselineTotalProfit: baselineTotalProfit.toFixed(8)
    });

    console.log(`📈 Applied 0.9% growth: Users +${Math.floor((baselineUsers / growthRate) * 0.009)}, Investments +${Math.floor((baselineActiveInvestments / growthRate) * 0.009)}, Balance +${(baselineTotalBalance * 0.009).toFixed(4)} BTC`);

    // Plan baseline data from database for daily stats
    const planBaselines: Record<string, { active: number; amount: number; profit: number }> = {
      'Growth Plan': { 
        active: adminConfiguration?.growthPlanActive || 227, 
        amount: parseFloat(adminConfiguration?.growthPlanAmount || '11004.9901'), 
        profit: parseFloat(adminConfiguration?.growthPlanProfit || '101.649889') 
      },
      'Institutional Plan': { 
        active: adminConfiguration?.institutionalPlanActive || 210, 
        amount: parseFloat(adminConfiguration?.institutionalPlanAmount || '9228.4977'), 
        profit: parseFloat(adminConfiguration?.institutionalPlanProfit || '205.248890') 
      },
      'Premium Plan': { 
        active: adminConfiguration?.premiumPlanActive || 198, 
        amount: parseFloat(adminConfiguration?.premiumPlanAmount || '9274.8974'), 
        profit: parseFloat(adminConfiguration?.premiumPlanProfit || '114.419514') 
      },
      'Foundation Plan': { 
        active: adminConfiguration?.foundationPlanActive || 169, 
        amount: parseFloat(adminConfiguration?.foundationPlanAmount || '7436.5081'), 
        profit: parseFloat(adminConfiguration?.foundationPlanProfit || '39.029047') 
      }
    };

    // Calculate current database totals
    const dbTotalBalance = allUsers.reduce((sum, user) => {
      return sum + parseFloat(user.balance);
    }, 0);

    const dbTotalProfit = allInvestments.reduce((sum, investment) => {
      return sum + parseFloat(investment.currentProfit || '0');
    }, 0);

    const dbActiveInvestments = allInvestments.filter(inv => inv.isActive);

    // Use dynamic values: baseline + current database activity
    const totalUsers = baselineUsers + allUsers.length;
    const totalBalance = baselineTotalBalance + dbTotalBalance;
    const totalProfit = baselineTotalProfit + dbTotalProfit;
    const activeInvestments = baselineActiveInvestments + dbActiveInvestments.length;

    // Get current Bitcoin price for USD conversions
    let bitcoinPrice = 67000; // Default fallback
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      if (response.ok) {
        const data = await response.json();
        bitcoinPrice = data.bitcoin.usd;
      }
    } catch (error) {
      console.log('Using fallback Bitcoin price for stats');
    }

    const totalBalanceUSD = totalBalance * bitcoinPrice;
    const totalProfitUSD = totalProfit * bitcoinPrice;

    // Calculate plan-specific statistics with baseline values
    const planStats = investmentPlans.map(plan => {
      const planInvestments = allInvestments.filter(inv => inv.planId === plan.id && inv.isActive);
      const dbPlanAmount = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      const dbPlanProfit = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0);

      // Get baseline data for this plan
      const baseline = planBaselines[plan.name] || { active: 0, amount: 0, profit: 0 };

      // Combine baseline with database values
      const planActiveCount = baseline.active + planInvestments.length;
      const planTotalAmount = baseline.amount + dbPlanAmount;
      const planTotalProfit = baseline.profit + dbPlanProfit;

      // Calculate activity percentage based on total active investments
      const activityPercent = Math.min(100, (planActiveCount / Math.max(1, activeInvestments)) * 100);

      return {
        plan,
        activeCount: planActiveCount,
        totalAmount: planTotalAmount,
        totalProfit: planTotalProfit,
        activityPercent,
        chart: generateActivityChart(activityPercent)
      };
    });

    // Sort plans by activity level
    planStats.sort((a, b) => b.activityPercent - a.activityPercent);

    let message = `🚀 **BITVAULT PRO IS ON FIRE!** 🔥

💰 **ANOTHER INSANE DAY OF PROFITS!** 💰
${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })}

🎯 **TODAY'S EXPLOSIVE NUMBERS:**
🔸 **${totalUsers.toLocaleString()} INVESTORS** are getting RICH with us! 📈
🔸 **${totalBalance.toFixed(4)} BTC** under management = **$${(totalBalance * bitcoinPrice).toLocaleString()}** 💵
🔸 **${totalProfit.toFixed(4)} BTC** in PURE PROFIT = **$${(totalProfit * bitcoinPrice).toLocaleString()}** made TODAY! 🤑
🔸 **${activeInvestments.toLocaleString()} ACTIVE MONEY-MAKING MACHINES** working 24/7! ⚡

💎 **WHICH INVESTMENT PLAN IS MAKING BANK?** 💎`;

    // Add plan statistics with exciting formatting
    planStats.forEach((stat, index) => {
      const performance = stat.activityPercent > 75 ? '🔥 CRUSHING IT!' : stat.activityPercent > 50 ? '💪 SOLID GAINS' : '🎯 STEADY PROFIT';
      const rankEmoji = index === 0 ? '👑 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `🏆 #${index + 1}`;
      message += `\n\n${rankEmoji} **${stat.plan.name}** - ${stat.plan.roiPercentage}% RETURNS! 💸`;
      message += `\n${performance} | ${stat.activeCount} Smart Investors Making Money! 🤑`;
      message += `\nTotal: ${stat.totalAmount.toFixed(4)} BTC | Profits: +${stat.totalProfit.toFixed(6)} BTC 📈`;
    });

    message += `

⚡ **WHY BITVAULT PRO IS DOMINATING:**
✅ 24/7 AI-POWERED Bitcoin trading robots working for YOU!
✅ MILITARY-GRADE security - Your money is SAFER than in banks!
✅ INSTANT withdrawals - Get your profits ANYTIME!
✅ ZERO hidden fees - Keep ALL your profits!

🚨 **SYSTEM STATUS: ALL GREEN - MONEY MACHINE RUNNING!** 🚨
🔐 **SECURITY: FORT KNOX LEVEL - UNBREACHABLE!**
📜 **100% LEGAL & REGULATED - TRUSTED BY THOUSANDS!**

💎 **BitVault Pro - Turn Your Bitcoin Into A PROFIT MACHINE!** 💎

🔥 **JOIN THE MONEY REVOLUTION TODAY!** 🔥`;

    const success = await sendToChannel(message);
    if (success) {
      console.log('✅ Daily stats with investment plan charts sent to Telegram');
    } else {
      console.log('❌ Failed to send daily stats - will attempt fallback message');
      // Send exciting fallback message if main message fails
      const simpleFallback = `🔥 **BITVAULT PRO IS CRUSHING IT!** 🔥

💥 **${new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric'
      })}** 💥

🚀 PLATFORM STATUS: MAKING MONEY 24/7!
📈 ALL STRATEGIES: PURE PROFIT MODE ACTIVATED!
🛡️ SECURITY: FORT KNOX LEVEL - 100% SAFE!
💰 PROFIT MACHINE: RUNNING AT MAXIMUM POWER!

💎 **YOUR BITCOIN IS GETTING RICHER BY THE MINUTE!** 💎`;
      
      await sendToChannel(simpleFallback);
    }
  } catch (error: any) {
    console.error('❌ Failed to calculate platform stats:', error.message);
    // Send basic message if stats calculation fails
    const fallbackMessage = `🏦 **BITVAULT PRO** • Daily Operations Report

**${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })}**

**Platform Status:**
✓ All investment strategies operational
✓ Portfolio management systems active
✓ Risk management protocols engaged
✓ Client services fully operational

**Market Operations:**
• Continuous monitoring of Bitcoin market conditions
• Active portfolio optimization and rebalancing
• Professional wealth management services deployed
• Institutional-grade security measures maintained

*BitVault Pro - Professional cryptocurrency investment management*`;

    await sendToChannel(fallbackMessage);
  }
}

// Send batched updates to channel  
export async function sendBatchedUpdatesToChannel(): Promise<void> {
  console.log('📱 Sending investment updates to Telegram...');

  try {
    // Send banner first
    const bannerPath = './attached_assets/IMG_6814_1756042561574.jpeg';
    const bannerSent = await sendPhotoToChannel(bannerPath, '🚨 **PROFIT ALERT!** 🚨\n💰 BITVAULT PRO MONEY MACHINE IS GOING CRAZY! 💰');

    if (bannerSent) {
      console.log('✅ Investment banner sent');

      // Wait 5 seconds then send update message with platform stats
      setTimeout(async () => {
        try {
          // Import storage here to avoid circular dependencies
          const { storage } = await import('./storage');

          // Calculate platform statistics
          const allUsers = await storage.getAllUsers();
          const allInvestments = await storage.getAllInvestments();

          // Get baseline values from database for live updates with 0.9% growth
          const adminConfiguration = await storage.getAdminConfig();
          let baselineUsers = adminConfiguration?.baselineUsers || 420;
          let baselineActiveInvestments = adminConfiguration?.baselineActiveInvestments || 804;
          let baselineTotalBalance = parseFloat(adminConfiguration?.baselineTotalBalance || '70275.171605');
          let baselineTotalProfit = parseFloat(adminConfiguration?.baselineTotalProfit || '460.347340');

          // Apply 0.9% growth to baseline statistics for investment updates
          const growthRate = 1.009; // 0.9% increase
          baselineUsers = Math.floor(baselineUsers * growthRate);
          baselineActiveInvestments = Math.floor(baselineActiveInvestments * growthRate);
          baselineTotalBalance = baselineTotalBalance * growthRate;
          baselineTotalProfit = baselineTotalProfit * growthRate;

          // Update the baseline values in database
          await storage.updateBaselineStatistics({
            baselineUsers,
            baselineActiveInvestments,
            baselineTotalBalance: baselineTotalBalance.toFixed(8),
            baselineTotalProfit: baselineTotalProfit.toFixed(8)
          });

          console.log(`🚀 Investment update with 0.9% growth applied to platform stats`);

          // Plan baseline data from database for live updates
          const planBaselines: Record<string, { active: number; amount: number; profit: number }> = {
            'Growth Plan': { 
              active: adminConfiguration?.growthPlanActive || 227, 
              amount: parseFloat(adminConfiguration?.growthPlanAmount || '11004.9901'), 
              profit: parseFloat(adminConfiguration?.growthPlanProfit || '101.649889') 
            },
            'Institutional Plan': { 
              active: adminConfiguration?.institutionalPlanActive || 210, 
              amount: parseFloat(adminConfiguration?.institutionalPlanAmount || '9228.4977'), 
              profit: parseFloat(adminConfiguration?.institutionalPlanProfit || '205.248890') 
            },
            'Premium Plan': { 
              active: adminConfiguration?.premiumPlanActive || 198, 
              amount: parseFloat(adminConfiguration?.premiumPlanAmount || '9274.8974'), 
              profit: parseFloat(adminConfiguration?.premiumPlanProfit || '114.419514') 
            },
            'Foundation Plan': { 
              active: adminConfiguration?.foundationPlanActive || 169, 
              amount: parseFloat(adminConfiguration?.foundationPlanAmount || '7436.5081'), 
              profit: parseFloat(adminConfiguration?.foundationPlanProfit || '39.029047') 
            }
          };

          // Calculate database totals
          const dbTotalBalance = allUsers.reduce((sum, user) => {
            return sum + parseFloat(user.balance);
          }, 0);

          const dbTotalProfit = allInvestments.reduce((sum, investment) => {
            return sum + parseFloat(investment.currentProfit || '0');
          }, 0);

          const dbActiveInvestments = allInvestments.filter(inv => inv.isActive);

          // Use dynamic values: baseline + current database activity
          const totalUsers = baselineUsers + allUsers.length;
          const platformTotalBalance = baselineTotalBalance + dbTotalBalance;
          const platformTotalProfit = baselineTotalProfit + dbTotalProfit;
          const platformActiveInvestments = baselineActiveInvestments + dbActiveInvestments.length;

          // Get Bitcoin price
          let bitcoinPrice = 67000;
          try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
            if (response.ok) {
              const data = await response.json();
              bitcoinPrice = data.bitcoin.usd;
            }
          } catch (error) {
            console.log('Using fallback price for update');
          }

          const totalBalanceUSD = platformTotalBalance * bitcoinPrice;
          const totalProfitUSD = platformTotalProfit * bitcoinPrice;

          // Calculate plan-specific statistics for live update
          const investmentPlans = await storage.getInvestmentPlans();
          const planStats = investmentPlans.map(plan => {
            const planInvestments = allInvestments.filter(inv => inv.planId === plan.id && inv.isActive);
            const dbPlanAmount = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            const dbPlanProfit = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0);

            // Get baseline data for this plan
            const baseline = planBaselines[plan.name] || { active: 0, amount: 0, profit: 0 };

            // Combine baseline with database values
            const planActiveCount = baseline.active + planInvestments.length;
            const planTotalAmount = baseline.amount + dbPlanAmount;
            const planTotalProfit = baseline.profit + dbPlanProfit;
            const activityPercent = Math.min(100, (planActiveCount / Math.max(1, platformActiveInvestments)) * 100);

            return {
              plan,
              activeCount: planActiveCount,
              totalAmount: planTotalAmount,
              totalProfit: planTotalProfit,
              activityPercent,
              chart: generateActivityChart(activityPercent)
            };
          });

          // Sort plans by activity level
          planStats.sort((a, b) => b.activityPercent - a.activityPercent);

          let message = `🚨 **LIVE PROFIT ALERT!** 🚨
💥 **BITVAULT PRO BREAKING RECORDS AGAIN!** 💥

🔥 **REAL-TIME MONEY MACHINE STATUS:**
💰 **${totalUsers.toLocaleString()} SMART INVESTORS** are making bank RIGHT NOW!
📊 **$${(platformTotalBalance * bitcoinPrice).toLocaleString()}** in Bitcoin CRUSHING the market!
🎯 **$${(platformTotalProfit * bitcoinPrice).toLocaleString()}** in PURE PROFIT generated!
⚡ **${platformActiveInvestments.toLocaleString()}** profit strategies ACTIVE and WORKING!

🏆 **WHICH PLAN IS MAKING THE MOST MONEY?** 🏆`;

          // Add plan statistics with exciting formatting
          planStats.forEach((stat, index) => {
            const riskLevel = stat.plan.roiPercentage > 30 ? '🚀 MAXIMUM GAINS' : stat.plan.roiPercentage > 15 ? '💪 HIGH PROFIT' : '🎯 STEADY MONEY';
            const rankEmoji = index === 0 ? '👑 CHAMPION' : index === 1 ? '🥈 RUNNER-UP' : index === 2 ? '🥉 STRONG' : `🏅 TOP PERFORMER`;
            message += `\n\n${rankEmoji} **${stat.plan.name}**`;
            message += `\n${riskLevel} | **${stat.plan.roiPercentage}% ANNUAL RETURNS!** 📈`;
            message += `\n💎 ${stat.activeCount} Winners | 💰 ${stat.totalAmount.toFixed(4)} BTC Making Money!`;
          });

          message += `

⚡ **OUR SECRET WEAPONS:**
🤖 AI Trading Bots working 24/7 - NEVER sleep, ALWAYS profit!
🛡️ Military-grade security - Your Bitcoin is BULLETPROOF!
⏰ INSTANT profits - Watch your money GROW in real-time!
🏦 Regulated & insured - Your success is GUARANTEED!

🔥 **THE NUMBERS DON'T LIE - WE'RE THE BEST!** 🔥
💯 **THOUSANDS of satisfied investors can't be wrong!**

🚀 **DON'T MISS OUT - JOIN THE PROFIT PARTY!** 🚀

⏰ LIVE UPDATE: ${new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })} • ${new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
          })} UTC ⏰`;

          const success = await sendToChannel(message);
          if (success) {
            console.log('✅ Investment update with platform stats sent to Telegram');
          }
        } catch (error: any) {
          console.error('❌ Failed to calculate stats for update:', error.message);
          // Send basic update if stats fail
          const fallbackMessage = `🚀 *BITVAULT PRO - LIVE UPDATE*

📊 *Platform Performance*
• Active investors earning consistent returns
• 24/7 automated profit distribution  
• Real-time Bitcoin market analysis

💎 All investment plans generating returns
🏆 Join thousands of successful Bitcoin investors`;

          await sendToChannel(fallbackMessage);
        }
      }, 5000); // Wait 5 seconds for banner to be sent
    } else {
      console.log('⚠️ Banner failed, sending text-only update with stats');

      try {
        const { storage } = await import('./storage');
        const allUsers = await storage.getAllUsers();
        const allInvestments = await storage.getAllInvestments();

        // Get baseline values from database for live updates with 0.9% growth
        const adminConfiguration = await storage.getAdminConfig();
        let baselineUsers = adminConfiguration?.baselineUsers || 420;
        let baselineActiveInvestments = adminConfiguration?.baselineActiveInvestments || 804;
        let baselineTotalBalance = parseFloat(adminConfiguration?.baselineTotalBalance || '70275.171605');
        let baselineTotalProfit = parseFloat(adminConfiguration?.baselineTotalProfit || '460.347340');

        // Apply 0.9% growth to baseline statistics for fallback updates
        const growthRate = 1.009; // 0.9% increase
        baselineUsers = Math.floor(baselineUsers * growthRate);
        baselineActiveInvestments = Math.floor(baselineActiveInvestments * growthRate);
        baselineTotalBalance = baselineTotalBalance * growthRate;
        baselineTotalProfit = baselineTotalProfit * growthRate;

        // Update the baseline values in database
        await storage.updateBaselineStatistics({
          baselineUsers,
          baselineActiveInvestments,
          baselineTotalBalance: baselineTotalBalance.toFixed(8),
          baselineTotalProfit: baselineTotalProfit.toFixed(8)
        });

        console.log(`📊 Fallback update with 0.9% growth applied to baseline stats`);

        // Plan baseline data from database for live updates
        const planBaselines: Record<string, { active: number; amount: number; profit: number }> = {
          'Growth Plan': { 
            active: adminConfiguration?.growthPlanActive || 227, 
            amount: parseFloat(adminConfiguration?.growthPlanAmount || '11004.9901'), 
            profit: parseFloat(adminConfiguration?.growthPlanProfit || '101.649889') 
          },
          'Institutional Plan': { 
            active: adminConfiguration?.institutionalPlanActive || 210, 
            amount: parseFloat(adminConfiguration?.institutionalPlanAmount || '9228.4977'), 
            profit: parseFloat(adminConfiguration?.institutionalPlanProfit || '205.248890') 
          },
          'Premium Plan': { 
            active: adminConfiguration?.premiumPlanActive || 198, 
            amount: parseFloat(adminConfiguration?.premiumPlanAmount || '9274.8974'), 
            profit: parseFloat(adminConfiguration?.premiumPlanProfit || '114.419514') 
          },
          'Foundation Plan': { 
            active: adminConfiguration?.foundationPlanActive || 169, 
            amount: parseFloat(adminConfiguration?.foundationPlanAmount || '7436.5081'), 
            profit: parseFloat(adminConfiguration?.foundationPlanProfit || '39.029047') 
          }
        };

        // Calculate database totals
        const dbTotalBalance = allUsers.reduce((sum, user) => sum + parseFloat(user.balance), 0);
        const dbTotalProfit = allInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0);
        const dbActiveInvestments = allInvestments.filter(inv => inv.isActive);

        // Use dynamic totals for fallback
        const totalUsers = baselineUsers + allUsers.length;
        const platformTotalBalance = baselineTotalBalance + dbTotalBalance;
        const platformTotalProfit = baselineTotalProfit + dbTotalProfit;
        const platformActiveInvestments = baselineActiveInvestments + dbActiveInvestments.length;

        // Calculate detailed plan stats with charts for fallback
        const investmentPlans = await storage.getInvestmentPlans();
        const planStats = investmentPlans.map(plan => {
          const planInvestments = allInvestments.filter(inv => inv.planId === plan.id && inv.isActive);
          const dbPlanAmount = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
          const dbPlanProfit = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0);

          const baseline = planBaselines[plan.name] || { active: 0, amount: 0, profit: 0 };

          const planActiveCount = baseline.active + planInvestments.length;
          const planTotalAmount = baseline.amount + dbPlanAmount;
          const planTotalProfit = baseline.profit + dbPlanProfit;
          const activityPercent = Math.min(100, (planActiveCount / Math.max(1, platformActiveInvestments)) * 100);

          return {
            plan,
            activeCount: planActiveCount,
            totalAmount: planTotalAmount,
            totalProfit: planTotalProfit,
            activityPercent,
            chart: generateActivityChart(activityPercent)
          };
        });

        // Sort plans by activity level
        planStats.sort((a, b) => b.activityPercent - a.activityPercent);

        let message = `🏦 **BITVAULT PRO** • Portfolio Update

**Executive Summary:**
• Investment Community: **${totalUsers.toLocaleString()}** members
• Total Assets: **${platformTotalBalance.toFixed(4)} BTC** 
• Generated Returns: **${platformTotalProfit.toFixed(4)} BTC**

**Active Investment Strategies:**`;

        // Add plan statistics with professional formatting
        planStats.forEach((stat, index) => {
          message += `\n\n**${stat.plan.name}** Investment Portfolio`;
          message += `\n• Annual Target: ${stat.plan.roiPercentage}% return`;
          message += `\n• Active Positions: ${stat.activeCount}`;
          message += `\n• Portfolio Value: ${stat.totalAmount.toFixed(4)} BTC`;
          message += `\n• Returns Generated: +${stat.totalProfit.toFixed(6)} BTC`;
        });

        message += `

**Operations Status:**
✓ All investment strategies performing within target parameters
✓ Risk management protocols active and monitoring
✓ Portfolio rebalancing and optimization ongoing
✓ Institutional-grade security measures in place

**Platform Performance:** Optimal operational capacity
**Market Conditions:** Favorable for continued growth

*${new Date().toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        })} Market Close*`;

        await sendToChannel(message);
      } catch (error) {
        const message = `📈 **BITVAULT PRO** • Market Update

**Platform Operations:**
✓ All investment strategies actively managed
✓ Portfolio optimization algorithms running
✓ Risk management systems fully operational
✓ Professional client services available

**Investment Performance:**
• Continuous portfolio monitoring and analysis
• Advanced trading strategies deployed across all plans
• Institutional-grade security and compliance maintained
• Professional wealth management for digital assets

*Professional Bitcoin investment management*

${new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}`;

        await sendToChannel(message);
      }
    }

  } catch (error: any) {
    console.error('❌ Batch updates failed:', error.message);
  }
}

// Export bot for compatibility
export { bot };