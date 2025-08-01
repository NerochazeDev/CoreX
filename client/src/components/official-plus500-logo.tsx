import { cn } from "@/lib/utils";

interface OfficialPlus500LogoProps {
  className?: string;
  showVIP?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "white";
}

export function OfficialPlus500Logo({ 
  className, 
  showVIP = true, 
  size = "md", 
  variant = "light" 
}: OfficialPlus500LogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12", 
    xl: "h-16"
  };

  const colorClass = variant === 'white' ? 'brightness-0 invert' : '';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Official Plus500 Logo SVG */}
      <svg 
        className={cn(sizeClasses[size], colorClass)} 
        viewBox="0 0 169 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Plus500 Official Logo - Based on authentic brand */}
        <g>
          {/* Plus text */}
          <path
            d="M0 8h8v6h8v8h-8v6h8v8H8v-6H0v-8h8v-6H0V8z"
            fill="currentColor"
            className="text-plus500"
          />
          
          {/* Plus symbol in square */}
          <rect
            x="20"
            y="8"
            width="24"
            height="24"
            rx="2"
            fill="currentColor"
            className="text-plus500"
          />
          <path
            d="M30 14h4v4h4v4h-4v4h-4v-4h-4v-4h4v-4z"
            fill="white"
          />
          
          {/* 500 text */}
          <path
            d="M50 16h12v4h-8v4h6v4h-6v4h8v4H50V16z M70 16h4v20h-4V16z M80 16h12v4h-8v4h6v4h-6v4h8v4H80V16z M102 16h12v4h-8v4h6v4h-6v4h8v4h-12V16z M122 16h12v4h-8v4h6v4h-6v4h8v4h-12V16z"
            fill="currentColor"
            className="text-plus500"
          />
        </g>
      </svg>
      
      {showVIP && (
        <span className="text-vip-gold font-bold px-3 py-1 rounded-full text-sm bg-plus500-gold/10 border border-plus500-gold/20">
          VIP
        </span>
      )}
    </div>
  );
}

export function SimplePlus500Logo({ className, variant = "light" }: { className?: string; variant?: "light" | "dark" | "white" }) {
  const colorClass = variant === 'white' ? 'text-white' : 'text-plus500';
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className={cn("font-bold tracking-tight text-2xl", colorClass)}>Plus</span>
      <div className={cn("w-8 h-8 rounded-sm flex items-center justify-center", 
        variant === 'white' ? 'bg-white' : 'bg-plus500'
      )}>
        <span className={cn("font-bold text-xl leading-none", 
          variant === 'white' ? 'text-plus500' : 'text-white'
        )}>+</span>
      </div>
      <span className={cn("font-bold tracking-tight text-2xl", colorClass)}>500</span>
    </div>
  );
}