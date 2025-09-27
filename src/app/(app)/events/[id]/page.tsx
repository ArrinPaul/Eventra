import { EVENTS } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Users, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const event = EVENTS.find(e => e.id === params.id);

  if (!event) {
    notFound();
  }

  return (
    <div className="container py-12">
        <Button asChild variant="ghost" className="mb-8">
            <Link href="/events">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
            </Link>
        </Button>
        <Card className="max-w-4xl mx-auto glass-effect">
            <CardHeader>
                <CardTitle className="text-4xl font-headline">{event.title}</CardTitle>
                <CardDescription className="text-lg pt-2">{event.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-base">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="flex items-center text-foreground"><Calendar className="mr-3 h-5 w-5 text-primary"/><div><p className="font-semibold">Date</p><p>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div></div>
                    <div className="flex items-center text-foreground"><Clock className="mr-3 h-5 w-5 text-primary"/><div><p className="font-semibold">Time</p><p>{event.time}</p></div></div>
                    <div className="flex items-center text-foreground"><MapPin className="mr-3 h-5 w-5 text-primary"/><div><p className="font-semibold">Location</p><p>{event.location}</p></div></div>
                    <div className="flex items-center text-foreground"><Tag className="mr-3 h-5 w-5 text-primary"/><div><p className="font-semibold">Category</p><p>{event.category}</p></div></div>
                    <div className="flex items-center text-foreground"><Users className="mr-3 h-5 w-5 text-primary"/><div><p className="font-semibold">Audience</p><p>{event.targetAudience}</p></div></div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
