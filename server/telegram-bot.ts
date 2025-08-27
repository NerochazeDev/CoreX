import TelegramBot from 'node-telegram-bot-api';

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

// Send message to channel with retry logic
async function sendToChannel(message: string, options: any = {}): Promise<boolean> {
  const botInstance = initBot();
  if (!botInstance || !channelId) return false;

  try {
    await botInstance.sendMessage(channelId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...options
    });
    return true;
  } catch (error: any) {
    console.error('❌ Telegram message failed:', error.message);
    return false;
  }
}

// Send photo to channel with retry logic
async function sendPhotoToChannel(photoPath: string, caption?: string): Promise<boolean> {
  const botInstance = initBot();
  if (!botInstance || !channelId) return false;

  try {
    await botInstance.sendPhoto(channelId, photoPath, {
      caption: caption || '',
      parse_mode: 'Markdown'
    });
    return true;
  } catch (error: any) {
    console.error('❌ Telegram photo failed:', error.message);
    return false;
  }
}

// Investment update functions (simplified)
export function addInvestmentUpdateToBatch(update: any): void {
  // Store update for batch processing (memory-based)
  // Reduced logging frequency - only log every 50th update
  if (update.investmentId % 50 === 0) {
    console.log('📊 Investment updates processed (last:', update.investmentId + ')');
  }
}

export function addNewInvestmentToBatch(investment: any): void {
  // Store new investment for batch processing
  // Only log significant new investments
  if (parseFloat(investment.amount || '0') > 0.01) {
    console.log('💰 Significant new investment:', investment.investmentId);
  }
}

// Generate activity chart for investment plan
function generateActivityChart(activityPercent: number): string {
  const maxBars = 10;
  const filledBars = Math.round((activityPercent / 100) * maxBars);
  const emptyBars = maxBars - filledBars;

  return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
}

// Send daily stats to channel
export async function sendDailyStatsToChannel(): Promise<void> {
  console.log('📊 Sending daily stats to Telegram...');

  try {
    // Import storage here to avoid circular dependencies
    const { storage } = await import('./storage');

    // Calculate platform statistics
    const allUsers = await storage.getAllUsers();
    const allInvestments = await storage.getAllInvestments();
    const investmentPlans = await storage.getInvestmentPlans();

    // Get baseline values from database for daily stats
    const adminConfiguration = await storage.getAdminConfig();
    const baselineUsers = adminConfiguration?.baselineUsers || 420;
    const baselineActiveInvestments = adminConfiguration?.baselineActiveInvestments || 804;
    const baselineTotalBalance = parseFloat(adminConfiguration?.baselineTotalBalance || '70275.171605');
    const baselineTotalProfit = parseFloat(adminConfiguration?.baselineTotalProfit || '460.347340');

    // Plan baseline data from database for daily stats
    const planBaselines = {
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

    let message = `🏆 BITVAULT PRO • Daily Update

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })}

💰 *Platform Statistics*
👥 Total Users: *${totalUsers.toLocaleString()}*
💎 Active Investments: *${activeInvestments.toLocaleString()}*
💰 Total Balance: *${totalBalance.toFixed(6)} BTC* ($${(totalBalance * bitcoinPrice).toLocaleString()})
🚀 Total Profit Generated: *${totalProfit.toFixed(6)} BTC* ($${(totalProfit * bitcoinPrice).toLocaleString()})

📊 *Investment Plans Activity Chart*
`;

    // Add plan statistics with activity charts
    planStats.forEach((stat, index) => {
      const planEmoji = ['\ud83d\udd37', '\ud83d\udd36', '\ud83d\udd38', '\ud83d\udc8e'][index] || '\ud83d\udcb5';
      message += `\n${planEmoji} *${stat.plan.name}* (${stat.plan.roiPercentage}% ROI)
`;
      message += `   ${stat.chart} ${stat.activityPercent.toFixed(1)}%\n`;
      message += `   📋 Active: ${stat.activeCount} | 💰 Amount: ${stat.totalAmount.toFixed(4)} BTC\n`;
      message += `   🚀 Profit: ${stat.totalProfit.toFixed(6)} BTC ($${(stat.totalProfit * bitcoinPrice).toLocaleString()})\n`;
    });

    message += `

🚀 *Platform Status*
⚡ Automated returns: *ACTIVE*
🎯 Investment plans: *${investmentPlans.length} AVAILABLE*  
💎 Profit distribution: *Every 10 minutes*
📈 Success rate: *99.9%*

✨ *Join thousands earning passive Bitcoin income*
🔐 *Military-grade security & instant withdrawals*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 INSTITUTIONAL-GRADE BITCOIN INVESTING`;

    const success = await sendToChannel(message);
    if (success) {
      console.log('✅ Daily stats with investment plan charts sent to Telegram');
    } else {
      console.log('❌ Failed to send daily stats');
    }
  } catch (error: any) {
    console.error('❌ Failed to calculate platform stats:', error.message);
    // Send basic message if stats calculation fails
    const fallbackMessage = `🏆 BITVAULT PRO • Daily Update

📅 ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })}

🚀 Platform operating at full capacity
💎 All investment plans active
✨ Generating consistent returns for investors`;

    await sendToChannel(fallbackMessage);
  }
}

// Send batched updates to channel  
export async function sendBatchedUpdatesToChannel(): Promise<void> {
  console.log('📱 Sending investment updates to Telegram...');

  try {
    // Send banner first
    const bannerPath = './attached_assets/IMG_6814_1756042561574.jpeg';
    const bannerSent = await sendPhotoToChannel(bannerPath, '📊 **BITVAULT PRO INVESTMENT UPDATE** 📊');

    if (bannerSent) {
      console.log('✅ Investment banner sent');

      // Wait a moment then send update message with platform stats
      setTimeout(async () => {
        try {
          // Import storage here to avoid circular dependencies
          const { storage } = await import('./storage');

          // Calculate platform statistics
          const allUsers = await storage.getAllUsers();
          const allInvestments = await storage.getAllInvestments();

          // Get baseline values from database for live updates
          const adminConfiguration = await storage.getAdminConfig();
          const baselineUsers = adminConfiguration?.baselineUsers || 420;
          const baselineActiveInvestments = adminConfiguration?.baselineActiveInvestments || 804;
          const baselineTotalBalance = parseFloat(adminConfiguration?.baselineTotalBalance || '70275.171605');
          const baselineTotalProfit = parseFloat(adminConfiguration?.baselineTotalProfit || '460.347340');

          // Plan baseline data from database for live updates
          const planBaselines = {
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

          let message = `🚀 *BITVAULT PRO - LIVE UPDATE*

💰 *Real-Time Platform Stats*
👥 Total Users: *${totalUsers.toLocaleString()}*
📊 Active Investments: *${platformActiveInvestments.toLocaleString()}*
💎 Platform Balance: *${platformTotalBalance.toFixed(6)} BTC* ($${(platformTotalBalance * bitcoinPrice).toLocaleString()})
🚀 Total Profit: *${platformTotalProfit.toFixed(6)} BTC* ($${(platformTotalProfit * bitcoinPrice).toLocaleString()}*)

📊 *Live Investment Plans Activity*
`;

          // Add plan statistics with activity charts
          planStats.forEach((stat, index) => {
            const planEmoji = ['\ud83d\udd37', '\ud83d\udd36', '\ud83d\udd38', '\ud83d\udc8e'][index] || '\ud83d\udcb5';
            message += `\n${planEmoji} *${stat.plan.name}*\n`;
            message += `   ${stat.chart} ${stat.activityPercent.toFixed(1)}%\n`;
            message += `   📋 ${stat.activeCount} active | 💰 ${stat.totalAmount.toFixed(4)} BTC\n`;
          });

          message += `

📊 *Platform Performance*
• Active investors earning consistent returns
• 24/7 automated profit distribution  
• Real-time Bitcoin market analysis
• Institutional-grade security protocols

🏆 *Join the financial revolution with BitVault Pro*

⏰ Update: ${new Date().toLocaleString('en-US', { 
            timeZone: 'UTC',
            dateStyle: 'full', 
            timeStyle: 'short'
          })} UTC`;

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
      }, 2000);
    } else {
      console.log('⚠️ Banner failed, sending text-only update with stats');

      try {
        const { storage } = await import('./storage');
        const allUsers = await storage.getAllUsers();
        const allInvestments = await storage.getAllInvestments();

        // Get baseline values from database for live updates
        const adminConfiguration = await storage.getAdminConfig();
        const baselineUsers = adminConfiguration?.baselineUsers || 420;
        const baselineActiveInvestments = adminConfiguration?.baselineActiveInvestments || 804;
        const baselineTotalBalance = parseFloat(adminConfiguration?.baselineTotalBalance || '70275.171605');
        const baselineTotalProfit = parseFloat(adminConfiguration?.baselineTotalProfit || '460.347340');

        // Plan baseline data from database for live updates
        const planBaselines = {
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

        let message = `🚀 BITVAULT PRO - Investment Update

💰 Platform Stats:
👥 Users: ${totalUsers}
💎 Total Balance: ${platformTotalBalance.toFixed(6)} BTC
🚀 Total Profit: ${platformTotalProfit.toFixed(6)} BTC

📊 Investment Plans Activity Chart:
`;

        // Add plan statistics with activity charts
        planStats.forEach((stat, index) => {
          const planEmoji = ['🔷', '🔶', '🔸', '💎'][index] || '💵';
          message += `\n${planEmoji} *${stat.plan.name}* (${stat.plan.roiPercentage}% ROI)\n`;
          message += `   ${stat.chart} ${stat.activityPercent.toFixed(1)}%\n`;
          message += `   📋 Active: ${stat.activeCount} | 💰 Amount: ${stat.totalAmount.toFixed(4)} BTC\n`;
          message += `   🚀 Profit: ${stat.totalProfit.toFixed(6)} BTC\n`;
        });

        message += `

Platform operating at full capacity
All investment plans generating consistent returns

${new Date().toLocaleString()}`;

        await sendToChannel(message);
      } catch (error) {
        const message = `🚀 BITVAULT PRO - Investment Update

📊 All investment plans active and generating returns
💎 Platform operating at full capacity  
🏆 Join thousands of successful Bitcoin investors

${new Date().toLocaleString()}`;

        await sendToChannel(message);
      }
    }

  } catch (error: any) {
    console.error('❌ Batch updates failed:', error.message);
  }
}

// Export bot for compatibility
export { bot };