import { Link, useLocation } from "wouter";
import { Home, TrendingUp, History, Settings, Shield, Plus, BarChart3, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const navItems = [
    { path: "/home", icon: Home, label: "Wallet" },
    { path: "/dashboard", icon: BarChart3, label: "Dashboard" },
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
      <nav className={`hidden lg:flex fixed left-0 top-0 h-full z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-r border-orange-200/50 dark:border-orange-800/50 shadow-xl transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex flex-col w-full p-4">
          {/* Header with toggle button */}
          <div className={`mb-6 ${isCollapsed ? 'items-center' : ''}`}>
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-1">Navigation</h2>
                  <p className="text-xs text-muted-foreground">BitVault Pro</p>
                </div>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="h-8 w-8 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/20"
                    data-testid="button-toggle-sidebar"
                  >
                    {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          {/* Navigation Items */}
          <div className="space-y-2 flex-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <Tooltip key={item.path} delayDuration={isCollapsed ? 300 : 0}>
                  <TooltipTrigger asChild>
                    <Link href={item.path}>
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} py-3 px-3 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg' 
                          : 'text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                      }`} data-testid={`nav-${item.path === '/' ? 'home' : item.path.slice(1)}`}>
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium">{item.label}</span>}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
