import TelegramBot from 'node-telegram-bot-api';

// Dedicated Welcome Bot - Uses separate token to avoid conflicts
const welcomeBotToken = process.env.TELEGRAM_WELCOME_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

let welcomeBot: TelegramBot | null = null;
let isWelcomeBotActive = false;

// Initialize dedicated welcome bot with separate token
async function initializeWelcomeBot(): Promise<void> {
  console.log('🔍 Welcome bot debug:');
  console.log('- Welcome bot token exists:', !!welcomeBotToken);
  console.log('- Main bot token exists:', !!process.env.TELEGRAM_BOT_TOKEN);
  console.log('- Tokens are different:', welcomeBotToken !== process.env.TELEGRAM_BOT_TOKEN);
  console.log('- Channel ID exists:', !!channelId);
  console.log('- Welcome bot active:', isWelcomeBotActive);

  if (isWelcomeBotActive || !welcomeBotToken || !channelId) {
    console.log('⚠️ Welcome bot skipped - missing dedicated token or channel ID');
    return;
  }

  // Don't start if using same token as main bot
  if (welcomeBotToken === process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️ Welcome bot skipped - IDENTICAL TOKENS detected (would cause conflicts)');
    console.log('- Please use different bot tokens for main bot and welcome bot');
    return;
  }

  try {
    isWelcomeBotActive = true;
    
    console.log('🤖 Initializing dedicated welcome bot...');
    
    welcomeBot = new TelegramBot(welcomeBotToken, { 
      polling: {
        interval: 3000,
        autoStart: true,
        params: {
          timeout: 10,
          allowed_updates: ['new_chat_members', 'callback_query']
        }
      }
    });

    console.log('✅ Welcome bot initialized successfully with dedicated token');

    // Handle new members joining
    welcomeBot.on('new_chat_members', async (msg) => {
      console.log('👋 Welcome bot detected new member(s)');
      const chatId = msg.chat.id;
      const newMembers = msg.new_chat_members;
      
      if (newMembers && welcomeBot) {
        for (const member of newMembers) {
          if (!member.is_bot) {
            console.log(`📨 Welcome bot sending message to: ${member.first_name}`);
            await sendWelcomeMessage(chatId, member);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    });

    // Handle callback queries for welcome bot
    welcomeBot.on('callback_query', (callbackQuery) => {
      const data = callbackQuery.data;
      console.log('🔘 Welcome bot callback:', data);
      
      if (data === 'faq' && welcomeBot) {
        sendFAQMessage(callbackQuery.message!.chat.id, callbackQuery.from.id);
        welcomeBot.answerCallbackQuery(callbackQuery.id);
      }
    });

    // Handle polling errors
    welcomeBot.on('polling_error', (error: any) => {
      console.log('⚠️ Welcome bot polling error:', error.code);
      if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        console.log('🔄 Welcome bot has token conflict - check if token is unique');
        // Don't retry if there's a token conflict
        if (welcomeBot) {
          welcomeBot.stopPolling().catch(() => {});
          welcomeBot = null;
          isWelcomeBotActive = false;
        }
      }
    });

    welcomeBot.on('error', (error: any) => {
      console.log('❌ Welcome bot error:', error.message);
    });

  } catch (error: any) {
    console.error('❌ Failed to initialize welcome bot:', error.message);
    isWelcomeBotActive = false;
    welcomeBot = null;
  }
}

// Send welcome message to new members  
async function sendWelcomeMessage(chatId: number, member: any): Promise<void> {
  if (!welcomeBot) return;
  
  try {
    const memberName = member.first_name || 'Distinguished Investor';
    
    const welcomeMessage = `🏆 **Welcome to BitVault Pro** 🏆

👋 **${memberName}**, congratulations on joining the world's most sophisticated Bitcoin investment platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💎 **INSTITUTIONAL-GRADE INVESTMENT PLANS:**

🔷 **Foundation Plan**
• Daily Returns: **0.5%** (182% Annual APY)
• Duration: 30 Days | Min: 0.001 BTC
• Total ROI: 15%

🔶 **Growth Plan** 
• Daily Returns: **0.83%** (302% Annual APY)
• Duration: 60 Days | Min: 0.01 BTC  
• Total ROI: 25%

🔸 **Premium Plan**
• Daily Returns: **1.16%** (423% Annual APY)
• Duration: 90 Days | Min: 0.05 BTC
• Total ROI: 35%

💎 **Institutional Plan**
• Daily Returns: **1.94%** (708% Annual APY)
• Duration: 180 Days | Min: 0.1 BTC
• Total ROI: 50%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 **ENTERPRISE SECURITY:**
• 256-bit AES Military Encryption
• Cold Storage + Multi-Factor Authentication
• Real-time Fraud Monitoring
• BIP39 Secure Wallet Generation

📊 **PROFESSIONAL FEATURES:**
• Automated Profit Distribution (Every 10 min)
• Real-time Investment Tracking
• Instant Withdrawal Processing
• 24/7 Portfolio Management

**Your wealth-building journey starts here.** 👇`;

    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: '🚀 Start Investing Now', 
            url: 'https://bitvault-pro.onrender.com/register'
          }
        ],
        [
          { 
            text: '📋 Complete Investment Guide', 
            callback_data: 'faq' 
          }
        ]
      ]
    };

    await welcomeBot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
    
    console.log(`✅ Professional welcome sent to ${memberName}`);
  } catch (error: any) {
    console.error('❌ Failed to send welcome message:', error.message);
  }
}

// Send FAQ message
async function sendFAQMessage(chatId: number, userId: number): Promise<void> {
  if (!welcomeBot) return;
  
  try {
    const faqMessage = `📋 **BitVault Pro Investment Guide**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🔐 SECURITY & COMPLIANCE**

• **Bank-Grade Protection:** 256-bit AES encryption, cold storage, multi-factor authentication
• **Regulatory Compliance:** Real-time fraud monitoring and suspicious activity detection
• **Wallet Security:** BIP39 seed phrase backup with professional Bitcoin address generation
• **Account Protection:** Custom captcha verification and session-based authentication

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💰 INVESTMENT PLANS**

🔷 **Foundation Plan**
• Min Investment: **0.001 BTC**
• Daily Returns: **0.5%** | Total ROI: **15%**
• Duration: **30 Days** | Annual APY: **182%**

🔶 **Growth Plan**
• Min Investment: **0.01 BTC**
• Daily Returns: **0.83%** | Total ROI: **25%**
• Duration: **60 Days** | Annual APY: **302%**

🔸 **Premium Plan**
• Min Investment: **0.05 BTC**
• Daily Returns: **1.16%** | Total ROI: **35%**
• Duration: **90 Days** | Annual APY: **423%**

💎 **Institutional Plan**
• Min Investment: **0.1 BTC**
• Daily Returns: **1.94%** | Total ROI: **50%**
• Duration: **180 Days** | Annual APY: **708%**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**⚡ HOW IT WORKS**

1️⃣ **Registration:** Complete secure account verification with email confirmation
2️⃣ **Deposit:** Transfer Bitcoin to your secure wallet address
3️⃣ **Invest:** Choose your preferred plan and activate investment
4️⃣ **Earn:** Receive automated returns every 10 minutes, 24/7
5️⃣ **Withdraw:** Process withdrawals instantly after investment completion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**❓ COMMON QUESTIONS**

**When are profits distributed?**
Every 10 minutes, 24/7 with real-time notifications

**Can I withdraw during active investments?**
Withdrawals are protected until investment terms complete for maximum returns

**Is there a minimum withdrawal?**
No minimum - withdraw any amount after investment completion

**How do I track my portfolio?**
Real-time dashboard with live profit tracking and investment progress

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🎯 Join thousands of successful investors building wealth with BitVault Pro's institutional-grade platform.**`;

    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: '🚀 Create Account Now', 
            url: 'https://bitvault-pro.onrender.com/register'
          }
        ],
        [
          { 
            text: '🔄 Back to Welcome', 
            callback_data: 'welcome_back'
          }
        ]
      ]
    };

    await welcomeBot.sendMessage(chatId, faqMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
    
    console.log(`✅ Investment guide sent to user ${userId}`);
  } catch (error: any) {
    console.error('❌ Failed to send investment guide:', error.message);
  }
}

// Initialize if dedicated token is provided
if (welcomeBotToken && channelId) {
  initializeWelcomeBot().catch(error => {
    console.error('❌ Welcome bot initialization failed:', error.message);
  });
} else {
  console.warn('⚠️ Welcome bot needs dedicated TELEGRAM_WELCOME_BOT_TOKEN');
}

export async function sendTestWelcomeMessage(): Promise<void> {
  if (!welcomeBot) {
    throw new Error('Welcome bot not available - need TELEGRAM_WELCOME_BOT_TOKEN');
  }

  const testMember = {
    first_name: 'Test User',
    id: 123456789,
    is_bot: false
  };

  await sendWelcomeMessage(parseInt(channelId!), testMember);
}

export { welcomeBot };