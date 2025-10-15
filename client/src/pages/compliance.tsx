
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Shield, FileCheck, Users } from "lucide-react";
import { Link } from "wouter";

export default function Compliance() {
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
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Regulatory Compliance</h1>
            <p className="text-slate-600 dark:text-slate-400">Our Commitment to Legal and Regulatory Standards</p>
          </div>
        </div>

        <Card className="border-2 border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6 prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                <FileCheck className="w-6 h-6 text-blue-600" />
                1. Regulatory Framework
              </h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Commitment to Compliance:</strong> BitVault Pro operates in strict accordance with applicable financial regulations, anti-money laundering (AML) laws, and know-your-customer (KYC) requirements across all jurisdictions where we provide services.</p>
                
                <p><strong>Licensed Operations:</strong> Our platform maintains appropriate licenses and registrations as required by financial regulatory authorities. We continuously monitor regulatory developments to ensure ongoing compliance.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                2. Know Your Customer (KYC) Requirements
              </h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Identity Verification:</strong> All users must complete identity verification before accessing investment services. This process includes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Government-issued photo identification (passport, driver's license, national ID)</li>
                  <li>Proof of residential address (utility bill, bank statement, etc.)</li>
                  <li>Selfie verification to confirm identity authenticity</li>
                  <li>Additional documentation for enhanced due diligence when required</li>
                </ul>
                
                <p><strong>Enhanced Due Diligence:</strong> For high-value investments or transactions, we may require:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Source of funds documentation</li>
                  <li>Source of wealth verification</li>
                  <li>Enhanced background checks</li>
                  <li>Ongoing monitoring and periodic re-verification</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Anti-Money Laundering (AML) Compliance</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>AML Program:</strong> BitVault Pro maintains a comprehensive AML program including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Risk Assessment:</strong> Regular evaluation of money laundering and terrorist financing risks</li>
                  <li><strong>Transaction Monitoring:</strong> Automated systems detecting suspicious activities and patterns</li>
                  <li><strong>Sanctions Screening:</strong> Checking users against international sanctions lists (OFAC, UN, EU, etc.)</li>
                  <li><strong>Suspicious Activity Reporting:</strong> Filing reports with relevant authorities when required</li>
                  <li><strong>Record Keeping:</strong> Maintaining comprehensive transaction records for regulatory periods</li>
                </ul>
                
                <p><strong>Prohibited Activities:</strong> We actively prevent and investigate:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Transactions involving sanctioned individuals or entities</li>
                  <li>Structured transactions designed to evade reporting thresholds</li>
                  <li>Mixing services or coin tumbling activities</li>
                  <li>Transactions linked to illegal marketplaces or darknet activities</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Counter-Terrorist Financing (CTF)</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>CTF Measures:</strong> BitVault Pro implements robust controls to prevent terrorist financing:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Screening all users against terrorist watch lists and databases</li>
                  <li>Monitoring for patterns consistent with terrorist financing</li>
                  <li>Immediate reporting of suspected terrorist financing activity</li>
                  <li>Freezing accounts linked to terrorist organizations</li>
                  <li>Cooperation with law enforcement and intelligence agencies</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Data Protection and Privacy Compliance</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Regulatory Standards:</strong> We comply with international data protection regulations including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>GDPR:</strong> European General Data Protection Regulation for EU users</li>
                  <li><strong>CCPA:</strong> California Consumer Privacy Act for California residents</li>
                  <li><strong>Industry Standards:</strong> ISO 27001 information security management</li>
                </ul>
                
                <p><strong>Data Security:</strong> Implementation of technical and organizational measures to protect personal data against unauthorized access, loss, or disclosure.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Financial Crime Prevention</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Fraud Detection:</strong> Advanced systems monitor for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Account takeover attempts and unauthorized access</li>
                  <li>Identity theft and synthetic identity fraud</li>
                  <li>Payment fraud and chargeback abuse</li>
                  <li>Market manipulation and wash trading</li>
                </ul>
                
                <p><strong>Internal Controls:</strong> Segregation of duties, dual authorization for critical operations, and regular internal audits ensure operational integrity.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Tax Compliance</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Tax Reporting:</strong> BitVault Pro facilitates tax compliance through:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Providing comprehensive transaction history for tax reporting</li>
                  <li>Issuing tax documentation as required by jurisdiction</li>
                  <li>Reporting to tax authorities where legally mandated</li>
                  <li>FATCA and CRS compliance for international tax reporting</li>
                </ul>
                
                <p><strong>User Responsibility:</strong> Users remain responsible for understanding and fulfilling their tax obligations in their jurisdiction.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Cybersecurity Standards</h2>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div className="space-y-3 text-slate-700 dark:text-slate-300">
                    <p><strong>Security Framework:</strong> Implementation of industry-leading security standards:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>SOC 2 Type II compliance for service organization controls</li>
                      <li>Regular penetration testing by independent security firms</li>
                      <li>Bug bounty program for responsible disclosure of vulnerabilities</li>
                      <li>24/7 security operations center (SOC) monitoring</li>
                      <li>Incident response plan and disaster recovery procedures</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Consumer Protection</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Fair Treatment:</strong> BitVault Pro is committed to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Transparent fee structures and clear communication</li>
                  <li>Fair and consistent application of terms and policies</li>
                  <li>Accessible complaint resolution procedures</li>
                  <li>Comprehensive risk disclosures for all investment products</li>
                  <li>Segregation of client funds from operational funds</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">10. Third-Party Audits</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Independent Verification:</strong> Regular audits by external firms verify:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Compliance with regulatory requirements</li>
                  <li>Accuracy of financial statements and reserve holdings</li>
                  <li>Effectiveness of internal controls and risk management</li>
                  <li>Security of technical infrastructure and data protection</li>
                </ul>
                
                <p><strong>Proof of Reserves:</strong> Periodic verification of cryptocurrency holdings to ensure platform solvency.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">11. Regulatory Cooperation</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Authority Relations:</strong> BitVault Pro maintains cooperative relationships with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Financial regulatory authorities and supervisory bodies</li>
                  <li>Law enforcement agencies investigating financial crimes</li>
                  <li>Tax authorities requiring transaction information</li>
                  <li>International regulatory cooperation frameworks</li>
                </ul>
                
                <p><strong>Legal Requests:</strong> We respond promptly to valid legal requests and court orders while protecting user privacy to the maximum extent permitted by law.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">12. Ongoing Compliance</h2>
              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <p><strong>Continuous Improvement:</strong> Our compliance program includes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Regular review and updates of policies and procedures</li>
                  <li>Staff training on compliance requirements and best practices</li>
                  <li>Monitoring of regulatory changes and industry developments</li>
                  <li>Implementation of enhanced controls as risks evolve</li>
                </ul>
                
                <p><strong>Compliance Officer:</strong> A dedicated compliance team led by a Chief Compliance Officer oversees all regulatory matters and ensures adherence to legal requirements.</p>
              </div>
            </section>

            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6 mt-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-200 mb-2">
                    Compliance Contact
                  </h3>
                  <p className="text-green-800 dark:text-green-300">
                    For compliance-related inquiries, regulatory questions, or to report suspicious activity, please contact our Compliance Department through the platform's support system or Telegram community.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/invest">
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
