import { cn } from "@/lib/utils";

interface ShieldVaultIconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "white";
  animated?: boolean;
}

export function ShieldVaultIcon({ 
  className, 
  size = "md", 
  variant = "light",
  animated = false
}: ShieldVaultIconProps) {
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

  const viewBox = "0 0 64 80";

  return (
    <div className={cn(sizeMap[size], "relative", className)}>
      <svg 
        viewBox={viewBox} 
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <filter id="shadowFilter">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Outer Shield Border */}
        <path 
          d="M 32 4 L 54 16 L 54 35 C 54 55 32 74 32 74 C 32 74 10 55 10 35 L 10 16 Z" 
          fill={variant === 'white' ? 'white' : 'url(#shieldGradient)'}
          stroke={variant === 'dark' ? '#ea580c' : variant === 'white' ? '#f97316' : '#fb923c'}
          strokeWidth={strokeWidth[size]}
          filter="url(#shadowFilter)"
        />

        {/* Inner Shield Bezel */}
        <path 
          d="M 32 8 L 50 18 L 50 35 C 50 51 32 66 32 66 C 32 66 14 51 14 35 L 14 18 Z" 
          fill="rgba(0,0,0,0.1)"
          stroke="white"
          strokeWidth="1"
          opacity="0.2"
        />

        {/* Bitcoin Icon - Prominent and stylized */}
        <g transform="translate(32, 38)">
          <circle r="18" fill="white" opacity="0.15" />
          <text 
            textAnchor="middle" 
            dominantBaseline="central"
            fontSize={size === 'sm' ? '32' : size === 'md' ? '40' : size === 'lg' ? '48' : '56'}
            fontWeight="bold"
            fill={variant === 'white' ? '#f97316' : 'white'}
            fontFamily="system-ui, sans-serif"
          >
            ₿
          </text>
        </g>

        {/* Corner Security Accent */}
        <path 
          d="M 46 12 L 54 16 L 54 24" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          opacity="0.5"
        />
      </svg>
    </div>
  );
}

export function ShieldVaultLogo({ 
  className, 
  size = "md",
  variant = "light",
  showText = true,
  animated = false 
}: ShieldVaultIconProps & { showText?: boolean }) {
  const textSize = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl"
  };

  const textColor = variant === 'white' ? 'text-white' : variant === 'dark' ? 'text-orange-500' : 'text-primary';

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <ShieldVaultIcon size={size} variant={variant} animated={animated} />
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-1">
            <span className={cn("font-black tracking-tighter", textSize[size], textColor)}>
              BITVAULT
            </span>
            <span className={cn("font-light tracking-widest text-orange-500", size === 'sm' ? 'text-xs' : 'text-sm')}>
              PRO
            </span>
          </div>
          <div className="h-0.5 w-full bg-gradient-to-r from-orange-500 to-transparent mt-1 opacity-50" />
        </div>
      )}
    </div>
  );
}

export function TelegramProfileA({ className }: { className?: string }) {
  return (
    <div className={cn("w-64 h-64 rounded-full bg-gradient-to-br from-slate-900 via-orange-950 to-black p-1 flex items-center justify-center shadow-2xl overflow-hidden border-4 border-orange-500/30", className)}>
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent opacity-50" />
        <ShieldVaultIcon size="xl" className="mb-2 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <div className="flex flex-col items-center leading-none">
          <span className="text-white font-black text-xl tracking-tighter">BITVAULT</span>
          <span className="text-orange-500 font-light text-sm tracking-[0.3em] mt-1">PRO</span>
        </div>
      </div>
    </div>
  );
}

export function TelegramProfileB({ className }: { className?: string }) {
  return (
    <div className={cn("w-64 h-64 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 p-8 flex items-center justify-center shadow-2xl overflow-hidden", className)}>
      <div className="relative w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center border-4 border-white/10">
        <div className="absolute inset-0 bg-orange-500/5" />
        <span className="text-6xl font-black text-white drop-shadow-lg">₿</span>
        <div className="bg-orange-500 text-black px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest mt-2">
          PRO
        </div>
      </div>
    </div>
  );
}

export async function downloadShieldVaultIconPNG(size: number = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size * 1.25;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 64 80');
  svg.setAttribute('width', canvas.width.toString());
  svg.setAttribute('height', canvas.height.toString());

  const svgContent = `
    <svg viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f97316" />
          <stop offset="100%" stop-color="#fb923c" />
        </linearGradient>
      </defs>
      <path d="M 32 4 L 54 16 L 54 35 C 54 55 32 74 32 74 C 32 74 10 55 10 35 L 10 16 Z" fill="url(#g)" stroke="#fb923c" stroke-width="2" />
      <text x="32" y="48" text-anchor="middle" font-size="40" font-weight="bold" fill="white" font-family="Arial">₿</text>
    </svg>
  `;

  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const link = document.createElement('a');
    link.download = `BitVault-PRO-Logo-${size}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  img.src = `data:image/svg+xml;base64,${btoa(svgContent)}`;
}
