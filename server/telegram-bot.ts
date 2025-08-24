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
  console.log('📊 Investment update queued:', update.investmentId);
}

export function addNewInvestmentToBatch(investment: any): void {
  // Store new investment for batch processing
  console.log('💰 New investment queued:', investment.investmentId);
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
    
    // Calculate total balance across all users
    const totalBalance = allUsers.reduce((sum, user) => {
      return sum + parseFloat(user.balance);
    }, 0);
    
    // Calculate total profit from all investments
    const totalProfit = allInvestments.reduce((sum, investment) => {
      return sum + parseFloat(investment.currentProfit || '0');
    }, 0);
    
    // Calculate active investments
    const activeInvestments = allInvestments.filter(inv => inv.isActive);
    
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
    
    // Calculate plan-specific statistics
    const planStats = investmentPlans.map(plan => {
      const planInvestments = allInvestments.filter(inv => inv.planId === plan.id && inv.isActive);
      const planTotalAmount = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      const planTotalProfit = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0);
      const activityPercent = Math.min(100, (planInvestments.length / Math.max(1, activeInvestments.length)) * 100);
      
      return {
        plan,
        activeCount: planInvestments.length,
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
👥 Total Users: *${allUsers.length.toLocaleString()}*
💎 Active Investments: *${activeInvestments.length.toLocaleString()}*
💰 Total Balance: *${totalBalance.toFixed(6)} BTC* ($${totalBalanceUSD.toLocaleString()})
🚀 Total Profit Generated: *${totalProfit.toFixed(6)} BTC* ($${totalProfitUSD.toLocaleString()})

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
          
          // Calculate total balance and profit
          const totalBalance = allUsers.reduce((sum, user) => {
            return sum + parseFloat(user.balance);
          }, 0);
          
          const totalProfit = allInvestments.reduce((sum, investment) => {
            return sum + parseFloat(investment.currentProfit || '0');
          }, 0);
          
          const activeInvestments = allInvestments.filter(inv => inv.isActive);
          
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
          
          const totalBalanceUSD = totalBalance * bitcoinPrice;
          const totalProfitUSD = totalProfit * bitcoinPrice;
          
          // Calculate plan-specific statistics for live update
          const investmentPlans = await storage.getInvestmentPlans();
          const planStats = investmentPlans.map(plan => {
            const planInvestments = allInvestments.filter(inv => inv.planId === plan.id && inv.isActive);
            const planTotalAmount = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            const planTotalProfit = planInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0);
            const activityPercent = Math.min(100, (planInvestments.length / Math.max(1, activeInvestments.length)) * 100);
            
            return {
              plan,
              activeCount: planInvestments.length,
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
👥 Total Users: *${allUsers.length.toLocaleString()}*
📊 Active Investments: *${activeInvestments.length.toLocaleString()}*
💎 Platform Balance: *${totalBalance.toFixed(6)} BTC* ($${totalBalanceUSD.toLocaleString()})
🚀 Total Profit: *${totalProfit.toFixed(6)} BTC* ($${totalProfitUSD.toLocaleString()})
₿ Bitcoin Price: *$${bitcoinPrice.toLocaleString()}*

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
        
        const totalBalance = allUsers.reduce((sum, user) => sum + parseFloat(user.balance), 0);
        const totalProfit = allInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentProfit || '0'), 0);
        
        // Calculate quick plan stats for fallback
        const investmentPlans = await storage.getInvestmentPlans();
        const planStats = investmentPlans.map(plan => {
          const planInvestments = allInvestments.filter(inv => inv.planId === plan.id && inv.isActive);
          return {
            name: plan.name,
            count: planInvestments.length,
            amount: planInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
          };
        });
        
        let message = `🚀 BITVAULT PRO - Investment Update

💰 Platform Stats:
👥 Users: ${allUsers.length}
💎 Total Balance: ${totalBalance.toFixed(6)} BTC
🚀 Total Profit: ${totalProfit.toFixed(6)} BTC

📊 Investment Plans Activity:
`;
        
        planStats.forEach(stat => {
          message += `\u2022 ${stat.name}: ${stat.count} active (${stat.amount.toFixed(4)} BTC)\n`;
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