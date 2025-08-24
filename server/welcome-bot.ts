import TelegramBot from 'node-telegram-bot-api';

// Dedicated Welcome Bot - Uses separate token to avoid conflicts
const welcomeBotToken = process.env.TELEGRAM_WELCOME_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

let welcomeBot: TelegramBot | null = null;
let isWelcomeBotActive = false;

// Initialize dedicated welcome bot with separate token
async function initializeWelcomeBot(): Promise<void> {
  if (isWelcomeBotActive || !welcomeBotToken || !channelId) {
    console.log('⚠️ Welcome bot skipped - missing dedicated token or channel ID');
    return;
  }

  // Don't start if using same token as main bot
  if (welcomeBotToken === process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️ Welcome bot skipped - same token as main bot (would cause conflicts)');
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
    const memberName = member.first_name || 'New Member';
    
    const welcomeMessage = `🎉 **Welcome to BitVault Pro, ${memberName}!**

🏆 You've joined the world's most sophisticated Bitcoin investment platform.

💎 **INVESTMENT PLANS:**
🔷 Foundation: 0.5% daily (15% total ROI)
🔶 Growth: 0.83% daily (25% total ROI) 
🔸 Premium: 1.16% daily (35% total ROI)
💎 Institutional: 1.94% daily (50% total ROI)

🔐 **ENTERPRISE SECURITY:**
• Military-grade encryption
• Cold storage protection
• Real-time monitoring

📊 **FEATURES:**
• Automated returns every 10 minutes
• Real-time tracking
• Instant withdrawals
• 24/7 support

Your wealth-building journey starts now! 🚀`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🚀 Start Investing', url: 'https://bitvault-pro.onrender.com/register' }],
        [{ text: '📋 Investment Guide', callback_data: 'faq' }]
      ]
    };

    await welcomeBot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
    
    console.log(`✅ Welcome message sent to ${memberName}`);
  } catch (error: any) {
    console.error('❌ Welcome message failed:', error.message);
  }
}

// Send FAQ message
async function sendFAQMessage(chatId: number, userId: number): Promise<void> {
  if (!welcomeBot) return;
  
  try {
    const faqMessage = `📋 **BitVault Pro Investment Guide**

**🔐 SECURITY**
• 256-bit AES encryption
• Multi-factor authentication  
• Cold storage protection
• BIP39 wallet generation

**💰 HOW IT WORKS**
1. Complete registration
2. Deposit Bitcoin to secure wallet
3. Choose investment plan
4. Receive automated returns every 10 minutes
5. Withdraw after completion

**❓ COMMON QUESTIONS**
• **When are profits paid?** Every 10 minutes, 24/7
• **Can I withdraw early?** After investment completion
• **Minimum investment?** 0.001 BTC (Foundation Plan)
• **How to track progress?** Real-time dashboard

🎯 **Join thousands building wealth with institutional-grade Bitcoin investing.**`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🚀 Create Account', url: 'https://bitvault-pro.onrender.com/register' }]
      ]
    };

    await welcomeBot.sendMessage(chatId, faqMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
    
    console.log(`✅ FAQ sent to user ${userId}`);
  } catch (error: any) {
    console.error('❌ FAQ message failed:', error.message);
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