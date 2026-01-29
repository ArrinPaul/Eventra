import { Metadata } from 'next';
import { CertificatesClient } from './certificates-client';

export const metadata: Metadata = {
  title: 'My Certificates | Eventra',
  description: 'View and download your earned certificates',
};

export default function CertificatesPage() {
  return <CertificatesClient />;
}
