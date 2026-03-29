'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ScraperStatusCard() {
  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="text-base">Scraper Integrations</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-400">
        Source scraping pipelines can be configured from Integrations when enabled.
      </CardContent>
    </Card>
  );
}
