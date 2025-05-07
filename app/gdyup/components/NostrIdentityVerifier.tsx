'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, AlertCircle, ExternalLink } from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface NostrIdentityVerifierProps {
  onComplete?: () => void;
}

export default function NostrIdentityVerifier({ onComplete }: NostrIdentityVerifierProps) {
  const [nip05, setNip05] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'success' | 'error'>('none');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { getThemeClasses, getThemedButtonClasses, theme } = useGdyupTheme();
  const { profile, updateProfile } = useUserProfile();
  
  // Initialize with user's NIP-05 from profile if available
  useEffect(() => {
    if (profile?.nip05) {
      // If the NIP-05 is the default one, allow changing it
      if (profile.nip05 === 'dev@gdyup.xyz') {
        setNip05('');
        setVerificationStatus('none');
      } else {
        setNip05(profile.nip05);
        setVerificationStatus('success');
      }
    }
  }, [profile?.nip05]);
  
  // NIP-05 verification function
  const verifyNip05 = async () => {
    if (!nip05 || !nip05.includes('@')) {
      setErrorMessage('Please enter a valid NIP-05 address (e.g., name@domain.com)');
      setVerificationStatus('error');
      return;
    }
    
    setIsVerifying(true);
    setVerificationStatus('pending');
    
    try {
      // Extract name and domain from NIP-05
      const [name, domain] = nip05.split('@');
      
      // First, we'll manually fetch to verify the NIP-05 and get the pubkey
      const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`);
      
      if (!response.ok) {
        throw new Error(`Could not verify NIP-05 identity: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if the name exists in the response
      if (!data.names || !data.names[name]) {
        throw new Error(`NIP-05 identity "${name}" not found at ${domain}`);
      }
      
      // Get the hexadecimal public key
      const pubkey = data.names[name];
      
      if (!profile?.id) {
        throw new Error('User profile not found');
      }
      
      // Now use our API to update the user profile with the verified NIP-05
      const apiResponse = await fetch('/api/gdyup/profile/nostr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile.id,
          nostrData: {
            nostr_pubkey: pubkey,
            nip05: nip05, // Use the provided NIP-05 (e.g., Matt@primal.net)
            nostr_settings: {
              enabled: true,
              broadcast_offers: profile?.nostr_settings?.broadcast_offers ?? true,
              receive_messages: profile?.nostr_settings?.receive_messages ?? true,
              enable_zaps: profile?.nostr_settings?.enable_zaps ?? true,
              private_mode: profile?.nostr_settings?.private_mode ?? false,
              auto_connect: profile?.nostr_settings?.auto_connect ?? true
            }
          }
        }),
      });
      
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to save Nostr identity');
      }
      
      // Wait for the profile update to complete
      const result = await apiResponse.json();
      console.log('Updated Nostr identity:', result);
      
      // Refresh the user profile data
      window.location.reload(); // Force a reload to ensure all Nostr data is refreshed
      
      setVerificationStatus('success');
      toast.success('NIP-05 identity verified successfully!');
      
      // Call the onComplete callback if provided
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 1500); // Give the user time to see the success message
      }
    } catch (error) {
      console.error('Error verifying NIP-05:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to verify NIP-05 identity');
      setVerificationStatus('error');
      toast.error('NIP-05 verification failed');
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Reset verification state
  const resetVerification = () => {
    setNip05('');
    setVerificationStatus('none');
    setErrorMessage('');
  };
  
  return (
    <Card className={getThemeClasses({
      base: "border shadow",
      default: "bg-white border-gray-200",
      blue: "bg-blue-950/40 border-blue-900/60",
      pink: "bg-pink-950/40 border-pink-900/60"
    })}>
      <CardHeader className={getThemeClasses({
        base: "pb-3",
        default: "bg-gray-50 border-b border-gray-100",
        blue: "bg-blue-950/60 border-b border-blue-900/60",
        pink: "bg-pink-950/60 border-b border-pink-900/60"
      })}>
        <CardTitle className={getThemeClasses({
          base: "",
          default: "text-gray-900",
          blue: "text-blue-50",
          pink: "text-pink-50"
        })}>
          Nostr Identity Verification
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        <div className={getThemeClasses({
          base: "text-sm",
          default: "text-gray-600",
          blue: "text-blue-200",
          pink: "text-pink-200"
        })}>
          <p>Verify your Nostr identity to enable Nostr features in GDY·UP.</p>
          <p className="mt-1">Enter your NIP-05 identifier (e.g., name@domain.com).</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-grow">
            <Input 
              placeholder="your-name@example.com" 
              value={nip05}
              onChange={(e) => setNip05(e.target.value)}
              disabled={verificationStatus === 'success' || isVerifying}
              className={getThemeClasses({
                base: "w-full",
                default: "border-gray-300 bg-white text-gray-900",
                blue: "border-blue-800 bg-blue-950/80 text-blue-50",
                pink: "border-pink-800 bg-pink-950/80 text-pink-50"
              })}
            />
          </div>
          
          {verificationStatus === 'none' && (
            <Button 
              onClick={verifyNip05}
              disabled={!nip05 || isVerifying}
              className={getThemedButtonClasses("primary")}
            >
              Verify
            </Button>
          )}
          
          {verificationStatus === 'pending' && (
            <Button 
              disabled
              className={getThemedButtonClasses("primary")}
            >
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </Button>
          )}
          
          {verificationStatus === 'success' && (
            <Badge className={getThemeClasses({
              base: "px-2 py-1 gap-1",
              default: "bg-green-100 text-green-800 hover:bg-green-200",
              blue: "bg-green-900 text-green-100 hover:bg-green-800",
              pink: "bg-green-900 text-green-100 hover:bg-green-800"
            })}>
              <Check className="h-3 w-3" />
              Verified
            </Badge>
          )}
          
          {verificationStatus === 'error' && (
            <Button 
              variant="outline"
              onClick={resetVerification}
              className={getThemeClasses({
                base: "",
                default: "border-red-300 text-red-600 hover:bg-red-50",
                blue: "border-red-800 text-red-400 hover:bg-red-900/50",
                pink: "border-red-800 text-red-400 hover:bg-red-900/50"
              })}
            >
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
        
        <AnimatePresence>
          {verificationStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={getThemeClasses({
                base: "p-3 rounded text-sm flex items-start gap-2",
                default: "bg-red-50 text-red-700 border border-red-100",
                blue: "bg-red-900/20 text-red-300 border border-red-900/30",
                pink: "bg-red-900/20 text-red-300 border border-red-900/30"
              })}
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>{errorMessage}</div>
            </motion.div>
          )}
          
          {verificationStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={getThemeClasses({
                base: "p-3 rounded text-sm",
                default: "bg-green-50 text-green-700 border border-green-100",
                blue: "bg-green-900/20 text-green-300 border border-green-900/30",
                pink: "bg-green-900/20 text-green-300 border border-green-900/30"
              })}
            >
              <div className="flex items-center gap-2 font-medium mb-1">
                <Check className="h-4 w-4" />
                <span>NIP-05 Verified Successfully</span>
              </div>
              <p>Your Nostr identity has been verified. You can now use Nostr-powered features in GDY·UP.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      
      <CardFooter className={cn(
        "flex justify-between",
        getThemeClasses({
          base: "text-xs border-t p-3",
          default: "border-gray-100 text-gray-500",
          blue: "border-blue-900/30 text-blue-300",
          pink: "border-pink-900/30 text-pink-300"
        })
      )}>
        <div>
          What is Nostr? 
          <a 
            href="https://nostr.com/what-is-nostr" 
            target="_blank" 
            rel="noopener noreferrer"
            className={getThemeClasses({
              base: "ml-1 inline-flex items-center underline",
              default: "text-blue-600 hover:text-blue-800",
              blue: "text-blue-300 hover:text-blue-100",
              pink: "text-pink-300 hover:text-pink-100"
            })}
          >
            Learn more <ExternalLink className="h-3 w-3 ml-0.5" />
          </a>
        </div>
        <div>NIP-05 Identity Verification</div>
      </CardFooter>
    </Card>
  );
} 