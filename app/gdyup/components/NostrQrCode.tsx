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
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrType, setQrType] = useState<'standard' | 'nostr'>(initialQrType || 'standard');
  
  // Fetch QR code from server API
  useEffect(() => {
    const fetchQrCode = async () => {
      setIsLoading(true);
      
      try {
        // Generate QR data
        const qrData = JSON.stringify({
          type: 'gdyup-boarding',
          flightId: flightData.id,
          flightNumber: flightData.flightNumber,
          departure: flightData.departureLocation,
          arrival: flightData.arrivalLocation,
          time: flightData.departureTime,
          seat: flightData.seat || 'N/A',
          pubkey: qrType === 'nostr' && isConnected ? pubkey : undefined
        });
        
        // Fetch QR code from the API
        const response = await fetch(`/api/jetshare/qrcode?data=${encodeURIComponent(qrData)}&type=${qrType}&background=white`);
        
        if (!response.ok) {
          throw new Error('Failed to generate QR code');
        }
        
        // Get the image blob and create a URL for it
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setQrImageUrl(imageUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast.error('Failed to generate QR code');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQrCode();
    
    // Clean up the object URL when unmounting or when qrType changes
    return () => {
      if (qrImageUrl) {
        URL.revokeObjectURL(qrImageUrl);
      }
    };
  }, [flightData, qrType, isConnected, pubkey]);
  
  // Download QR code as image
  const downloadQrCode = () => {
    try {
      if (!qrImageUrl) {
        throw new Error('QR code not available');
      }
      
      // Create download link
      const link = document.createElement('a');
      link.href = qrImageUrl;
      link.download = `gdyup-boarding-${flightData.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR code downloaded');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };
  
  // Copy QR code data to clipboard
  const copyQrData = () => {
    try {
      const qrData = JSON.stringify({
        type: qrType === 'nostr' ? 'gdyup-nostr-boarding' : 'gdyup-boarding',
        flightId: flightData.id,
        flightNumber: flightData.flightNumber,
        departure: flightData.departureLocation,
        arrival: flightData.arrivalLocation,
        time: flightData.departureTime,
        seat: flightData.seat || 'N/A',
        pubkey: qrType === 'nostr' && isConnected ? pubkey : undefined
      });
      
      navigator.clipboard.writeText(qrData);
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
            {qrImageUrl ? (
              <img 
                src={qrImageUrl} 
                alt="Boarding Pass QR Code" 
                className="w-[200px] h-[200px]"
              />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400">
                QR code not available
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center space-x-2 mt-4">
          <Switch
            id="qr-type"
            checked={qrType === 'nostr'}
            onCheckedChange={(checked) => setQrType(checked ? 'nostr' : 'standard')}
            disabled={!isConnected || !pubkey}
          />
          <Label htmlFor="qr-type" className={getThemeClasses({
            base: "",
            default: "text-gray-400",
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
          disabled={isLoading || !qrImageUrl}
          className={getThemeClasses({
            base: "",
            default: "border-gray-700 text-white",
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
            default: "border-gray-700 text-white",
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