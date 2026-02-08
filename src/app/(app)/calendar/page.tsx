'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import Link from 'next/link';

export default function CalendarPage() {
  const events = useQuery(api.events.get) ?? [];
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });

    // Pad start of month to align with weekday
    const startDay = start.getDay();
    const paddedDays: (Date | null)[] = Array(startDay).fill(null).concat(allDays);
    return paddedDays;
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const event of events) {
      if (!event.startDate) continue;
      const key = format(new Date(event.startDate), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate.get(key) ?? [];
  }, [selectedDate, eventsByDate]);

  return (
    <div className="container py-8 text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Event Calendar</h1>
        <p className="text-gray-400 mt-2">Browse upcoming events by date.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-xl">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                  if (!day) return <div key={`pad-${i}`} />;
                  const key = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate.get(key) ?? [];
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const today = isToday(day);

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative p-2 min-h-[60px] rounded-lg text-left transition-all
                        hover:bg-white/10
                        ${isSelected ? 'bg-cyan-500/20 ring-1 ring-cyan-500' : ''}
                        ${today ? 'border border-cyan-500/40' : ''}
                        ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}
                      `}
                    >
                      <span className={`text-sm ${today ? 'text-cyan-400 font-bold' : 'text-gray-300'}`}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {dayEvents.slice(0, 2).map((e: { _id: string }) => (
                            <div key={e._id} className="w-full h-1.5 rounded-full bg-cyan-500/60" />
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-[10px] text-cyan-400">+{dayEvents.length - 2}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Day Events */}
        <div>
          <Card className="bg-white/5 border-white/10 text-white sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5 text-cyan-400" />
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedDate && (
                <p className="text-gray-500 text-sm">Click a date on the calendar to see events.</p>
              )}
              {selectedDate && selectedEvents.length === 0 && (
                <p className="text-gray-500 text-sm">No events on this date.</p>
              )}
              {selectedEvents.map((event: any) => (
                <Link href={`/events/${event._id}`} key={event._id}>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold line-clamp-2">{event.title}</h4>
                      <Badge variant="outline" className="text-[10px] shrink-0 ml-2 border-white/10">
                        {event.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.startDate), 'h:mm a')}
                      </span>
                      {event.location?.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {typeof event.location.venue === 'string'
                            ? event.location.venue
                            : event.location.venue?.name ?? 'TBD'}
                        </span>
                      )}
                    </div>
                    {event.capacity && (
                      <div className="mt-2 text-xs text-gray-500">
                        {event.registeredCount ?? 0}/{event.capacity} registered
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
