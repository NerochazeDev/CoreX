import TelegramBot from 'node-telegram-bot-api';
import { broadcastQueue } from './broadcast-queue';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

let bot: TelegramBot | null = null;

function initBot(): TelegramBot | null {
  if (!botToken || !channelId) {
    console.warn('⚠️ Telegram credentials missing - notifications disabled');
    return null;
  }
  if (!bot) {
    bot = new TelegramBot(botToken, { polling: false });
    console.log('✅ Telegram bot initialized');
  }
  return bot;
}

async function sendToChannel(message: string, options: any = {}, retries = 3): Promise<boolean> {
  const botInstance = initBot();
  if (!botInstance || !channelId) return false;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await botInstance.sendMessage(channelId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options,
      });
      return true;
    } catch (error: any) {
      if (attempt === retries) {
        console.error(`❌ Telegram message failed after ${retries} attempts:`, error.message);
        return false;
      }
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
  return false;
}

async function sendPhotoToChannel(photoPath: string, caption = '', retries = 3): Promise<boolean> {
  const botInstance = initBot();
  if (!botInstance || !channelId) return false;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await botInstance.sendPhoto(channelId, photoPath, { caption, parse_mode: 'Markdown' });
      return true;
    } catch (error: any) {
      if (attempt === retries) {
        console.error(`❌ Telegram photo failed after ${retries} attempts:`, error.message);
        return false;
      }
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
  return false;
}

// ─── BTC Price ────────────────────────────────────────────────────────────────

async function fetchBtcPrice(): Promise<number> {
  const sources = [
    async () => {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('CoinGecko error');
      const data = await res.json();
      return data.bitcoin.usd as number;
    },
    async () => {
      const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('Coinbase error');
      const data = await res.json();
      return parseFloat(data.data.amount) as number;
    },
  ];

  for (const source of sources) {
    try {
      const price = await source();
      if (price > 10000) return price;
    } catch {}
  }

  console.warn('⚠️ All BTC price sources failed — using fallback');
  return 77000;
}

// ─── Platform Stats ───────────────────────────────────────────────────────────

const PLAN_BASELINES: Record<string, { active: number; amountBtc: number; profitBtc: number }> = {
  '$10 Plan':     { active: 3240, amountBtc: 26.597,   profitBtc: 2.631  },
  '$20 Plan':     { active: 2850, amountBtc: 46.791,   profitBtc: 4.610  },
  '$50 Plan':     { active: 2410, amountBtc: 98.775,   profitBtc: 9.820  },
  '$100 Plan':    { active: 1980, amountBtc: 162.542,  profitBtc: 16.375 },
  '$300 Plan':    { active: 1620, amountBtc: 398.916,  profitBtc: 39.152 },
  '$500 Plan':    { active: 1350, amountBtc: 554.042,  profitBtc: 56.561 },
  '$1,000 Plan':  { active: 1140, amountBtc: 935.846,  profitBtc: 91.373 },
  '$3,000 Plan':  { active: 580,  amountBtc: 1428.296, profitBtc: 283.394 },
  '$6,000 Plan':  { active: 175,  amountBtc: 862.013,  profitBtc: 203.725 },
  '$12,000 Plan': { active: 75,   amountBtc: 738.629,  profitBtc: 147.726 },
};

interface PlatformStats {
  btcPrice: number;
  totalUsers: number;
  activePositions: number;
  totalAumBtc: number;
  totalAumUsd: number;
  totalProfitBtc: number;
  totalProfitUsd: number;
  planBreakdown: Array<{
    name: string;
    investors: number;
    aumUsd: number;
    profitUsd: number;
    apyPct: number;
    minInvestment: string;
  }>;
}

async function buildPlatformStats(): Promise<PlatformStats> {
  const { storage } = await import('./storage');

  const [allUsers, allInvestments, investmentPlans, adminConfig, btcPrice] = await Promise.all([
    storage.getAllUsers(),
    storage.getAllInvestments(),
    storage.getInvestmentPlans(),
    storage.getAdminConfig(),
    fetchBtcPrice(),
  ]);

  const baselineUsers = adminConfig?.baselineUsers || 9850;
  const baselineActiveInvestments = adminConfig?.baselineActiveInvestments || 15420;
  const baselineTotalBalance = parseFloat(adminConfig?.baselineTotalBalance || '845.67342158');
  const baselineTotalProfit = parseFloat(adminConfig?.baselineTotalProfit || '127.84501632');

  const dbBalance = allUsers.reduce((s, u) => s + parseFloat(u.balance), 0);
  const dbProfit = allInvestments.reduce((s, i) => s + parseFloat(i.currentProfit || '0'), 0);
  const activeInvDb = allInvestments.filter(i => i.isActive);

  const totalAumBtc = baselineTotalBalance + dbBalance;
  const totalProfitBtc = baselineTotalProfit + dbProfit;
  const totalUsers = baselineUsers + allUsers.length;
  const activePositions = baselineActiveInvestments + activeInvDb.length;

  const planBreakdown = investmentPlans.map(plan => {
    const planInvs = activeInvDb.filter(i => i.planId === plan.id);
    const dbAmt = planInvs.reduce((s, i) => s + parseFloat(i.amount), 0);
    const dbProfit = planInvs.reduce((s, i) => s + parseFloat(i.currentProfit || '0'), 0);
    const base = PLAN_BASELINES[plan.name] ?? { active: 0, amountBtc: 0, profitBtc: 0 };

    const totalInvestors = base.active + planInvs.length;
    const totalAmtBtc = base.amountBtc + dbAmt;
    const totalProfitForPlan = base.profitBtc + dbProfit;

    return {
      name: plan.name,
      investors: totalInvestors,
      aumUsd: totalAmtBtc * btcPrice,
      profitUsd: totalProfitForPlan * btcPrice,
      apyPct: plan.roiPercentage,
      minInvestment: plan.usdMinAmount,
    };
  });

  planBreakdown.sort((a, b) => b.investors - a.investors);

  return {
    btcPrice,
    totalUsers,
    activePositions,
    totalAumBtc,
    totalAumUsd: totalAumBtc * btcPrice,
    totalProfitBtc,
    totalProfitUsd: totalProfitBtc * btcPrice,
    planBreakdown,
  };
}

// ─── Batch counter (kept for compatibility) ───────────────────────────────────

let updateBatchCount = 0;
let newInvestmentBatchCount = 0;

export function addInvestmentUpdateToBatch(update: any): void {
  updateBatchCount++;
}

export function addNewInvestmentToBatch(investment: any): void {
  newInvestmentBatchCount++;
}

export function getBatchStatistics() {
  return { updates: updateBatchCount, newInvestments: newInvestmentBatchCount };
}

export async function queueDailyStats(): Promise<string> {
  return broadcastQueue.addMessage({
    type: 'text',
    content: 'DAILY_STATS_PLACEHOLDER',
    priority: 'high',
    maxRetries: 3,
  });
}

export async function queueInvestmentUpdate(): Promise<string> {
  const bannerPath = './attached_assets/IMG_6814_1756042561574.jpeg';
  const bannerId = broadcastQueue.addMessage({
    type: 'photo',
    content: '📊 *BITVAULT PRO* — Market Update',
    photoPath: bannerPath,
    priority: 'normal',
    maxRetries: 3,
  });
  const messageId = broadcastQueue.addMessage({
    type: 'text',
    content: 'INVESTMENT_UPDATE_PLACEHOLDER',
    priority: 'normal',
    maxRetries: 3,
    scheduledAt: new Date(Date.now() + 5000),
  });
  return `${bannerId},${messageId}`;
}

export function getBroadcastStatus() {
  return broadcastQueue.getStatus();
}

// ─── Daily Stats Broadcast ────────────────────────────────────────────────────

export async function sendDailyStatsToChannel(): Promise<void> {
  console.log('📊 Sending daily stats to Telegram...');

  try {
    const stats = await buildPlatformStats();

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = now.toUTCString().slice(17, 22) + ' UTC';

    const planLines = stats.planBreakdown.map(p =>
      `• *${p.name}* — ${p.investors.toLocaleString()} investors — $${p.aumUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} AUM — ${p.apyPct}% APY`
    ).join('\n');

    const yieldPct = stats.totalAumBtc > 0
      ? ((stats.totalProfitBtc / stats.totalAumBtc) * 100).toFixed(2)
      : '0.00';

    const message =
`🏦 *BITVAULT PRO — DAILY REPORT*
${dateStr}  •  ${timeStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━

*₿ Bitcoin Price*
$${stats.btcPrice.toLocaleString('en-US')} USD

*📊 Platform Overview*
👥 Active Investors: *${stats.totalUsers.toLocaleString()}*
📂 Open Positions:  *${stats.activePositions.toLocaleString()}*
💼 Total AUM:       *${stats.totalAumBtc.toFixed(4)} BTC  ($${stats.totalAumUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })})*
💰 Total Returns:   *${stats.totalProfitBtc.toFixed(4)} BTC  ($${stats.totalProfitUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })})*
📈 Platform Yield:  *${yieldPct}%*

━━━━━━━━━━━━━━━━━━━━━━━━━━

*💹 Investment Plans*

${planLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━

*bitvault.pro*  •  Automated Bitcoin Investment`;

    const sent = await sendToChannel(message);
    if (sent) console.log('✅ Daily stats sent to Telegram');
  } catch (err: any) {
    console.error('❌ Failed to send daily stats:', err.message);
  }
}

// ─── Batched Update Broadcast ─────────────────────────────────────────────────

export async function sendBatchedUpdatesToChannel(): Promise<void> {
  console.log('📱 Sending update to Telegram...');

  try {
    const bannerPath = './attached_assets/IMG_6814_1756042561574.jpeg';
    const bannerSent = await sendPhotoToChannel(bannerPath, '📊 *BITVAULT PRO* — Market Update');

    const stats = await buildPlatformStats();

    const now = new Date();
    const timeStr = now.toUTCString().slice(17, 22) + ' UTC';

    const top5 = stats.planBreakdown.slice(0, 5).map((p, i) =>
      `${i + 1}. *${p.name}*  —  ${p.investors.toLocaleString()} investors  •  ${p.apyPct}% APY`
    ).join('\n');

    const message =
`📊 *BITVAULT PRO — LIVE UPDATE*
${timeStr}

*₿ BTC/USD:* $${stats.btcPrice.toLocaleString('en-US')}

*Platform Snapshot*
• Investors:      ${stats.totalUsers.toLocaleString()}
• Open Positions: ${stats.activePositions.toLocaleString()}
• AUM:            ${stats.totalAumBtc.toFixed(4)} BTC  ($${stats.totalAumUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })})
• Returns Paid:   $${stats.totalProfitUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}

*Top Investment Plans*
${top5}

━━━━━━━━━━━━━━━━━━━━━━━━━━
*bitvault.pro*`;

    const delay = bannerSent ? 5000 : 0;
    setTimeout(async () => {
      const sent = await sendToChannel(message);
      if (sent) console.log('✅ Live update sent to Telegram');
    }, delay);

  } catch (err: any) {
    console.error('❌ Batch update failed:', err.message);
    await sendToChannel(
`📊 *BITVAULT PRO — Update*

Investment plans active and generating returns.
Visit *bitvault.pro* to view your account.`
    );
  }
}

export { bot };
