'use client';

import { Badge } from '@/components/ui/badge';

export function EventNoteBadge({ label }: { label: string }) {
  return <Badge variant="outline" className="border-white/10 text-gray-300">{label}</Badge>;
}
