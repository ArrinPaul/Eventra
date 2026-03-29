'use client';

export function EventCalendarLegend() {
  return (
    <div className="flex items-center gap-3 text-xs text-gray-500">
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-cyan-400" />
        Event day
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full border border-cyan-400" />
        Today
      </span>
    </div>
  );
}

