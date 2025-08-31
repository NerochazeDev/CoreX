// Advanced broadcast queue management for Telegram bot
interface BroadcastMessage {
  id: string;
  type: 'text' | 'photo';
  content: string;
  photoPath?: string;
  priority: 'high' | 'normal' | 'low';
  retries: number;
  maxRetries: number;
  createdAt: Date;
  scheduledAt?: Date;
}

class BroadcastQueue {
  private queue: BroadcastMessage[] = [];
  private processing = false;
  private readonly rateLimitDelay = 3000; // 3 seconds between messages to avoid rate limits
  private lastSentTime = 0;

  // Add message to queue
  public addMessage(message: Omit<BroadcastMessage, 'id' | 'retries' | 'createdAt'>): string {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const broadcastMessage: BroadcastMessage = {
      ...message,
      id,
      retries: 0,
      createdAt: new Date()
    };

    // Insert based on priority
    if (message.priority === 'high') {
      this.queue.unshift(broadcastMessage);
    } else {
      this.queue.push(broadcastMessage);
    }

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return id;
  }

  // Process the queue
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    console.log(`📋 Processing broadcast queue with ${this.queue.length} messages`);

    while (this.queue.length > 0) {
      const message = this.queue[0];

      // Check if message is scheduled for later
      if (message.scheduledAt && message.scheduledAt > new Date()) {
        // Move to next message or wait if all are scheduled
        const nextImmediate = this.queue.find(m => !m.scheduledAt || m.scheduledAt <= new Date());
        if (!nextImmediate) {
          break; // All messages are scheduled for later
        }
        // Move scheduled message to end and continue with immediate ones
        this.queue.shift();
        this.queue.push(message);
        continue;
      }

      // Rate limiting - ensure minimum delay between messages
      const timeSinceLastSent = Date.now() - this.lastSentTime;
      if (timeSinceLastSent < this.rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastSent));
      }

      const success = await this.sendMessage(message);
      this.lastSentTime = Date.now();

      if (success) {
        console.log(`✅ Broadcast message ${message.id} sent successfully`);
        this.queue.shift(); // Remove from queue
      } else {
        message.retries++;
        if (message.retries >= message.maxRetries) {
          console.error(`❌ Broadcast message ${message.id} failed after ${message.maxRetries} attempts, removing from queue`);
          this.queue.shift(); // Remove from queue
        } else {
          console.warn(`⚠️ Broadcast message ${message.id} failed, attempt ${message.retries}/${message.maxRetries}`);
          // Move to end of queue for retry
          this.queue.shift();
          this.queue.push(message);
        }
      }

      // Small delay between processing attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.processing = false;

    // If there are still messages (scheduled ones), set timeout to process later
    if (this.queue.length > 0) {
      const nextScheduled = this.queue
        .filter(m => m.scheduledAt && m.scheduledAt > new Date())
        .sort((a, b) => (a.scheduledAt!.getTime() - b.scheduledAt!.getTime()))[0];

      if (nextScheduled) {
        const delay = nextScheduled.scheduledAt!.getTime() - Date.now();
        setTimeout(() => this.processQueue(), Math.min(delay, 60000)); // Max 1 minute wait
      }
    }
  }

  // Send individual message
  private async sendMessage(message: BroadcastMessage): Promise<boolean> {
    try {
      // Import the telegram bot module dynamically to avoid circular dependencies
      const telegramBot = await import('./telegram-bot');
      
      if (message.type === 'photo' && message.photoPath) {
        // Use the actual function from the telegram-bot module
        const TelegramBot = require('node-telegram-bot-api');
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const channelId = process.env.TELEGRAM_CHANNEL_ID;
        
        if (!botToken || !channelId) {
          console.log('⚠️ Telegram credentials not configured');
          return false;
        }

        const bot = new TelegramBot(botToken, { polling: false });
        
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            await bot.sendPhoto(channelId, message.photoPath, {
              caption: message.content || '',
              parse_mode: 'Markdown'
            });
            return true;
          } catch (error: any) {
            if (attempt === 2) {
              console.error(`❌ Photo send failed after 2 attempts:`, error.message);
              return false;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } else {
        // Send text message
        const TelegramBot = require('node-telegram-bot-api');
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const channelId = process.env.TELEGRAM_CHANNEL_ID;
        
        if (!botToken || !channelId) {
          console.log('⚠️ Telegram credentials not configured');
          return false;
        }

        const bot = new TelegramBot(botToken, { polling: false });
        
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            await bot.sendMessage(channelId, message.content, {
              parse_mode: 'Markdown',
              disable_web_page_preview: true
            });
            return true;
          } catch (error: any) {
            if (attempt === 2) {
              console.error(`❌ Message send failed after 2 attempts:`, error.message);
              return false;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      return false;
    } catch (error) {
      console.error(`❌ Error sending broadcast message ${message.id}:`, error);
      return false;
    }
  }

  // Get queue status
  public getStatus(): { pending: number; processing: boolean; nextScheduled?: Date } {
    const nextScheduled = this.queue
      .filter(m => m.scheduledAt && m.scheduledAt > new Date())
      .sort((a, b) => (a.scheduledAt!.getTime() - b.scheduledAt!.getTime()))[0];

    return {
      pending: this.queue.length,
      processing: this.processing,
      nextScheduled: nextScheduled?.scheduledAt
    };
  }

  // Clear queue
  public clearQueue(): number {
    const count = this.queue.length;
    this.queue = [];
    return count;
  }
}

// Export singleton instance
export const broadcastQueue = new BroadcastQueue();