'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface EventReactionsProps {
  eventId: Id<"events">;
}

const EMOJIS = ["❤️", "🔥", "🙌", "😮", "👍"];

export function EventReactions({ eventId }: EventReactionsProps) {
  const reactions = useQuery(api.events.getReactions, { eventId }) || {};
  const addReaction = useMutation(api.events.addReaction);

  return (
    <div className="flex flex-wrap gap-2 py-4">
      {EMOJIS.map((emoji) => {
        const stats = reactions[emoji] || { count: 0, me: false };
        return (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => addReaction({ eventId, emoji })}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-sm",
              stats.me 
                ? "bg-cyan-500/20 border-cyan-500/50 text-white" 
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
            )}
          >
            <span>{emoji}</span>
            {stats.count > 0 && (
              <span className={cn("font-bold", stats.me ? "text-cyan-400" : "text-gray-500")}>
                {stats.count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
