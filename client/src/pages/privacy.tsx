
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Lock, Eye, Database, Shield } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
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
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <Lock className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
            <p className="text-slate-600 dark:text-slate-400">Last Updated: January 15, 2025</p>
          </div>
        </div>

        <Card className="border-2 border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6 prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                <Eye className="w-6 h-6 text-green-600" />
                1. Information We Collect
              </h2>
              <div className="space-y-4 text-slate-700 dark:text-slate-300">
                <p><strong>1.1 Personal Information:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Name, email address, and contact information</li>
                  <li>Government-issued identification for KYC/AML compliance</li>
                  <li>Financial information including transaction history</li>
                  <li>Cryptocurrency wallet addresses and transaction data</li>
                  <li>IP address and device information</li>
                </ul>
                
                <p><strong>1.2 Usage Information:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Platform interaction data and user preferences</li>
                  <li>Investment activity and portfolio performance</li>
                  <li>Communication records with customer support</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                <Database className="w-6 h-6 text-green-600" />
                2. How We Use Your Information
              </h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p>BitVault Pro uses collected information for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Management:</strong> Creating and maintaining your investment account</li>
                  <li><strong>Transaction Processing:</strong> Executing deposits, withdrawals, and investment operations</li>
                  <li><strong>Regulatory Compliance:</strong> Meeting KYC, AML, and other legal requirements</li>
                  <li><strong>Security:</strong> Detecting and preventing fraud, unauthorized access, and illegal activities</li>
                  <li><strong>Customer Support:</strong> Responding to inquiries and resolving issues</li>
                  <li><strong>Platform Improvement:</strong> Analyzing usage patterns to enhance services</li>
                  <li><strong>Communications:</strong> Sending important notifications, updates, and marketing materials (with consent)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Data Security Measures</h2>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-4">
                <p className="text-green-900 dark:text-green-200 font-semibold mb-2">
                  <Shield className="w-5 h-5 inline mr-2" />
                  Enterprise-Grade Security
                </p>
                <p className="text-green-800 dark:text-green-300 text-sm">
                  We employ bank-level security measures to protect your personal and financial information.
                </p>
              </div>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <ul className="list-disc pl-6 space-y-2">
                  <li>256-bit SSL/TLS encryption for all data transmission</li>
                  <li>Multi-factor authentication for account access</li>
                  <li>Cold wallet storage for 95% of cryptocurrency assets</li>
                  <li>Regular security audits by independent third parties</li>
                  <li>Encrypted database storage with access controls</li>
                  <li>24/7 security monitoring and threat detection</li>
                  <li>Employee background checks and confidentiality agreements</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Information Sharing and Disclosure</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>4.1 We Do Not Sell Your Information:</strong> BitVault Pro does not sell, rent, or trade your personal information to third parties for marketing purposes.</p>
                
                <p><strong>4.2 Limited Sharing:</strong> We may share information with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Service Providers:</strong> Third-party processors assisting with platform operations (under strict confidentiality agreements)</li>
                  <li><strong>Regulatory Authorities:</strong> Government agencies and law enforcement when legally required</li>
                  <li><strong>Legal Proceedings:</strong> Courts and legal representatives in response to valid legal requests</li>
                  <li><strong>Business Transfers:</strong> Potential acquirers in the event of merger, acquisition, or sale (with notification)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Your Privacy Rights</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p>You have the following rights regarding your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
                  <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
                  <li><strong>Restriction:</strong> Limit how we use your information in certain circumstances</li>
                </ul>
                <p className="mt-4">To exercise these rights, contact our privacy team through the platform support system.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Cookie Policy</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p>BitVault Pro uses cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintain your login session and preferences</li>
                  <li>Analyze platform usage and performance</li>
                  <li>Enhance security and prevent fraud</li>
                  <li>Provide personalized user experience</li>
                </ul>
                <p className="mt-4">You can manage cookie preferences through your browser settings, though this may affect platform functionality.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
              <p className="text-slate-700 dark:text-slate-300">
                We retain your personal information for as long as necessary to provide services and comply with legal obligations. Account data is retained for a minimum of 7 years post-closure to meet regulatory requirements. Transaction records are maintained indefinitely for audit and compliance purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. International Data Transfers</h2>
              <p className="text-slate-700 dark:text-slate-300">
                Your information may be transferred to and processed in countries outside your jurisdiction. We ensure appropriate safeguards are in place, including standard contractual clauses and adequate data protection measures, to protect your information during international transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
              <p className="text-slate-700 dark:text-slate-300">
                BitVault Pro does not knowingly collect information from individuals under 18 years of age. If we discover that we have inadvertently collected such information, we will promptly delete it from our systems.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">10. Third-Party Links</h2>
              <p className="text-slate-700 dark:text-slate-300">
                Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">11. Changes to Privacy Policy</h2>
              <p className="text-slate-700 dark:text-slate-300">
                We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. Material changes will be communicated via email or prominent platform notification. Continued use after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">12. Contact Information</h2>
              <p className="text-slate-700 dark:text-slate-300">
                For privacy-related inquiries, data subject requests, or concerns about how your information is handled, please contact our Data Protection Officer through the platform's support system or Telegram community.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/invest">
            <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
