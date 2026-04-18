'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/core/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Id } from '@/types';
import { addEventReaction, getEventReactions } from '@/app/actions/event-engagement';

interface EventReactionsProps {
  eventId: Id<"events">;
}

const REACTION_LABELS = ["Love", "Hot", "Celebrate", "Wow", "Like"];
const EMOJIS = ['❤️', '🔥', '🎉', '😮', '👍'];

export function EventReactions({ eventId }: EventReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, { count: number; me: boolean }>>({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      const rows = await getEventReactions(eventId as any);
      if (!mounted) return;

      const map: Record<string, { count: number; me: boolean }> = {};
      for (const row of rows) {
        map[row.emoji] = { count: row.count, me: row.me };
      }
      setReactions(map);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  async function handleReact(emoji: string) {
    const result = await addEventReaction({ eventId: eventId as any, emoji });
    if (!result.success) return;

    setReactions((prev) => {
      const current = prev[emoji] || { count: 0, me: false };
      const next = {
        ...prev,
        [emoji]: {
          me: result.reacted,
          count: result.reacted ? current.count + 1 : Math.max(0, current.count - 1),
        },
      };
      return next;
    });
  }

  return (
    <div className="flex flex-wrap gap-2 py-4">
      {EMOJIS.map((emoji: string) => {
        const stats = reactions[emoji] || { count: 0, me: false };
        return (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleReact(emoji)}
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


