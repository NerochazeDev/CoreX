import { useSidebar } from "@/contexts/sidebar-context";

interface LayoutWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
  const { isCollapsed } = useSidebar();
  
  // Use style instead of dynamic class names for reliable transitions
  const leftPadding = isCollapsed ? '4rem' : '16rem'; // 16 = 4rem, 64 = 16rem
  
  return (
    <div 
      className={`transition-all duration-300 ${className}`}
      style={{ paddingLeft: `max(0px, ${leftPadding})` }}
    >
      {children}
    </div>
  );
}