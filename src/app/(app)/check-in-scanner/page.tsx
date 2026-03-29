// @ts-nocheck
import CheckInScannerClient from '@/features/check-in/check-in-scanner-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check-in Scanner | Eventra',
  description: 'Scan QR codes to check in event attendees.',
};

export default function CheckInScannerPage() {
  return <CheckInScannerClient />;
}
