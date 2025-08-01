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
  const containerSize = {
    sm: "px-5 py-3 text-sm min-w-[100px]",
    md: "px-6 py-3.5 text-base min-w-[120px]",
    lg: "px-7 py-4 text-lg min-w-[140px]", 
    xl: "px-9 py-5 text-xl min-w-[160px]"
  };

  const plusSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };

  // Authentic Plus500 colors - Royal Blue #003399
  const bgColor = variant === 'white' ? 'bg-white' : 'bg-[#003399]';
  const textColor = variant === 'white' ? 'text-[#003399]' : 'text-white';
  const borderColor = variant === 'white' ? 'border-[#003399] border-2' : 'border-transparent';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Authentic Plus500 Logo - Exact replica of official design */}
      <div className={cn(
        "relative rounded-xl font-black tracking-wider leading-none text-center",
        containerSize[size],
        bgColor,
        textColor,
        borderColor
      )}
      style={{ 
        fontFamily: '"Orbitron", "Eurostile", "Bank Gothic", "Microgramma", monospace, sans-serif',
        letterSpacing: '0.1em',
        fontWeight: '900',
        borderRadius: '12px', // Enhanced curved corners
        textRendering: 'optimizeLegibility'
      }}>
        {/* Plus500 text with positioned + symbol - Extra bold Orbitron */}
        <div className="font-black relative z-10" style={{ 
          fontFamily: '"Orbitron", monospace',
          fontWeight: '900',
          textShadow: '0 0 2px currentColor, 0 0 4px currentColor',
          WebkitTextStroke: '0.5px currentColor'
        }}>
          <span className="relative" style={{ fontVariantNumeric: 'lining-nums' }}>
            Plu<span className="relative">
              s<span className={cn(
                "absolute font-black",
                plusSize[size]
              )}
              style={{
                top: '-0.8em',
                left: '50%',
                transform: 'translateX(-50%)',
                lineHeight: '1',
                fontFamily: '"Orbitron", monospace',
                fontWeight: '900',
                textShadow: '0 0 2px currentColor, 0 0 4px currentColor',
                WebkitTextStroke: '0.5px currentColor'
              }}>+</span>
            </span>5<span style={{ fontVariantNumeric: 'lining-nums' }}>00</span>
          </span>
        </div>
      </div>
      
      {showVIP && (
        <span className="text-plus500-gold font-bold px-3 py-1 rounded-full text-sm bg-plus500-gold/10 border border-plus500-gold/20">
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