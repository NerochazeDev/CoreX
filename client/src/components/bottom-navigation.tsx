import { Link, useLocation } from "wouter";
import { Home, TrendingUp, History, Settings, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Wallet" },
    { path: "/investment", icon: TrendingUp, label: "Invest" },
    { path: "/history", icon: History, label: "History" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  if (user?.isAdmin) {
    navItems.push({ path: "/admin", icon: Shield, label: "Admin" });
  }

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm">
      <div className="glass-card backdrop-blur-xl border-t border-border rounded-t-3xl mx-4 mb-4">
        <div className="flex justify-around py-4 px-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex flex-col items-center py-3 px-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                  isActive 
                    ? 'text-bitcoin bg-bitcoin bg-opacity-10 glow-bitcoin' 
                    : 'text-muted-foreground hover:text-bitcoin hover:bg-bitcoin hover:bg-opacity-5'
                }`}>
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
