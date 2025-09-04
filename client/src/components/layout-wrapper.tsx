import { useSidebar } from "@/contexts/sidebar-context";

interface LayoutWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div 
      className={`transition-all duration-300 ${className} ${
        isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}
    >
      {children}
    </div>
  );
}