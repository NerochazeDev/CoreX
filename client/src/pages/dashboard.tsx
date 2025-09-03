
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { AdvancedInvestmentDashboard } from "@/components/advanced-investment-dashboard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { BitVaultLogo } from "@/components/bitvault-logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Professional Header */}
      <header className="bg-gradient-to-r from-white/90 to-orange-50/90 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl border-b border-orange-200/50 dark:border-orange-800/50 sticky top-0 z-50 shadow-sm lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-orange-500/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="flex items-center gap-3">
                <BitVaultLogo variant="light" size="lg" showPro={true} />
                <div className="hidden sm:block border-l border-orange-200 dark:border-orange-800 pl-4">
                  <div className="flex items-center gap-1">
                    <Crown className="w-3 h-3 text-orange-500" />
                    <span className="text-xs text-muted-foreground">Investment Dashboard</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate max-w-48">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:ml-64 pb-20 lg:pb-6">
        <AdvancedInvestmentDashboard />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
