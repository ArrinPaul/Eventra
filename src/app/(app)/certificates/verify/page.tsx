import { Suspense } from 'react';
import CertificateVerifyClient from './verify-client';

export const metadata = {
  title: 'Verify Certificate | EventOS',
  description: 'Verify the authenticity of a certificate',
};

export default function VerifyCertificatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CertificateVerifyClient />
    </Suspense>
  );
}
