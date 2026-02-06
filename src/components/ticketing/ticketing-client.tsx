'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, ShoppingCart } from 'lucide-react';

export function TicketingClient() {
  return (
    <div className="container mx-auto p-6 space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Event Tickets</h1>
        <p className="text-gray-400">Discover and book tickets</p>
      </div>

      <div className="py-20 text-center text-gray-500 border border-white/10 rounded-lg">
        <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
        <p>Ticketing system is being upgraded. Check back soon for new events!</p>
      </div>
    </div>
  );
}
