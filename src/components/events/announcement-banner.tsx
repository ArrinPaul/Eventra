'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { AlertCircle, Bell, Info, X } from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function AnnouncementBanner({ eventId }: { eventId: string }) {
  const announcements = useQuery(api.announcements.getActiveByEvent, { eventId: eventId as any });
  
  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      <AnimatePresence>
        {announcements.map((a) => (
          <motion.div
            key={a._id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn(
              "relative p-4 rounded-xl border flex items-start gap-3 overflow-hidden",
              a.type === 'info' && "bg-cyan-500/10 border-cyan-500/20 text-cyan-200",
              a.type === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-200",
              a.type === 'urgent' && "bg-red-500/10 border-red-500/20 text-red-200 animate-pulse"
            )}
          >
            <div className="shrink-0 pt-0.5">
              {a.type === 'info' && <Info className="h-5 w-5" />}
              {a.type === 'warning' && <AlertCircle className="h-5 w-5" />}
              {a.type === 'urgent' && <Bell className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-relaxed">{a.content}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
