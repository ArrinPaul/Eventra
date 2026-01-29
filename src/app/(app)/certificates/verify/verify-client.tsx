'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Search, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { verifyCertificate, Certificate } from '@/app/actions/certificates';

export default function CertificateVerifyClient() {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ found: boolean; certificate?: Certificate } | null>(null);

  const handleVerify = async () => {
    if (!verificationCode.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const certificate = await verifyCertificate(verificationCode.trim().toUpperCase());
      setResult({
        found: !!certificate,
        certificate: certificate || undefined,
      });
    } catch (error) {
      console.error('Verification error:', error);
      setResult({ found: false });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Certificate Verification</h1>
          <p className="text-muted-foreground">
            Enter the verification code to verify the authenticity of a certificate
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verify Certificate</CardTitle>
            <CardDescription>
              The verification code can be found at the bottom of the certificate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Verification Input */}
            <div className="flex gap-3">
              <Input
                placeholder="XXXX-XXXX-XXXX"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                className="font-mono text-lg tracking-wider"
                maxLength={14}
              />
              <Button onClick={handleVerify} disabled={loading || !verificationCode.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Result */}
            {result && (
              <div className={`p-6 rounded-lg border-2 ${
                result.found 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' 
                  : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {result.found ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-300">
                          Certificate Verified
                        </h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          This certificate is authentic and valid
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                      <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-300">
                          Certificate Not Found
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          No certificate found with this verification code
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {result.found && result.certificate && (
                  <div className="space-y-3 pt-4 border-t border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Recipient:</span>
                      <span className="font-medium">{result.certificate.recipientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Event:</span>
                      <span className="font-medium">{result.certificate.eventTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Issued:</span>
                      <span className="font-medium">
                        {result.certificate.issuedAt.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="pt-2">
                      <Badge variant="secondary" className="font-mono">
                        {result.certificate.verificationCode}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                The verification code is a 12-character alphanumeric code in the format XXXX-XXXX-XXXX
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
