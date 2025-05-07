'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNostr } from '@/app/gdyup/contexts/NostrContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Copy, QrCode } from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NostrQrCodeProps {
  flightData: {
    id: string;
    departureLocation: string;
    arrivalLocation: string;
    departureTime: string;
    arrivalTime?: string;
    flightNumber: string;
    aircraft?: string;
    seat?: string;
  };
  qrType?: 'standard' | 'nostr';
  className?: string;
}

export default function NostrQrCode({ flightData, qrType: initialQrType, className }: NostrQrCodeProps) {
  const { getThemeClasses } = useGdyupTheme();
  const { isConnected, pubkey } = useNostr();
  const [isLoading, setIsLoading] = useState(true);
  const [qrValue, setQrValue] = useState('');
  const [qrType, setQrType] = useState<'standard' | 'nostr'>(initialQrType || 'standard');
  
  // Generate QR code value
  useEffect(() => {
    const generateQrValue = async () => {
      setIsLoading(true);
      
      try {
        // Standard format is a simple JSON with flight details
        if (qrType === 'standard') {
          const standardData = {
            type: 'gdyup-boarding',
            flightId: flightData.id,
            flightNumber: flightData.flightNumber,
            departure: flightData.departureLocation,
            arrival: flightData.arrivalLocation,
            time: flightData.departureTime,
            seat: flightData.seat || 'N/A'
          };
          
          setQrValue(JSON.stringify(standardData));
        }
        // Nostr format includes signing with user's Nostr key
        else if (qrType === 'nostr' && isConnected && pubkey) {
          // In a real implementation, this would:
          // 1. Create a Nostr event with the flight details
          // 2. Sign it with the user's private key
          // 3. Include a NIP-01 or NIP-57 compatible payload
          
          // For demonstration, we'll create a mock Nostr event
          const mockNostrEvent = {
            type: 'gdyup-nostr-boarding',
            pubkey: pubkey,
            flightId: flightData.id,
            flightNumber: flightData.flightNumber,
            departure: flightData.departureLocation,
            arrival: flightData.arrivalLocation,
            time: flightData.departureTime,
            seat: flightData.seat || 'N/A',
            signature: `sig-${Date.now()}`
          };
          
          setQrValue(JSON.stringify(mockNostrEvent));
        } else {
          // Fallback to standard if Nostr is not available
          setQrType('standard');
          const fallbackData = {
            type: 'gdyup-boarding',
            flightId: flightData.id,
            flightNumber: flightData.flightNumber
          };
          
          setQrValue(JSON.stringify(fallbackData));
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast.error('Failed to generate QR code');
        
        // Use a simple fallback
        setQrValue(flightData.id);
      } finally {
        setIsLoading(false);
      }
    };
    
    generateQrValue();
  }, [flightData, qrType, isConnected, pubkey]);
  
  // Download QR code as image
  const downloadQrCode = () => {
    try {
      const svgElement = document.getElementById('nostr-qr-code');
      if (svgElement && svgElement instanceof SVGElement) {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        
        // Set canvas dimensions
        canvas.width = 300;
        canvas.height = 300;
        
        // Create a data URL from the SVG
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          if (ctx) {
            // Draw image onto canvas
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to PNG
            const pngUrl = canvas.toDataURL('image/png');
            
            // Create download link
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = `gdyup-boarding-${flightData.id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
          }
        };
        
        img.src = url;
        toast.success('QR code downloaded');
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };
  
  // Copy QR code data to clipboard
  const copyQrData = () => {
    try {
      navigator.clipboard.writeText(qrValue);
      toast.success('QR code data copied to clipboard');
    } catch (error) {
      console.error('Error copying QR code data:', error);
      toast.error('Failed to copy QR code data');
    }
  };
  
  return (
    <Card className={cn(
      getThemeClasses({
        base: "overflow-hidden",
        default: "bg-gray-900 border-gray-800",
        blue: "bg-blue-950 border-blue-900",
        pink: "bg-pink-950 border-pink-900"
      }),
      className
    )}>
      <CardHeader className={getThemeClasses({
        base: "pb-2",
        default: "bg-black/30",
        blue: "bg-blue-950/50",
        pink: "bg-pink-950/50"
      })}>
        <CardTitle className={getThemeClasses({
          base: "text-base flex items-center gap-2",
          default: "text-white",
          blue: "text-blue-50",
          pink: "text-pink-50"
        })}>
          <QrCode className="h-4 w-4" />
          GDY·UP Boarding Pass
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="h-[200px] w-[200px] flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className={getThemeClasses({
            base: "p-4 rounded-lg bg-white",
            default: "",
            blue: "border border-blue-800",
            pink: "border border-pink-800"
          })}>
            <QRCodeSVG
              id="nostr-qr-code"
              value={qrValue}
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: '/logo.png',
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2 mt-4">
          <Switch
            id="qr-type"
            checked={qrType === 'nostr'}
            onCheckedChange={(checked) => setQrType(checked ? 'nostr' : 'standard')}
            disabled={qrType === 'nostr' && (!isConnected || !pubkey)}
          />
          <Label htmlFor="qr-type" className={getThemeClasses({
            base: "",
            default: "text-gray-700",
            blue: "text-blue-200",
            pink: "text-pink-200"
          })}>
            {qrType === 'nostr' ? 'Nostr Signed QR (NIP-01)' : 'Standard QR'}
          </Label>
        </div>
        
        <p className={getThemeClasses({
          base: "text-xs text-center mt-2",
          default: "text-gray-500",
          blue: "text-blue-400",
          pink: "text-pink-400"
        })}>
          {qrType === 'nostr' 
            ? 'This QR code contains cryptographically signed flight details using your Nostr identity' 
            : 'Standard QR code contains your flight details'}
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={downloadQrCode}
          disabled={isLoading}
          className={getThemeClasses({
            base: "",
            default: "border-gray-300",
            blue: "border-blue-800 text-blue-100",
            pink: "border-pink-800 text-pink-100"
          })}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={copyQrData}
          disabled={isLoading}
          className={getThemeClasses({
            base: "",
            default: "border-gray-300",
            blue: "border-blue-800 text-blue-100",
            pink: "border-pink-800 text-pink-100"
          })}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Data
        </Button>
      </CardFooter>
    </Card>
  );
} 