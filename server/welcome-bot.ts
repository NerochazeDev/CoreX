import TelegramBot from 'node-telegram-bot-api';

// Dedicated Welcome Bot - Separate from main bot to avoid conflicts
const welcomeBotToken = process.env.TELEGRAM_WELCOME_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

let welcomeBot: TelegramBot | null = null;
let isWelcomeBotActive = false;

// Initialize dedicated welcome bot
async function initializeWelcomeBot(): Promise<void> {
  if (isWelcomeBotActive || !welcomeBotToken || !channelId) {
    console.log('⚠️ Welcome bot skipped - missing credentials or already active');
    return;
  }

  try {
    isWelcomeBotActive = true;
    
    // Create bot with webhook mode to avoid polling conflicts
    welcomeBot = new TelegramBot(welcomeBotToken, { 
      polling: {
        interval: 5000, // Much slower polling
        autoStart: true,
        params: {
          timeout: 60,
          allowed_updates: ['new_chat_members'] // Only listen for new members
        }
      }
    });

    console.log('🤖 Welcome bot initialized successfully');

    // Handle new members joining - this is the main purpose
    welcomeBot.on('new_chat_members', async (msg) => {
      console.log('👋 Welcome bot detected new member(s) in chat:', msg.chat.id);
      const chatId = msg.chat.id;
      const newMembers = msg.new_chat_members;
      
      if (newMembers && welcomeBot) {
        for (const member of newMembers) {
          if (!member.is_bot) {
            console.log(`📨 Welcome bot sending message to: ${member.first_name} ${member.last_name || ''}`);
            await sendWelcomeMessage(chatId, member);
            // Small delay between messages if multiple members join
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    });

    // Handle polling errors for welcome bot
    welcomeBot.on('polling_error', (error: any) => {
      console.log('⚠️ Welcome bot polling error:', error.code);
      if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        console.log('🔄 Welcome bot conflict, will retry in 60 seconds...');
        setTimeout(() => {
          if (welcomeBot) {
            welcomeBot.stopPolling().catch(() => {});
            welcomeBot = null;
            isWelcomeBotActive = false;
            setTimeout(() => initializeWelcomeBot(), 5000);
          }
        }, 60000);
      }
    });

    // Handle general errors
    welcomeBot.on('error', (error: any) => {
      console.log('❌ Welcome bot error:', error.message);
    });

  } catch (error: any) {
    console.error('❌ Failed to initialize welcome bot:', error.message);
    isWelcomeBotActive = false;
    welcomeBot = null;
  }
}

// Send professional welcome message to new members
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
    
    console.log(`✅ Welcome message sent successfully to ${memberName}`);
  } catch (error: any) {
    console.error('❌ Failed to send welcome message:', error.message);
  }
}

// Initialize the welcome bot immediately when module is imported
console.log('🚀 Starting dedicated welcome bot...');
console.log('Welcome bot token available:', !!welcomeBotToken);
console.log('Channel ID available:', !!channelId);

if (welcomeBotToken && channelId) {
  initializeWelcomeBot().catch(error => {
    console.error('❌ Welcome bot initialization failed:', error.message);
  });
} else {
  console.warn('⚠️ Welcome bot credentials not found. Welcome messages will be disabled.');
}

// Test function to send sample welcome message
export async function sendTestWelcomeMessage(): Promise<void> {
  if (!welcomeBot || !channelId) {
    console.log('❌ Welcome bot not available for testing');
    return;
  }

  const testMember = {
    first_name: 'Test User',
    last_name: 'Demo',
    id: 123456789,
    is_bot: false
  };

  console.log('🧪 Sending test welcome message...');
  await sendWelcomeMessage(parseInt(channelId), testMember);
}

export { welcomeBot };