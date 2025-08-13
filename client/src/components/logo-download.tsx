import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileImage, Palette, Monitor, Smartphone, FileText } from "lucide-react";
import { BitVaultLogo, BitVaultBrand, SimpleBitVaultLogo } from "@/components/bitvault-logo";
import { OfficialBitVaultLogo } from "@/components/official-plus500-logo";
import { BitVaultLogo as Plus500Logo, BitVaultVIPBrand } from "@/components/plus500-logo";
import { cn } from "@/lib/utils";

interface LogoVariant {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  description: string;
  category: "logo" | "brand" | "banner";
  formats: ("svg" | "png" | "pdf")[];
  variants: ("light" | "dark" | "white")[];
  sizes: ("sm" | "md" | "lg" | "xl")[];
}

const logoVariants: LogoVariant[] = [
  {
    id: "bitvault-logo",
    name: "BitVault Logo",
    component: BitVaultLogo,
    description: "Main BitVault logo with Bitcoin symbol",
    category: "logo",
    formats: ["svg", "png"],
    variants: ["light", "dark", "white"],
    sizes: ["sm", "md", "lg", "xl"]
  },
  {
    id: "bitvault-simple",
    name: "Simple BitVault Logo",
    component: SimpleBitVaultLogo,
    description: "Simplified version for small spaces",
    category: "logo",
    formats: ["svg", "png"],
    variants: ["light", "dark", "white"],
    sizes: ["sm", "md", "lg", "xl"]
  },
  {
    id: "bitvault-brand",
    name: "BitVault Brand Banner",
    component: BitVaultBrand,
    description: "Full brand banner with taglines",
    category: "banner",
    formats: ["svg", "png", "pdf"],
    variants: ["light", "dark"],
    sizes: ["lg", "xl"]
  },
  {
    id: "official-bitvault",
    name: "Official BitVault Logo",
    component: OfficialBitVaultLogo,
    description: "Official styled logo with royal design",
    category: "logo",
    formats: ["svg", "png"],
    variants: ["light", "white"],
    sizes: ["sm", "md", "lg", "xl"]
  },
  {
    id: "plus500-logo",
    name: "Plus500 Style Logo",
    component: Plus500Logo,
    description: "Alternative Plus500 styled design",
    category: "logo",
    formats: ["svg", "png"],
    variants: ["light", "dark", "white"],
    sizes: ["sm", "md", "lg", "xl"]
  },
  {
    id: "vip-brand",
    name: "VIP Brand Banner",
    component: BitVaultVIPBrand,
    description: "VIP edition brand banner",
    category: "banner",
    formats: ["svg", "png", "pdf"],
    variants: ["light", "dark"],
    sizes: ["lg", "xl"]
  }
];

export function LogoDownloadManager() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "logo" | "brand" | "banner">("all");
  const [previewVariant, setPreviewVariant] = useState<"light" | "dark" | "white">("light");
  const [previewSize, setPreviewSize] = useState<"sm" | "md" | "lg" | "xl">("md");

  const filteredLogos = logoVariants.filter(logo => 
    selectedCategory === "all" || logo.category === selectedCategory
  );

  const downloadAsImage = async (logoId: string, format: string, variant: string, size: string) => {
    try {
      // Create a temporary canvas element
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size based on format
      const dimensions = {
        sm: { width: 200, height: 100 },
        md: { width: 400, height: 200 },
        lg: { width: 600, height: 300 },
        xl: { width: 800, height: 400 }
      };

      const { width, height } = dimensions[size as keyof typeof dimensions];
      canvas.width = width;
      canvas.height = height;

      // Set background color based on variant
      if (variant === "dark") {
        ctx.fillStyle = "#0f172a";
      } else if (variant === "light") {
        ctx.fillStyle = "#ffffff";
      } else {
        ctx.fillStyle = "transparent";
      }
      ctx.fillRect(0, 0, width, height);

      // Create SVG from component (simplified approach)
      const svgContent = await createSVGFromComponent(logoId, variant, size);
      
      // Convert SVG to image and draw on canvas
      const img = new Image();
      const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        
        // Download the image
        const downloadUrl = canvas.toDataURL(`image/${format}`);
        const link = document.createElement("a");
        link.download = `${logoId}-${variant}-${size}.${format}`;
        link.href = downloadUrl;
        link.click();
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const createSVGFromComponent = async (logoId: string, variant: string, size: string): Promise<string> => {
    // This is a simplified SVG generation - in a real implementation,
    // you'd want to use a library like react-to-svg or similar
    const logo = logoVariants.find(l => l.id === logoId);
    if (!logo) return "";

    const dimensions = {
      sm: { width: 200, height: 100 },
      md: { width: 400, height: 200 },
      lg: { width: 600, height: 300 },
      xl: { width: 800, height: 400 }
    };

    const { width, height } = dimensions[size as keyof typeof dimensions];

    // Create a basic SVG template
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bitcoinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="${variant === 'dark' ? '#0f172a' : variant === 'light' ? '#ffffff' : 'transparent'}"/>
        <g transform="translate(${width/2 - 100}, ${height/2 - 25})">
          <rect x="0" y="15" width="50" height="50" rx="8" fill="url(#bitcoinGradient)"/>
          <text x="25" y="47" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">₿</text>
          <text x="60" y="47" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="${variant === 'white' ? 'white' : '#1f2937'}">BitVault</text>
          <rect x="200" y="20" width="60" height="25" rx="12" fill="#f97316" fill-opacity="0.1" stroke="#f97316" stroke-opacity="0.2"/>
          <text x="230" y="35" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#f97316">PRO</text>
        </g>
      </svg>
    `;
  };

  return (
    <div className="space-y-6">
      <Card className="bitvault-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileImage className="w-5 h-5" />
            Logo & Banner Download Center
          </CardTitle>
          <p className="text-muted-foreground">
            Download BitVault Pro logos and banners in various formats and styles
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {["all", "logo", "brand", "banner"].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category as any)}
                className="capitalize"
                data-testid={`filter-${category}`}
              >
                {category === "all" ? "All Assets" : `${category}s`}
              </Button>
            ))}
          </div>

          {/* Preview Controls */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">Variant:</span>
              <div className="flex gap-1">
                {["light", "dark", "white"].map((variant) => (
                  <Button
                    key={variant}
                    variant={previewVariant === variant ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewVariant(variant as any)}
                    className="capitalize"
                    data-testid={`variant-${variant}`}
                  >
                    {variant}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span className="text-sm font-medium">Size:</span>
              <div className="flex gap-1">
                {["sm", "md", "lg", "xl"].map((size) => (
                  <Button
                    key={size}
                    variant={previewSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewSize(size as any)}
                    className="uppercase"
                    data-testid={`size-${size}`}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Logo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLogos.map((logo) => {
              const LogoComponent = logo.component;
              const supportsVariant = logo.variants.includes(previewVariant);
              const supportsSize = logo.sizes.includes(previewSize);
              
              return (
                <Card key={logo.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{logo.name}</CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs",
                          logo.category === "logo" && "bg-blue-500/10 text-blue-500",
                          logo.category === "brand" && "bg-green-500/10 text-green-500",
                          logo.category === "banner" && "bg-purple-500/10 text-purple-500"
                        )}
                      >
                        {logo.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{logo.description}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Preview */}
                    <div className={cn(
                      "p-4 rounded-lg border border-dashed border-border/50 flex items-center justify-center min-h-[120px]",
                      previewVariant === "dark" && "bg-slate-900",
                      previewVariant === "light" && "bg-white",
                      previewVariant === "white" && "bg-slate-800"
                    )}>
                      <LogoComponent
                        variant={supportsVariant ? previewVariant : "light"}
                        size={supportsSize ? previewSize : "md"}
                        className="scale-75"
                      />
                    </div>

                    {/* Supported Options */}
                    <div className="space-y-2 text-xs">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-muted-foreground">Variants:</span>
                        {logo.variants.map(variant => (
                          <Badge key={variant} variant="outline" className="text-xs px-1 py-0">
                            {variant}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-muted-foreground">Sizes:</span>
                        {logo.sizes.map(size => (
                          <Badge key={size} variant="outline" className="text-xs px-1 py-0 uppercase">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Download Buttons */}
                    <div className="space-y-2">
                      {logo.formats.map((format) => (
                        <Button
                          key={format}
                          variant="outline"
                          size="sm"
                          className="w-full justify-between"
                          onClick={() => downloadAsImage(logo.id, format, previewVariant, previewSize)}
                          data-testid={`download-${logo.id}-${format}`}
                        >
                          <span className="flex items-center gap-2">
                            <Download className="w-3 h-3" />
                            Download {format.toUpperCase()}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {previewVariant} • {previewSize.toUpperCase()}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bulk Download Section */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bulk Download
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-3"
                  data-testid="bulk-download-all-logos"
                >
                  <div className="text-center">
                    <Download className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">All Logos</div>
                    <div className="text-xs text-muted-foreground">PNG & SVG Bundle</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3"
                  data-testid="bulk-download-brand-kit"
                >
                  <div className="text-center">
                    <Smartphone className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Brand Kit</div>
                    <div className="text-xs text-muted-foreground">Complete Package</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}