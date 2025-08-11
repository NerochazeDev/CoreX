import { Link, useLocation } from "wouter";
import { Home, TrendingUp, History, Settings, Shield, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Wallet" },
    { path: "/investment", icon: TrendingUp, label: "Invest" },
    { path: "/history", icon: History, label: "History" },
    { path: "/support", icon: MessageCircle, label: "Support" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  if (user?.isAdmin) {
    navItems.push({ path: "/admin", icon: Shield, label: "Admin" });
  }

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm">
      <div className="plus500-professional rounded-t-3xl mx-4 mb-4 shadow-xl border-t-2 border-plus500">
        <div className="flex justify-around py-4 px-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex flex-col items-center py-3 px-4 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'text-white bg-plus500 shadow-md transform scale-105' 
                    : 'text-muted-foreground hover:text-plus500 hover:bg-plus500/5'
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
