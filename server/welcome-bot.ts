// Welcome bot functionality removed - all functionality moved to main telegram-bot.ts
// This file is kept for backwards compatibility with imports

export async function sendTestWelcomeMessage(): Promise<void> {
  throw new Error('Welcome bot has been removed - all functionality moved to main telegram-bot.ts');
}

export const welcomeBot = null;