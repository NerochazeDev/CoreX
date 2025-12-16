import { cn } from "@/lib/utils";

interface VaultIconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "white";
  animated?: boolean;
}

export function VaultIcon({ 
  className, 
  size = "md", 
  variant = "light",
  animated = false
}: VaultIconProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };

  const strokeWidth = {
    sm: "1.5",
    md: "2",
    lg: "2.5",
    xl: "3"
  };

  const viewBox = "0 0 64 64";

  return (
    <div className={cn(sizeMap[size], "relative", className)}>
      <svg 
        viewBox={viewBox} 
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="vaultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <linearGradient id="vaultGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Vault Body */}
        <rect 
          x="8" 
          y="12" 
          width="48" 
          height="40" 
          rx="4" 
          ry="4"
          fill={variant === 'white' ? 'white' : 'url(#vaultGradient)'}
          stroke={variant === 'dark' ? '#ea580c' : variant === 'white' ? '#f97316' : '#fb923c'}
          strokeWidth={strokeWidth[size]}
        />

        {/* Vault Door */}
        <rect 
          x="12" 
          y="16" 
          width="40" 
          height="32" 
          rx="2" 
          ry="2"
          fill={variant === 'white' ? '#fff9f5' : variant === 'dark' ? '#7c2d12' : '#fed7aa'}
          stroke={variant === 'dark' ? '#dc2626' : '#ea580c'}
          strokeWidth={strokeWidth[size]}
        />

        {/* Door Shine/Reflection */}
        <rect 
          x="15" 
          y="19" 
          width="8" 
          height="26" 
          rx="1" 
          ry="1"
          fill={variant === 'white' ? '#f97316' : 'white'}
          opacity="0.15"
        />

        {/* Main Combination Lock Circle */}
        <circle 
          cx="32" 
          cy="32" 
          r="11"
          fill={variant === 'white' ? 'white' : variant === 'dark' ? '#1f2937' : '#fef3c7'}
          stroke={variant === 'dark' ? '#ea580c' : '#f97316'}
          strokeWidth={strokeWidth[size]}
        />

        {/* Lock Inner Ring */}
        <circle 
          cx="32" 
          cy="32" 
          r="8"
          fill="none"
          stroke={variant === 'dark' ? '#ea580c' : '#f97316'}
          strokeWidth={strokeWidth[size] === "1.5" ? "1" : strokeWidth[size] === "2" ? "1.2" : strokeWidth[size] === "2.5" ? "1.5" : "2"}
        />

        {/* Dial Indicator Lines - Bitcoin themed */}
        <line x1="32" y1="22" x2="32" y2="20" stroke={variant === 'dark' ? '#ea580c' : '#f97316'} strokeWidth={strokeWidth[size]} strokeLinecap="round" />
        <line x1="42" y1="32" x2="44" y2="32" stroke={variant === 'dark' ? '#ea580c' : '#f97316'} strokeWidth={strokeWidth[size]} strokeLinecap="round" />
        <line x1="32" y1="42" x2="32" y2="44" stroke={variant === 'dark' ? '#ea580c' : '#f97316'} strokeWidth={strokeWidth[size]} strokeLinecap="round" />
        <line x1="22" y1="32" x2="20" y2="32" stroke={variant === 'dark' ? '#ea580c' : '#f97316'} strokeWidth={strokeWidth[size]} strokeLinecap="round" />

        {/* Center Bitcoin Symbol */}
        <text 
          x="32" 
          y="38" 
          textAnchor="middle" 
          fontSize={size === 'sm' ? '16' : size === 'md' ? '20' : size === 'lg' ? '24' : '28'}
          fontWeight="bold"
          fill={variant === 'dark' ? '#ea580c' : '#f97316'}
          fontFamily="Arial, sans-serif"
        >
          ₿
        </text>

        {/* Rotating Animation Indicator (subtle arc) */}
        {animated && (
          <g opacity="0.6">
            <path
              d="M 32 22 A 10 10 0 0 1 40 24"
              fill="none"
              stroke={variant === 'dark' ? '#dc2626' : '#fbbf24'}
              strokeWidth={strokeWidth[size]}
              strokeLinecap="round"
              className="animate-spin"
              style={{ transformOrigin: '32px 32px' }}
            />
          </g>
        )}

        {/* Security Badges (top corners) */}
        <circle cx="14" cy="14" r="2.5" fill={variant === 'dark' ? '#10b981' : '#34d399'} opacity="0.8" />
        <circle cx="50" cy="14" r="2.5" fill={variant === 'dark' ? '#10b981' : '#34d399'} opacity="0.8" />
      </svg>
    </div>
  );
}

export function VaultIconLogo({ 
  className, 
  size = "md",
  variant = "light",
  showText = true,
  animated = false 
}: VaultIconProps & { showText?: boolean }) {
  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl"
  };

  const textColor = variant === 'white' ? 'text-white' : variant === 'dark' ? 'text-orange-500' : 'text-primary';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <VaultIcon size={size} variant={variant} animated={animated} />
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold tracking-tight", textSize[size], textColor)}>
            BitVault
          </span>
          {size !== 'sm' && (
            <span className="text-orange-500 font-bold text-xs px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              SECURE
            </span>
          )}
        </div>
      )}
    </div>
  );
}
