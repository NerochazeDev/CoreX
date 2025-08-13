import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Camera, FileImage, Monitor } from "lucide-react";
import { BitVaultBrand } from "@/components/bitvault-logo";
import { BitVaultVIPBrand } from "@/components/plus500-logo";
import { cn } from "@/lib/utils";
import html2canvas from 'html2canvas';

interface BannerShowcaseProps {
  className?: string;
}

export function BannerShowcase({ className }: BannerShowcaseProps) {
  const [selectedBanner, setSelectedBanner] = useState<"bitvault" | "vip">("bitvault");
  const [variant, setVariant] = useState<"light" | "dark">("light");
  const [isCapturing, setIsCapturing] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const banners = {
    bitvault: {
      name: "BitVault Pro Banner",
      component: BitVaultBrand,
      description: "Professional Bitcoin Investment Platform"
    },
    vip: {
      name: "BitVault VIP Banner", 
      component: BitVaultVIPBrand,
      description: "VIP Edition Premium Banner"
    }
  };

  const downloadBanner = async (format: 'png' | 'jpg' | 'svg') => {
    if (!bannerRef.current) return;
    
    setIsCapturing(true);
    
    try {
      if (format === 'svg') {
        // For SVG, we'll create a simple SVG representation
        downloadAsSVG();
      } else {
        // Use html2canvas for PNG/JPG
        const canvas = await html2canvas(bannerRef.current, {
          backgroundColor: variant === 'dark' ? '#0f172a' : '#ffffff',
          scale: 2, // Higher resolution
          useCORS: true,
          allowTaint: true,
          width: bannerRef.current.offsetWidth,
          height: bannerRef.current.offsetHeight,
        });

        const link = document.createElement('a');
        link.download = `bitvault-${selectedBanner}-banner-${variant}.${format}`;
        link.href = canvas.toDataURL(`image/${format}`, 0.9);
        link.click();
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const downloadAsSVG = () => {
    // Create a simple SVG representation
    const svgContent = `
      <svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bitcoinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="${variant === 'dark' ? '#0f172a' : '#ffffff'}"/>
        <g transform="translate(400, 200)">
          <!-- Bitcoin Symbol -->
          <circle cx="-200" cy="-50" r="30" fill="url(#bitcoinGradient)"/>
          <text x="-200" y="-40" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="white">₿</text>
          
          <!-- BitVault Text -->
          <text x="-100" y="-40" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${variant === 'dark' ? 'white' : '#1f2937'}">BitVault</text>
          
          <!-- PRO Badge -->
          <rect x="50" y="-65" width="80" height="30" rx="15" fill="#f97316" fill-opacity="0.1" stroke="#f97316" stroke-width="2"/>
          <text x="90" y="-45" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#f97316">PRO</text>
          
          <!-- Tagline -->
          <text x="0" y="20" font-family="Arial, sans-serif" font-size="18" font-weight="600" text-anchor="middle" fill="${variant === 'dark' ? 'white' : '#1f2937'}">Professional Bitcoin</text>
          <text x="0" y="45" font-family="Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle" fill="url(#bitcoinGradient)">Investment Platform</text>
          <text x="0" y="70" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#f97316">PRO EDITION</text>
          
          <!-- Footer -->
          <text x="0" y="110" font-family="Arial, sans-serif" font-size="14" font-weight="500" text-anchor="middle" fill="${variant === 'dark' ? '#94a3b8' : '#64748b'}">Secure • Professional • Exclusive</text>
        </g>
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `bitvault-${selectedBanner}-banner-${variant}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const CurrentBanner = banners[selectedBanner].component;

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="bitvault-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Monitor className="w-5 h-5" />
            Banner Showcase & Download
          </CardTitle>
          <p className="text-muted-foreground">
            Preview and download the exact banners displayed in your showcase
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banner Selection */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(banners).map(([key, banner]) => (
              <Button
                key={key}
                variant={selectedBanner === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBanner(key as any)}
                data-testid={`select-${key}`}
              >
                {banner.name}
              </Button>
            ))}
          </div>

          {/* Variant Selection */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Theme:</span>
            <div className="flex gap-2">
              {["light", "dark"].map((v) => (
                <Button
                  key={v}
                  variant={variant === v ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVariant(v as any)}
                  className="capitalize"
                  data-testid={`variant-${v}`}
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>

          {/* Banner Preview */}
          <Card className="border-dashed">
            <CardContent className="p-8">
              <div 
                ref={bannerRef}
                className={cn(
                  "flex items-center justify-center min-h-[200px] rounded-lg transition-colors",
                  variant === "dark" ? "bg-slate-900" : "bg-white",
                  isCapturing && "border-2 border-orange-500 border-dashed"
                )}
              >
                <CurrentBanner className="scale-90" />
              </div>
            </CardContent>
          </Card>

          {/* Download Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => downloadBanner('png')}
              disabled={isCapturing}
              className="h-auto py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              data-testid="download-png"
            >
              <div className="text-center text-white">
                <Download className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-bold">Download PNG</div>
                <div className="text-xs opacity-90">High Quality Image</div>
              </div>
            </Button>
            
            <Button
              onClick={() => downloadBanner('jpg')}
              disabled={isCapturing}
              variant="outline"
              className="h-auto py-3"
              data-testid="download-jpg"
            >
              <div className="text-center">
                <FileImage className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Download JPG</div>
                <div className="text-xs text-muted-foreground">Compressed Format</div>
              </div>
            </Button>
            
            <Button
              onClick={() => downloadBanner('svg')}
              disabled={isCapturing}
              variant="outline"
              className="h-auto py-3"
              data-testid="download-svg"
            >
              <div className="text-center">
                <Camera className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Download SVG</div>
                <div className="text-xs text-muted-foreground">Vector Format</div>
              </div>
            </Button>
          </div>

          {isCapturing && (
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Capturing banner for download...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}