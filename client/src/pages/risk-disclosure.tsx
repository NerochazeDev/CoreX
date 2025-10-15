
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, TrendingDown, Shield } from "lucide-react";
import { Link } from "wouter";

export default function RiskDisclosure() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/invest">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Risk Disclosure Statement</h1>
            <p className="text-slate-600 dark:text-slate-400">Last Updated: January 15, 2025</p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500 dark:border-amber-600 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-2">
                Important Investment Warning
              </h3>
              <p className="text-amber-800 dark:text-amber-300">
                Cryptocurrency investments involve substantial risk of loss. You should only invest funds that you can afford to lose entirely. This disclosure outlines key risks associated with using BitVault Pro investment services.
              </p>
            </div>
          </div>
        </div>

        <Card className="border-2 border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6 prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                <TrendingDown className="w-6 h-6 text-red-600" />
                1. Market Volatility Risk
              </h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Extreme Price Fluctuations:</strong> Cryptocurrency markets are characterized by extreme volatility. Bitcoin and other digital assets can experience price swings of 10-30% or more in a single day. These fluctuations can result in significant losses to your investment principal.</p>
                
                <p><strong>Unpredictable Market Conditions:</strong> Cryptocurrency markets operate 24/7 and are influenced by factors including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Global economic events and macroeconomic policy changes</li>
                  <li>Regulatory announcements and legal developments</li>
                  <li>Technical network issues and security breaches</li>
                  <li>Market manipulation and coordinated trading activities</li>
                  <li>Media sentiment and social media influence</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Loss of Principal Risk</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Total Loss Potential:</strong> You may lose your entire investment. Past performance of our trading strategies does not guarantee future results. Market conditions can deteriorate rapidly, and algorithmic trading systems may fail to protect capital during extreme volatility.</p>
                
                <p><strong>No Capital Guarantees:</strong> Unlike traditional bank deposits, cryptocurrency investments are not insured by government agencies (FDIC, SIPC, etc.). There is no protection against losses due to market movements or platform failure.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Regulatory and Legal Risks</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Evolving Regulatory Landscape:</strong> Cryptocurrency regulations vary significantly by jurisdiction and are subject to rapid change. New regulations may:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Prohibit or restrict cryptocurrency activities in your jurisdiction</li>
                  <li>Impose additional tax obligations or reporting requirements</li>
                  <li>Limit platform operations or force service discontinuation</li>
                  <li>Impact the legal status and tradability of digital assets</li>
                </ul>
                
                <p><strong>Compliance Requirements:</strong> You are responsible for understanding and complying with all applicable tax laws and regulations in your jurisdiction regarding cryptocurrency investments.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Technology and Security Risks</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Cybersecurity Threats:</strong> Despite robust security measures, cryptocurrency platforms face persistent threats from:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Hacking attempts and unauthorized access</li>
                  <li>Phishing attacks targeting user credentials</li>
                  <li>Smart contract vulnerabilities and exploits</li>
                  <li>Distributed denial-of-service (DDoS) attacks</li>
                </ul>
                
                <p><strong>Technical Failures:</strong> Platform operations may be disrupted by technical issues, software bugs, network failures, or infrastructure problems. Such disruptions may prevent access to your account or delay transactions.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Liquidity Risk</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Market Liquidity:</strong> During periods of market stress, cryptocurrency markets may experience reduced liquidity, making it difficult to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Execute trades at desired prices</li>
                  <li>Exit positions without significant price impact</li>
                  <li>Process withdrawal requests within normal timeframes</li>
                </ul>
                
                <p><strong>Platform Liquidity:</strong> Investment durations are fixed per plan. Early withdrawal may result in penalties or may not be possible during active investment periods.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Operational Risks</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Platform Dependency:</strong> Your ability to access funds and execute transactions depends entirely on BitVault Pro's continued operation. Risks include:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Business failure or bankruptcy of the platform</li>
                  <li>Regulatory actions forcing platform closure</li>
                  <li>Management decisions affecting service availability</li>
                  <li>Technical infrastructure failures</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Algorithmic Trading Risks</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Strategy Performance:</strong> Our automated trading algorithms are designed based on historical market data and may not perform as expected in:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Unprecedented market conditions</li>
                  <li>Black swan events or market crashes</li>
                  <li>Periods of extreme volatility or illiquidity</li>
                  <li>Changing market structures or trading dynamics</li>
                </ul>
                
                <p><strong>No Performance Guarantees:</strong> Projected returns are estimates based on historical performance. Actual results may differ significantly and may result in losses.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Counterparty Risk</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Third-Party Dependencies:</strong> BitVault Pro relies on various third-party service providers including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cryptocurrency exchanges for trade execution</li>
                  <li>Wallet providers for asset custody</li>
                  <li>Payment processors for deposits and withdrawals</li>
                  <li>Technology infrastructure providers</li>
                </ul>
                <p>Failure or misconduct by any of these parties may result in losses or service disruptions.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Performance Fee Structure</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Fee Impact on Returns:</strong> Performance fees (10-20% depending on plan) are deducted from gross profits, reducing your net returns. In volatile markets, fees may consume a significant portion of gains.</p>
                
                <p><strong>Fee Calculation:</strong> Fees are calculated on gross profits without consideration of prior losses. This means fees may be charged even if your overall account shows a loss from previous periods.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">10. Suitability and Investment Advice</h2>
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                  <div className="space-y-3 text-slate-700 dark:text-slate-300">
                    <p><strong>No Investment Advice:</strong> BitVault Pro does not provide personalized investment advice. We do not assess the suitability of our services for your individual financial situation.</p>
                    
                    <p><strong>Your Responsibility:</strong> Before investing, you should:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Carefully assess your financial situation and risk tolerance</li>
                      <li>Consider consulting with independent financial advisors</li>
                      <li>Only invest funds you can afford to lose completely</li>
                      <li>Understand all risks outlined in this disclosure</li>
                      <li>Ensure cryptocurrency investments are permitted in your jurisdiction</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">11. Acknowledgment</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p>By using BitVault Pro, you acknowledge that:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You have read and understood all risks outlined in this disclosure</li>
                  <li>You accept full responsibility for your investment decisions</li>
                  <li>You understand that past performance does not guarantee future results</li>
                  <li>You may lose your entire investment principal</li>
                  <li>No guarantees or warranties are made regarding investment returns</li>
                  <li>You have sought independent advice where necessary</li>
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/invest">
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
