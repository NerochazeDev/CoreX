
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, Shield, Scale } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
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
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
            <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Terms of Service</h1>
            <p className="text-slate-600 dark:text-slate-400">Last Updated: January 15, 2025</p>
          </div>
        </div>

        <Card className="border-2 border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6 prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                <Scale className="w-6 h-6 text-orange-600" />
                1. Agreement to Terms
              </h2>
              <p className="text-slate-700 dark:text-slate-300">
                By accessing and using BitVault Pro ("Platform", "Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with these terms, you are prohibited from using or accessing this platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Eligibility Requirements</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p>To use BitVault Pro, you must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Be at least 18 years of age or the legal age of majority in your jurisdiction</li>
                  <li>Have the legal capacity to enter into binding contracts</li>
                  <li>Not be located in a jurisdiction where cryptocurrency services are prohibited</li>
                  <li>Comply with all applicable anti-money laundering (AML) and know-your-customer (KYC) requirements</li>
                  <li>Not be listed on any financial sanctions or prohibited persons lists</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Investment Services</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>3.1 Nature of Services:</strong> BitVault Pro provides automated cryptocurrency investment management services. Our platform utilizes algorithmic trading strategies, market arbitrage, and diversified investment approaches to generate returns.</p>
                <p><strong>3.2 Investment Plans:</strong> Various investment plans are available with different minimum investment amounts, return rates, and durations. All projected returns are estimates based on historical performance and are not guaranteed.</p>
                <p><strong>3.3 Performance Fees:</strong> The platform charges performance fees as specified in each investment plan. These fees are automatically deducted from gross profits before distribution to your account.</p>
                <p><strong>3.4 No Investment Advice:</strong> BitVault Pro does not provide personalized investment advice. All investment decisions are made at your own discretion and risk.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Risk Disclosure</h2>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-4">
                <p className="text-amber-900 dark:text-amber-200 font-semibold mb-2">
                  <Shield className="w-5 h-5 inline mr-2" />
                  Important Risk Notice
                </p>
                <p className="text-amber-800 dark:text-amber-300 text-sm">
                  Cryptocurrency investments carry substantial risk of loss. You should only invest funds that you can afford to lose entirely. Past performance does not guarantee future results.
                </p>
              </div>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p>By using this platform, you acknowledge:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cryptocurrency markets are highly volatile and unpredictable</li>
                  <li>You may lose your entire investment principal</li>
                  <li>Returns are not guaranteed and may vary significantly</li>
                  <li>Market conditions can change rapidly and without warning</li>
                  <li>Regulatory changes may impact platform operations</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Account Security</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>5.1 Account Credentials:</strong> You are responsible for maintaining the confidentiality of your account credentials, including passwords and recovery codes.</p>
                <p><strong>5.2 Unauthorized Access:</strong> You must immediately notify BitVault Pro of any unauthorized access to your account or security breach.</p>
                <p><strong>5.3 Two-Factor Authentication:</strong> We strongly recommend enabling all available security features, including two-factor authentication.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Deposits and Withdrawals</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>6.1 Deposit Processing:</strong> All deposits require administrative verification before being credited to your account. Processing times may vary based on network conditions and verification requirements.</p>
                <p><strong>6.2 Withdrawal Requests:</strong> Withdrawal requests are processed subject to verification and security checks. We reserve the right to delay or refuse withdrawals that appear suspicious or violate these terms.</p>
                <p><strong>6.3 Minimum Amounts:</strong> Minimum deposit and withdrawal amounts apply as specified on the platform. Network fees may be deducted from withdrawal amounts.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Prohibited Activities</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the platform for money laundering or terrorist financing</li>
                  <li>Provide false or misleading information during registration</li>
                  <li>Attempt to manipulate or exploit platform systems</li>
                  <li>Create multiple accounts to circumvent platform limits</li>
                  <li>Use automated systems to access the platform without authorization</li>
                  <li>Engage in any illegal activities through the platform</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Intellectual Property</h2>
              <p className="text-slate-700 dark:text-slate-300">
                All content, trademarks, logos, and intellectual property on BitVault Pro are owned by or licensed to us. You may not reproduce, distribute, or create derivative works without express written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p>To the maximum extent permitted by law:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>BitVault Pro is not liable for any direct, indirect, incidental, or consequential damages</li>
                  <li>We are not responsible for losses resulting from market volatility</li>
                  <li>Our liability is limited to the amount of fees paid to us in the preceding 12 months</li>
                  <li>We do not guarantee uninterrupted or error-free platform operation</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">10. Termination</h2>
              <p className="text-slate-700 dark:text-slate-300">
                We reserve the right to suspend or terminate your account at any time for violation of these terms, suspicious activity, or regulatory requirements. Upon termination, you may withdraw your remaining balance subject to verification.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">11. Governing Law</h2>
              <p className="text-slate-700 dark:text-slate-300">
                These Terms of Service are governed by applicable financial regulations and laws. Any disputes shall be resolved through binding arbitration in accordance with established arbitration rules.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">12. Modifications to Terms</h2>
              <p className="text-slate-700 dark:text-slate-300">
                BitVault Pro reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms. Material changes will be communicated via email or platform notifications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
              <p className="text-slate-700 dark:text-slate-300">
                For questions regarding these Terms of Service, please contact our compliance team through the platform's support system or via Telegram community.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/invest">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
