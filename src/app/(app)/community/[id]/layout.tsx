import type { ReactNode } from 'react';

interface CommunityDetailLayoutProps {
  children: ReactNode;
}

export default function CommunityDetailLayout({ children }: CommunityDetailLayoutProps) {
  return <>{children}</>;
}
