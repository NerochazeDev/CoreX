import { cn } from "@/lib/utils";

interface OfficialBitVaultLogoProps {
  className?: string;
  showVIP?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "white";
}

export function OfficialBitVaultLogo({ 
  className, 
  showVIP = true, 
  size = "md", 
  variant = "light" 
}: OfficialBitVaultLogoProps) {
  const containerSize = {
    sm: "px-6 py-3 text-sm min-w-[140px]",
    md: "px-8 py-4 text-base min-w-[160px]",
    lg: "px-10 py-5 text-lg min-w-[190px]", 
    xl: "px-12 py-6 text-xl min-w-[230px]"
  };

  const plusSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };

  // Authentic BitVault colors - Royal Blue #003399
  const bgColor = variant === 'white' ? 'bg-white' : 'bg-[#003399]';
  const textColor = variant === 'white' ? 'text-[#003399]' : 'text-white';
  const borderColor = variant === 'white' ? 'border-[#003399] border-2' : 'border-transparent';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Authentic BitVault Logo - Exact replica of official design */}
      <div className={cn(
        "relative rounded-xl font-black tracking-wide leading-none text-center",
        containerSize[size],
        bgColor,
        textColor,
        borderColor
      )}
      style={{ 
        fontFamily: '"Orbitron", "Eurostile", "Bank Gothic", "Microgramma", monospace, sans-serif',
        letterSpacing: '0.12em',
        fontWeight: '900',
        borderRadius: '12px',
        textRendering: 'optimizeLegibility',
        minHeight: 'fit-content'
      } as React.CSSProperties}>
        {/* BitVault text with positioned + symbol - More spaced, same boldness */}
        <div className="font-black relative z-10" style={{ 
          fontFamily: '"Orbitron", monospace, sans-serif',
          fontWeight: '900',
          fontFeatureSettings: 'normal',
          WebkitTextStroke: '1px currentColor',
          filter: 'contrast(1.2) brightness(1.02)',
          letterSpacing: '0.08em',
          lineHeight: '1.2',
          wordSpacing: '0.05em'
        } as React.CSSProperties}>
          <span className="relative">
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
                fontFamily: '"Orbitron", monospace, sans-serif',
                fontWeight: '900',
                WebkitTextStroke: '1.5px currentColor',
                filter: 'contrast(1.3) brightness(1.05)'
              } as React.CSSProperties}>+</span>
            </span>500
          </span>
        </div>
      </div>
      
      {showVIP && (
        <span className="text-bitvault-gold font-bold px-3 py-1 rounded-full text-sm bg-bitvault-gold/10 border border-bitvault-gold/20">
          VIP
        </span>
      )}
    </div>
  );
}

export function SimpleBitVaultLogo({ className, variant = "light" }: { className?: string; variant?: "light" | "dark" | "white" }) {
  const colorClass = variant === 'white' ? 'text-white' : 'text-bitvault';
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className={cn("font-bold tracking-tight text-2xl", colorClass)}>Plus</span>
      <div className={cn("w-8 h-8 rounded-sm flex items-center justify-center", 
        variant === 'white' ? 'bg-white' : 'bg-bitvault'
      )}>
        <span className={cn("font-bold text-xl leading-none", 
          variant === 'white' ? 'text-bitvault' : 'text-white'
        )}>+</span>
      </div>
      <span className={cn("font-bold tracking-tight text-2xl", colorClass)}>500</span>
    </div>
  );
}