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

// ─── Fake Activity Generators ─────────────────────────────────────────────────

function randomUserId(): string {
  return `User #${randomInt(1000, 99999)}`;
}

const COUNTRIES = ['🇺🇸 USA', '🇬🇧 UK', '🇨🇦 Canada', '🇦🇺 Australia', '🇩🇪 Germany', '🇫🇷 France', '🇳🇬 Nigeria', '🇿🇦 South Africa', '🇬🇭 Ghana', '🇮🇳 India', '🇧🇷 Brazil', '🇯🇵 Japan', '🇳🇱 Netherlands', '🇦🇪 UAE', '🇸🇬 Singapore', '🇰🇪 Kenya', '🇨🇦 Canada', '🇲🇽 Mexico', '🇮🇹 Italy', '🇷🇺 Russia'];

const PLAN_AMOUNTS = ['$10', '$20', '$50', '$100', '$300', '$500', '$1,000', '$3,000', '$6,000', '$12,000'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateActivityFeed(count: number): string[] {
  const actions = [
    () => `💰 *${randomUserId()}* from ${randomItem(COUNTRIES)} just invested *${randomItem(PLAN_AMOUNTS)}*`,
    () => `✅ *${randomUserId()}* from ${randomItem(COUNTRIES)} received profit payout`,
    () => `🔄 *${randomUserId()}* from ${randomItem(COUNTRIES)} reinvested returns into *${randomItem(PLAN_AMOUNTS)} Plan*`,
    () => `🆕 *${randomUserId()}* from ${randomItem(COUNTRIES)} joined BitVault Pro`,
    () => `🏆 *${randomUserId()}* from ${randomItem(COUNTRIES)} upgraded to *${randomItem(['$500', '$1,000', '$3,000', '$6,000', '$12,000'])} Plan*`,
  ];

  return Array.from({ length: count }, () => randomItem(actions)());
}

function generateRecentPayouts(_btcPrice: number, count: number): string[] {
  return Array.from({ length: count }, () => {
    const usdAmount = randomItem([10, 20, 50, 100, 300, 500, 1000, 3000, 6000, 12000]);
    const roiPct = randomItem([5, 8, 3.5, 10, 15, 20, 25, 30, 40, 50]) / 100;
    const profit = (usdAmount * roiPct * randomInt(1, 5) / 30).toFixed(2);
    const country = randomItem(COUNTRIES);
    return `💸 *${randomUserId()}* (${country}) — +*$${profit}* profit from *$${usdAmount} Plan*`;
  });
}

const SENTIMENTS = ['📈 Bullish', '🚀 Strong Bullish', '📊 Accumulation', '💹 Breakout Watch', '🟢 Positive'];
const MARKET_NOTES = [
  'Institutional inflows increasing — whale wallets accumulating.',
  'On-chain data shows long-term holder strength rising.',
  'Exchange outflows signal reduced sell pressure.',
  'Derivatives funding rate neutral — healthy momentum.',
  'ETF net inflows positive for 7th consecutive session.',
  'Hash rate at all-time high — network security at peak.',
  'Retail interest rising — Google Trends BTC searches up 23%.',
  'Spot market volume up — organic demand confirmed.',
];

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

interface PlanStat {
  name: string;
  investors: number;
  aumUsd: number;
  profitUsd: number;
  apyPct: number;
}

interface PlatformStats {
  btcPrice: number;
  totalUsers: number;
  activePositions: number;
  totalAumBtc: number;
  totalAumUsd: number;
  totalProfitBtc: number;
  totalProfitUsd: number;
  planBreakdown: PlanStat[];
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

  const baselineUsers             = adminConfig?.baselineUsers || 9850;
  const baselineActiveInvestments = adminConfig?.baselineActiveInvestments || 15420;
  const baselineTotalBalance      = parseFloat(adminConfig?.baselineTotalBalance || '845.67342158');
  const baselineTotalProfit       = parseFloat(adminConfig?.baselineTotalProfit  || '127.84501632');

  const dbBalance   = allUsers.reduce((s, u) => s + parseFloat(u.balance), 0);
  const dbProfit    = allInvestments.reduce((s, i) => s + parseFloat(i.currentProfit || '0'), 0);
  const activeInvDb = allInvestments.filter(i => i.isActive);

  const totalAumBtc    = baselineTotalBalance + dbBalance;
  const totalProfitBtc = baselineTotalProfit  + dbProfit;
  const totalUsers     = baselineUsers + allUsers.length;
  const activePositions = baselineActiveInvestments + activeInvDb.length;

  const planBreakdown: PlanStat[] = investmentPlans.map(plan => {
    const planInvs = activeInvDb.filter(i => i.planId === plan.id);
    const dbAmt    = planInvs.reduce((s, i) => s + parseFloat(i.amount), 0);
    const dbPft    = planInvs.reduce((s, i) => s + parseFloat(i.currentProfit || '0'), 0);
    const base     = PLAN_BASELINES[plan.name] ?? { active: 0, amountBtc: 0, profitBtc: 0 };

    return {
      name:       plan.name,
      investors:  base.active + planInvs.length,
      aumUsd:     (base.amountBtc + dbAmt) * btcPrice,
      profitUsd:  (base.profitBtc + dbPft) * btcPrice,
      apyPct:     plan.roiPercentage,
    };
  });

  planBreakdown.sort((a, b) => b.investors - a.investors);

  return { btcPrice, totalUsers, activePositions, totalAumBtc, totalAumUsd: totalAumBtc * btcPrice, totalProfitBtc, totalProfitUsd: totalProfitBtc * btcPrice, planBreakdown };
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

// ─── Batch counter (kept for compatibility) ───────────────────────────────────

let updateBatchCount = 0;
let newInvestmentBatchCount = 0;

export function addInvestmentUpdateToBatch(_update: any): void { updateBatchCount++; }
export function addNewInvestmentToBatch(_inv: any): void { newInvestmentBatchCount++; }
export function getBatchStatistics() { return { updates: updateBatchCount, newInvestments: newInvestmentBatchCount }; }

export async function queueDailyStats(): Promise<string> {
  return broadcastQueue.addMessage({ type: 'text', content: 'DAILY_STATS_PLACEHOLDER', priority: 'high', maxRetries: 3 });
}

export async function queueInvestmentUpdate(): Promise<string> {
  const bannerPath = './attached_assets/IMG_6814_1756042561574.jpeg';
  const bannerId = broadcastQueue.addMessage({ type: 'photo', content: '📊 *BITVAULT PRO* — Market Update', photoPath: bannerPath, priority: 'normal', maxRetries: 3 });
  const messageId = broadcastQueue.addMessage({ type: 'text', content: 'INVESTMENT_UPDATE_PLACEHOLDER', priority: 'normal', maxRetries: 3, scheduledAt: new Date(Date.now() + 5000) });
  return `${bannerId},${messageId}`;
}

export function getBroadcastStatus() { return broadcastQueue.getStatus(); }

// ─── Daily Stats Broadcast ────────────────────────────────────────────────────

export async function sendDailyStatsToChannel(): Promise<void> {
  console.log('📊 Sending daily stats to Telegram...');
  try {
    const stats = await buildPlatformStats();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = now.toUTCString().slice(17, 22) + ' UTC';

    const newJoined   = randomInt(38, 127);
    const newInvested = randomInt(12, 54);
    const hourlyPayout = (stats.totalAumUsd * 0.0004 * (0.9 + Math.random() * 0.2));
    const sentiment   = randomItem(SENTIMENTS);
    const marketNote  = randomItem(MARKET_NOTES);
    const trendingPlan = stats.planBreakdown[randomInt(0, 2)];
    const activity    = generateActivityFeed(5);
    const payouts     = generateRecentPayouts(stats.btcPrice, 4);

    const planLines = stats.planBreakdown.map((p, i) => {
      const bar = i === 0 ? '🔥' : i < 3 ? '⭐' : '▪️';
      return `${bar} *${p.name}* — ${fmt(p.investors)} investors — $${fmt(p.aumUsd)} AUM — ${p.apyPct}% APY`;
    }).join('\n');

    const message =
`🏦 *BITVAULT PRO — DAILY REPORT*
${dateStr}  •  ${timeStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━

₿ *Bitcoin Price:* $${fmt(stats.btcPrice)}
📊 *Sentiment:* ${sentiment}
📌 ${marketNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━

*📈 Platform Overview*
👥 Active Investors:  *${fmt(stats.totalUsers)}*
📂 Open Positions:    *${fmt(stats.activePositions)}*
💼 Total AUM:         *${stats.totalAumBtc.toFixed(4)} BTC  ($${fmt(stats.totalAumUsd)})*
💰 Total Returns:     *$${fmt(stats.totalProfitUsd)}*
⚡ Profits/Hour:      *$${fmt(hourlyPayout, 2)}* paid out now
🕐 New Investors (24h): *+${newJoined}* joined
📥 New Investments (24h): *${newInvested}* opened

━━━━━━━━━━━━━━━━━━━━━━━━━━

*🔥 Trending Plan Today*
*${trendingPlan.name}* • ${fmt(trendingPlan.investors)} active investors
AUM: $${fmt(trendingPlan.aumUsd)} • APY: ${trendingPlan.apyPct}%

━━━━━━━━━━━━━━━━━━━━━━━━━━

*💹 All Investment Plans*

${planLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━

*⚡ Live Activity Feed*

${activity.join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━

*💸 Recent Payouts*

${payouts.join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━

🏦 *bitvault.pro*  •  Automated Bitcoin Investment
🔒 Secured • 24/7 Active • Profits Paid Every 5 Min`;

    const sent = await sendToChannel(message);
    if (sent) console.log('✅ Daily stats sent to Telegram');
  } catch (err: any) {
    console.error('❌ Failed to send daily stats:', err.message);
  }
}

// ─── Batched (Live) Update Broadcast ─────────────────────────────────────────

export async function sendBatchedUpdatesToChannel(): Promise<void> {
  console.log('📱 Sending live update to Telegram...');
  try {
    const bannerPath = './attached_assets/IMG_6814_1756042561574.jpeg';
    const bannerSent = await sendPhotoToChannel(bannerPath, '📊 *BITVAULT PRO* — Live Market Update');

    const stats = await buildPlatformStats();
    const now   = new Date();
    const timeStr = now.toUTCString().slice(17, 22) + ' UTC';

    const newJoined   = randomInt(2, 14);
    const openedLast  = randomInt(1, 8);
    const sentiment   = randomItem(SENTIMENTS);
    const marketNote  = randomItem(MARKET_NOTES);
    const activity    = generateActivityFeed(6);
    const payouts     = generateRecentPayouts(stats.btcPrice, 3);
    const trendingPlan = stats.planBreakdown[randomInt(0, 2)];
    const hourlyPayout = (stats.totalAumUsd * 0.0004 * (0.9 + Math.random() * 0.2));

    // Price movement flavour
    const change  = (Math.random() * 1.8 - 0.5).toFixed(2);
    const arrow   = parseFloat(change) >= 0 ? '▲' : '▼';
    const changeAbs = Math.abs(parseFloat(change)).toFixed(2);

    const top5 = stats.planBreakdown.slice(0, 5).map((p, i) => {
      const stars = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '▪️';
      return `${stars} *${p.name}*  —  ${fmt(p.investors)} investors  •  ${p.apyPct}% APY`;
    }).join('\n');

    const message =
`📊 *BITVAULT PRO — LIVE UPDATE*
${timeStr}

₿ *BTC/USD:* $${fmt(stats.btcPrice)}  ${arrow} ${changeAbs}%
📊 *Market:* ${sentiment}
📌 ${marketNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━

*Platform Snapshot*
• Investors:       ${fmt(stats.totalUsers)}
• Open Positions:  ${fmt(stats.activePositions)}
• AUM:             ${stats.totalAumBtc.toFixed(4)} BTC  ($${fmt(stats.totalAumUsd)})
• Total Returns:   $${fmt(stats.totalProfitUsd)}
• Profits/Hour:    *$${fmt(hourlyPayout, 2)}*
• Joined (1hr):    *+${newJoined}* new investors
• New Positions:   *${openedLast}* opened this hour

━━━━━━━━━━━━━━━━━━━━━━━━━━

*🔥 Most Active Plan*
${trendingPlan.name} • ${fmt(trendingPlan.investors)} investors • $${fmt(trendingPlan.aumUsd)} AUM

━━━━━━━━━━━━━━━━━━━━━━━━━━

*🏆 Top Investment Plans*
${top5}

━━━━━━━━━━━━━━━━━━━━━━━━━━

*⚡ Just Happened*

${activity.join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━

*💸 Recent Payouts*

${payouts.join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━

🏦 *bitvault.pro*  •  Profits every 5 minutes 🚀`;

    const delay = bannerSent ? 5000 : 0;
    setTimeout(async () => {
      const sent = await sendToChannel(message);
      if (sent) console.log('✅ Live update sent to Telegram');
    }, delay);

  } catch (err: any) {
    console.error('❌ Live update failed:', err.message);
    await sendToChannel(
`📊 *BITVAULT PRO — Market Update*

₿ Bitcoin investment platform — profits distributed every 5 minutes.
Thousands of investors earning daily returns right now.

*bitvault.pro*`
    );
  }
}

export { bot };
