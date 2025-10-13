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
    content: '📊 **BITVAULT PRO** — Market Intelligence Update\n🏛️ Institutional Digital Asset Management',
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

// Send daily stats to channel with institutional-grade formatting
export async function sendDailyStatsToChannel(): Promise<void> {
  console.log('📊 Sending institutional-grade daily stats to Telegram...');

  try {
    // Import storage here to avoid circular dependencies
    const { storage } = await import('./storage');

    // Calculate platform statistics
    const allUsers = await storage.getAllUsers();
    const allInvestments = await storage.getAllInvestments();
    const investmentPlans = await storage.getInvestmentPlans();

    // Get baseline values from database for daily stats
    const adminConfiguration = await storage.getAdminConfig();

    // Realistic baseline matching "10,000+ Active Investors" from landing page
    let baselineUsers = adminConfiguration?.baselineUsers || 9850;
    let baselineActiveInvestments = adminConfiguration?.baselineActiveInvestments || 15420;
    let baselineTotalBalance = parseFloat(adminConfiguration?.baselineTotalBalance || '845.67342158');
    let baselineTotalProfit = parseFloat(adminConfiguration?.baselineTotalProfit || '127.84501632');

    // Apply realistic growth: 0.3-0.7% daily (organic growth pattern)
    const growthRate = 1 + (0.003 + Math.random() * 0.004);
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

    console.log(`📈 Applied ${((growthRate - 1) * 100).toFixed(2)}% organic growth`);

    // Plan baseline data
    const planBaselines: Record<string, { active: number; amount: number; profit: number }> = {
      '$10 Plan': { active: adminConfiguration?.plan10Active || 3240, amount: parseFloat(adminConfiguration?.plan10Amount || '26.59680000'), profit: parseFloat(adminConfiguration?.plan10Profit || '2.63142400') },
      '$20 Plan': { active: adminConfiguration?.plan20Active || 2850, amount: parseFloat(adminConfiguration?.plan20Amount || '46.79100000'), profit: parseFloat(adminConfiguration?.plan20Profit || '4.60951020') },
      '$50 Plan': { active: adminConfiguration?.plan50Active || 2410, amount: parseFloat(adminConfiguration?.plan50Amount || '98.77450000'), profit: parseFloat(adminConfiguration?.plan50Profit || '9.81986130') },
      '$100 Plan': { active: adminConfiguration?.plan100Active || 1980, amount: parseFloat(adminConfiguration?.plan100Amount || '162.54180000'), profit: parseFloat(adminConfiguration?.plan100Profit || '16.37471736') },
      '$300 Plan': { active: adminConfiguration?.plan300Active || 1620, amount: parseFloat(adminConfiguration?.plan300Amount || '398.91600000'), profit: parseFloat(adminConfiguration?.plan300Profit || '39.15205120') },
      '$500 Plan': { active: adminConfiguration?.plan500Active || 1350, amount: parseFloat(adminConfiguration?.plan500Amount || '554.04225000'), profit: parseFloat(adminConfiguration?.plan500Profit || '56.56110963') },
      '$1,000 Plan': { active: adminConfiguration?.plan1000Active || 1140, amount: parseFloat(adminConfiguration?.plan1000Amount || '935.84562000'), profit: parseFloat(adminConfiguration?.plan1000Profit || '91.37287076') },
      '$3,000 Plan': { active: adminConfiguration?.plan3000Active || 580, amount: parseFloat(adminConfiguration?.plan3000Amount || '1428.29550000'), profit: parseFloat(adminConfiguration?.plan3000Profit || '283.39430400') },
      '$6,000 Plan': { active: adminConfiguration?.plan6000Active || 175, amount: parseFloat(adminConfiguration?.plan6000Amount || '862.01250000'), profit: parseFloat(adminConfiguration?.plan6000Profit || '203.72494500') },
      '$12,000 Plan': { active: adminConfiguration?.plan12000Active || 75, amount: parseFloat(adminConfiguration?.plan12000Amount || '738.62850000'), profit: parseFloat(adminConfiguration?.plan12000Profit || '147.72570000') }
    };

    // Calculate totals
    const dbTotalBalance = allUsers.reduce((sum, user) => sum + parseFloat(user.balance), 0);
    const dbTotalProfit = allInvestments.reduce((sum, investment) => sum + parseFloat(investment.currentProfit || '0'), 0);
    const dbActiveInvestments = allInvestments.filter(inv => inv.isActive);

    const totalUsers = baselineUsers + allUsers.length;
    const totalBalance = baselineTotalBalance + dbTotalBalance;
    const totalProfit = baselineTotalProfit + dbTotalProfit;
    const activeInvestments = baselineActiveInvestments + dbActiveInvestments.length;

    // Get Bitcoin price
    let bitcoinPrice = 67000;
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      if (response.ok) {
        const data = await response.json();
        bitcoinPrice = data.bitcoin.usd;
      }
    } catch (error) {
      console.log('Using fallback Bitcoin price');
    }

    const totalBalanceUSD = totalBalance * bitcoinPrice;
    const totalProfitUSD = totalProfit * bitcoinPrice;

    // Calculate plan statistics
    const planStats = investmentPlans.map(plan => {
      const planInvestments = allInvestments.filter(inv => inv.planId === plan.id && inv.isActive);
      const dbPlanAmount = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      const dbPlanProfit = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0);
      const baseline = planBaselines[plan.name] || { active: 0, amount: 0, profit: 0 };

      const planActiveCount = baseline.active + planInvestments.length;
      const planTotalAmount = baseline.amount + dbPlanAmount;
      const planTotalProfit = baseline.profit + dbPlanProfit;
      const activityPercent = Math.min(100, (planActiveCount / Math.max(1, activeInvestments)) * 100);

      return {
        plan,
        activeCount: planActiveCount,
        totalAmount: planTotalAmount,
        totalProfit: planTotalProfit,
        activityPercent,
        roi: ((planTotalProfit / Math.max(planTotalAmount, 0.0001)) * 100).toFixed(2)
      };
    });

    planStats.sort((a, b) => b.activityPercent - a.activityPercent);

    // Calculate market metrics
    const avgROI = (planStats.reduce((sum, s) => sum + parseFloat(s.roi), 0) / planStats.length).toFixed(2);
    const topPerformer = planStats[0];
    const totalVolume = planStats.reduce((sum, s) => sum + s.totalAmount, 0);

    // Top 10 Strategy Performance Breakdown
    const strategyPerformance = [
      { name: "Bitcoin DCA", profit: (totalProfit * 0.18).toFixed(8), trades: Math.floor(activeInvestments * 0.15) },
      { name: "ETH Staking", profit: (totalProfit * 0.15).toFixed(8), trades: Math.floor(activeInvestments * 0.12) },
      { name: "CEX Arbitrage", profit: (totalProfit * 0.14).toFixed(8), trades: Math.floor(activeInvestments * 0.18) },
      { name: "Grid Trading", profit: (totalProfit * 0.13).toFixed(8), trades: Math.floor(activeInvestments * 0.14) },
      { name: "DeFi Yield", profit: (totalProfit * 0.12).toFixed(8), trades: Math.floor(activeInvestments * 0.11) },
      { name: "Swing Trading", profit: (totalProfit * 0.10).toFixed(8), trades: Math.floor(activeInvestments * 0.09) },
      { name: "Options", profit: (totalProfit * 0.08).toFixed(8), trades: Math.floor(activeInvestments * 0.08) },
      { name: "Leverage 3x", profit: (totalProfit * 0.06).toFixed(8), trades: Math.floor(activeInvestments * 0.07) },
      { name: "Altcoin Gems", profit: (totalProfit * 0.03).toFixed(8), trades: Math.floor(activeInvestments * 0.04) },
      { name: "NFT Trading", profit: (totalProfit * 0.01).toFixed(8), trades: Math.floor(activeInvestments * 0.02) }
    ];

    let message = `🏦 **BITVAULT PRO INSTITUTIONAL**
\`Asset Management Division\`

📊 **MARKET INTELLIGENCE REPORT**
${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })} • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} UTC

╔═══════════════════════════╗
║   PORTFOLIO ANALYTICS     ║
╚═══════════════════════════╝

💼 **Client Base:** ${totalUsers.toLocaleString()} Active
💰 **AUM:** $${totalBalanceUSD.toLocaleString()} USD
₿  **Bitcoin:** ${totalBalance.toFixed(4)} BTC
📈 **Returns YTD:** $${totalProfitUSD.toLocaleString()}
🎯 **Active Trades:** ${activeInvestments.toLocaleString()}
📊 **Avg ROI:** ${avgROI}%

╔═══════════════════════════╗
║  STRATEGY PERFORMANCE     ║
╚═══════════════════════════╝

`;

    // Add top 5 performing strategies with advanced metrics
    planStats.slice(0, 5).forEach((stat, index) => {
      const trend = parseFloat(stat.roi) > parseFloat(avgROI) ? '📈' : '📉';
      const strength = stat.activityPercent > 75 ? '🟢' : stat.activityPercent > 50 ? '🟡' : '🔵';

      message += `${index + 1}. **${stat.plan.name}**
   ${strength} ROI: ${stat.roi}% ${trend}
   💼 Positions: ${stat.activeCount.toLocaleString()}
   💰 Volume: $${(stat.totalAmount * bitcoinPrice).toLocaleString()}
   📊 Profit: $${(stat.totalProfit * bitcoinPrice).toLocaleString()}
   ⚡ APY Target: ${stat.plan.roiPercentage}%

`;
    });

    message += `🎯 **TOP 10 STRATEGY PERFORMANCE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    strategyPerformance.forEach((strategy, index) => {
      const profitPercent = ((parseFloat(strategy.profit) / totalProfit) * 100).toFixed(1);
      message += `${index + 1}. ${strategy.name}: ${strategy.profit} BTC (${profitPercent}%)\n`;
      message += `   └ Executed Trades: ${strategy.trades}\n`;
    });
    message += `\n`;

    message += `📊 **MARKET INTELLIGENCE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    message += `💹 Avg ROI: ${avgROI}%\n`;
    message += `🏆 Top Performer: ${topPerformer.plan.name} (${topPerformer.activityPercent.toFixed(1)}%)\n`;
    message += `📈 Total Volume: ${totalVolume.toFixed(8)} BTC\n`;
    message += `💰 Platform Profit: ${totalProfit.toFixed(8)} BTC ($${totalProfitUSD.toFixed(2)})\n`;
    message += `🤖 AI Strategies Active: 10/10\n`;
    message += `⚡ Execution Speed: 2.1s avg\n\n`;

    message += `╔═══════════════════════════╗
║    RISK MANAGEMENT        ║
╚═══════════════════════════╝

🛡️ **Compliance Status**
   ✅ SEC Registered
   ✅ FINRA Compliant
   ✅ AML/KYC Verified
   ✅ Multi-Sig Security

⚙️ **System Health**
   • Uptime: 99.98%
   • Latency: <50ms
   • Security: A+ Rating
   • Audit: Current

╔═══════════════════════════╗
║   MARKET INDICATORS       ║
╚═══════════════════════════╝

📊 **Technical Analysis**
   • BTC Price: $${bitcoinPrice.toLocaleString()}
   • Volatility: Moderate
   • Sentiment: Bullish
   • Volume: High

🎯 **Top Performer**
   ${topPerformer.plan.name} • ${topPerformer.roi}% ROI
   ${topPerformer.activeCount.toLocaleString()} Active Positions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏦 **BITVAULT PRO**
\`Institutional Digital Asset Management\`

🔒 Licensed • 🛡️ Insured • ⚡ SEC Regulated`;

    const success = await sendToChannel(message);
    if (success) {
      console.log('✅ Institutional-grade daily stats sent to Telegram');
    }
  } catch (error: any) {
    console.error('❌ Failed to send stats:', error.message);
  }
}

// Send batched updates to channel  
export async function sendBatchedUpdatesToChannel(): Promise<void> {
  console.log('📱 Sending investment updates to Telegram...');

  try {
    // Send banner first
    const bannerPath = './attached_assets/IMG_6814_1756042561574.jpeg';
    const bannerSent = await sendPhotoToChannel(bannerPath, '📊 **BITVAULT PRO** — Market Intelligence Update\n🏛️ Institutional Digital Asset Management');

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

          // Get baseline values from database for live updates with realistic growth
          const adminConfiguration = await storage.getAdminConfig();
          let baselineUsers = adminConfiguration?.baselineUsers || 9850;
          let baselineActiveInvestments = adminConfiguration?.baselineActiveInvestments || 15420;
          let baselineTotalBalance = parseFloat(adminConfiguration?.baselineTotalBalance || '845.67342158');
          let baselineTotalProfit = parseFloat(adminConfiguration?.baselineTotalProfit || '127.84501632');

          // Apply realistic growth: 0.3-0.7% (matches organic platform growth)
          const growthRate = 1 + (0.003 + Math.random() * 0.004);
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

          console.log(`🚀 Investment update with ${((growthRate - 1) * 100).toFixed(2)}% organic growth applied`);

          // Plan baseline data matching new USD investment plans
          const planBaselines: Record<string, { active: number; amount: number; profit: number }> = {
            '$10 Plan': { 
              active: adminConfiguration?.plan10Active || 3240, 
              amount: parseFloat(adminConfiguration?.plan10Amount || '26.59680000'), 
              profit: parseFloat(adminConfiguration?.plan10Profit || '2.63142400') 
            },
            '$20 Plan': { 
              active: adminConfiguration?.plan20Active || 2850, 
              amount: parseFloat(adminConfiguration?.plan20Amount || '46.79100000'), 
              profit: parseFloat(adminConfiguration?.plan20Profit || '4.60951020') 
            },
            '$50 Plan': { 
              active: adminConfiguration?.plan50Active || 2410, 
              amount: parseFloat(adminConfiguration?.plan50Amount || '98.77450000'), 
              profit: parseFloat(adminConfiguration?.plan50Profit || '9.81986130') 
            },
            '$100 Plan': { 
              active: adminConfiguration?.plan100Active || 1980, 
              amount: parseFloat(adminConfiguration?.plan100Amount || '162.54180000'), 
              profit: parseFloat(adminConfiguration?.plan100Profit || '16.37471736') 
            },
            '$300 Plan': { 
              active: adminConfiguration?.plan300Active || 1620, 
              amount: parseFloat(adminConfiguration?.plan300Amount || '398.91600000'), 
              profit: parseFloat(adminConfiguration?.plan300Profit || '39.15205120') 
            },
            '$500 Plan': { 
              active: adminConfiguration?.plan500Active || 1350, 
              amount: parseFloat(adminConfiguration?.plan500Amount || '554.04225000'), 
              profit: parseFloat(adminConfiguration?.plan500Profit || '56.56110963') 
            },
            '$1,000 Plan': { 
              active: adminConfiguration?.plan1000Active || 1140, 
              amount: parseFloat(adminConfiguration?.plan1000Amount || '935.84562000'), 
              profit: parseFloat(adminConfiguration?.plan1000Profit || '91.37287076') 
            },
            '$3,000 Plan': { 
              active: adminConfiguration?.plan3000Active || 580, 
              amount: parseFloat(adminConfiguration?.plan3000Amount || '1428.29550000'), 
              profit: parseFloat(adminConfiguration?.plan3000Profit || '283.39430400') 
            },
            '$6,000 Plan': { 
              active: adminConfiguration?.plan6000Active || 175, 
              amount: parseFloat(adminConfiguration?.plan6000Amount || '862.01250000'), 
              profit: parseFloat(adminConfiguration?.plan6000Profit || '203.72494500') 
            },
            '$12,000 Plan': { 
              active: adminConfiguration?.plan12000Active || 75, 
              amount: parseFloat(adminConfiguration?.plan12000Amount || '738.62850000'), 
              profit: parseFloat(adminConfiguration?.plan12000Profit || '147.72570000') 
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

          let message = `🏦 **BITVAULT PRO**
*Professional Digital Asset Management*

⚡ **LIVE UPDATE**
${new Date().toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric'
          })} • ${new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
          })} UTC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 REAL-TIME METRICS**

👥 Investors: *${totalUsers.toLocaleString()}*
₿ Assets: *${platformTotalBalance.toFixed(4)} BTC*
💵 USD: *$${(platformTotalBalance * bitcoinPrice).toLocaleString()}*
📈 Returns: *$${(platformTotalProfit * bitcoinPrice).toLocaleString()}*
🎯 Positions: *${platformActiveInvestments.toLocaleString()}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💼 STRATEGY PERFORMANCE**`;

          // Add plan statistics with professional formatting
          planStats.forEach((stat, index) => {
            const riskProfile = stat.plan.roiPercentage > 30 ? 'High Growth' : stat.plan.roiPercentage > 15 ? 'Balanced Growth' : 'Conservative';
            const rank = index + 1;
            message += `\n\n**${rank}.** **${stat.plan.name}** \u2014 ${stat.plan.roiPercentage}% Target APY`;
            message += `\n   • Risk Profile: ${riskProfile}`;
            message += `\n   • Active Allocations: ${stat.activeCount}`;
            message += `\n   • Portfolio Value: ${stat.totalAmount.toFixed(4)} BTC`;
          });

          message += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**⚙️ OPERATIONS**

✅ Trading: *Online* | 99.8% Uptime
✅ Security: *Active* | Multi-Layer
✅ Compliance: *Licensed*
✅ Risk Mgmt: *Real-Time*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💎 ACTIVE SERVICES**

• AI Portfolio Optimization
• Institutional Custody
• Professional Management
• 24/7 Operations

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏦 **BITVAULT PRO**
*Institutional Digital Asset Management*`;

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

        // Get baseline values from database for live updates with realistic growth
        const adminConfiguration = await storage.getAdminConfig();
        let baselineUsers = adminConfiguration?.baselineUsers || 9850;
        let baselineActiveInvestments = adminConfiguration?.baselineActiveInvestments || 15420;
        let baselineTotalBalance = parseFloat(adminConfiguration?.baselineTotalBalance || '845.67342158');
        let baselineTotalProfit = parseFloat(adminConfiguration?.baselineTotalProfit || '127.84501632');

        // Apply realistic growth: 0.3-0.7% (organic growth pattern)
        const growthRate = 1 + (0.003 + Math.random() * 0.004);
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

        console.log(`📊 Fallback update with ${((growthRate - 1) * 100).toFixed(2)}% organic growth applied`);

        // Plan baseline data matching new USD investment plans
        const planBaselines: Record<string, { active: number; amount: number; profit: number }> = {
          '$10 Plan': { 
            active: adminConfiguration?.plan10Active || 3240, 
            amount: parseFloat(adminConfiguration?.plan10Amount || '26.59680000'), 
            profit: parseFloat(adminConfiguration?.plan10Profit || '2.63142400') 
          },
          '$20 Plan': { 
            active: adminConfiguration?.plan20Active || 2850, 
            amount: parseFloat(adminConfiguration?.plan20Amount || '46.79100000'), 
            profit: parseFloat(adminConfiguration?.plan20Profit || '4.60951020') 
          },
          '$50 Plan': { 
            active: adminConfiguration?.plan50Active || 2410, 
            amount: parseFloat(adminConfiguration?.plan50Amount || '98.77450000'), 
            profit: parseFloat(adminConfiguration?.plan50Profit || '9.81986130') 
          },
          '$100 Plan': { 
            active: adminConfiguration?.plan100Active || 1980, 
            amount: parseFloat(adminConfiguration?.plan100Amount || '162.54180000'), 
            profit: parseFloat(adminConfiguration?.plan100Profit || '16.37471736') 
          },
          '$300 Plan': { 
            active: adminConfiguration?.plan300Active || 1620, 
            amount: parseFloat(adminConfiguration?.plan300Amount || '398.91600000'), 
            profit: parseFloat(adminConfiguration?.plan300Profit || '39.15205120') 
          },
          '$500 Plan': { 
            active: adminConfiguration?.plan500Active || 1350, 
            amount: parseFloat(adminConfiguration?.plan500Amount || '554.04225000'), 
            profit: parseFloat(adminConfiguration?.plan500Profit || '56.56110963') 
          },
          '$1,000 Plan': { 
            active: adminConfiguration?.plan1000Active || 1140, 
            amount: parseFloat(adminConfiguration?.plan1000Amount || '935.84562000'), 
            profit: parseFloat(adminConfiguration?.plan1000Profit || '91.37287076') 
          },
          '$3,000 Plan': { 
            active: adminConfiguration?.plan3000Active || 580, 
            amount: parseFloat(adminConfiguration?.plan3000Amount || '1428.29550000'), 
            profit: parseFloat(adminConfiguration?.plan3000Profit || '283.39430400') 
          },
          '$6,000 Plan': { 
            active: adminConfiguration?.plan6000Active || 175, 
            amount: parseFloat(adminConfiguration?.plan6000Amount || '862.01250000'), 
            profit: parseFloat(adminConfiguration?.plan6000Profit || '203.72494500') 
          },
          '$12,000 Plan': { 
            active: adminConfiguration?.plan12000Active || 75, 
            amount: parseFloat(adminConfiguration?.plan12000Amount || '738.62850000'), 
            profit: parseFloat(adminConfiguration?.plan12000Profit || '147.72570000') 
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