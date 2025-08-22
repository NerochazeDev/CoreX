import { Link, useLocation } from "wouter";
import { Home, TrendingUp, History, Settings, Shield, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Wallet" },
    { path: "/deposit", icon: Plus, label: "Deposit" },
    { path: "/investment", icon: TrendingUp, label: "Invest" },
    { path: "/history", icon: History, label: "History" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  if (user?.isAdmin) {
    navItems.push({ path: "/admin", icon: Shield, label: "Admin" });
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-orange-200/50 dark:border-orange-800/50 mx-4 mb-4 rounded-2xl shadow-xl">
          <div className="flex justify-around py-3 px-2">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <Link key={item.path} href={item.path}>
                  <div className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg transform scale-105' 
                      : 'text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }`}>
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-full w-64 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-r border-orange-200/50 dark:border-orange-800/50 shadow-xl">
        <div className="flex flex-col w-full p-6">
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-2">Navigation</h2>
            <p className="text-sm text-muted-foreground">Access all platform features</p>
          </div>
          
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <Link key={item.path} href={item.path}>
                  <div className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg' 
                      : 'text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
