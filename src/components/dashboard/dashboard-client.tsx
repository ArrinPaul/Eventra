'use client';

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { QrCode, Calendar, MessageSquare, Ticket, User } from "lucide-react";
import type { Student, Professional } from "@/types";
import RecommendedSessions from "@/components/dashboard/recommended-sessions";


function ProfileSummary() {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <Card className="interactive-element">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" /> 
                    Profile Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                 <div>
                    <p className="text-muted-foreground text-xs">Name</p>
                    <p>{user.name}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p>{user.email}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground text-xs">Role</p>
                    <p className="capitalize">{user.role}</p>
                </div>
                {user.role === 'student' && (
                    <>
                        <div>
                            <p className="text-muted-foreground text-xs">College</p>
                            <p>{(user as Student).college}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Year</p>
                            <p>{(user as Student).year}</p>
                        </div>
                    </>
                )}
                {user.role === 'professional' && (
                    <>
                       <div>
                            <p className="text-muted-foreground text-xs">Company</p>
                            <p>{(user as Professional).company}</p>
                        </div>
                         <div>
                            <p className="text-muted-foreground text-xs">Designation</p>
                            <p>{(user as Professional).designation}</p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

function QRCodeCard() {
    const { user } = useAuth();
    if (!user) return null;
    const qrData = JSON.stringify({ registrationId: user.registrationId, name: user.name });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&qzone=1&bgcolor=F7F7F7`;

    return (
        <Card className="interactive-element">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-muted-foreground" />
                    Registration ID
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <div className="p-2 bg-stone-100 rounded-lg">
                    <Image
                        src={qrUrl}
                        alt="Registration QR Code"
                        width={180}
                        height={180}
                        className="rounded-md"
                    />
                </div>
                <p className="font-mono text-lg font-bold tracking-widest bg-muted px-3 py-1 rounded-md">{user.registrationId}</p>
            </CardContent>
        </Card>
    );
}

const quickActions = [
    { href: "/my-events", title: "My Events", icon: Ticket, description: "View your personal schedule." },
    { href: "/agenda", title: "Full Agenda", icon: Calendar, description: "Explore all sessions and talks." },
    { href: "/chat", title: "Group Chat", icon: MessageSquare, description: "Connect with other attendees." },
];

function QuickActions() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map(action => (
                <Link href={action.href} key={action.href}>
                    <Card className="h-full interactive-element hover:bg-accent/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <action.icon className="h-5 w-5 text-muted-foreground" />
                                {action.title}
                            </CardTitle>
                            <CardDescription>{action.description}</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            ))}
        </div>
    );
}

export default function DashboardClient() {
    const { user } = useAuth();

    if (!user) {
        return <div>Loading...</div>;
    }
    
    const showRecs = user.role === 'student' || user.role === 'professional';

    return (
        <div className="container py-12">
            <h1 className="text-4xl font-bold font-headline mb-2">
                Welcome, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground mb-10">
                Here's your personalized hub for the event.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {showRecs && <RecommendedSessions />}
                    <QuickActions />
                </div>
                <div className="space-y-8">
                    <ProfileSummary />
                    <QRCodeCard />
                </div>
            </div>
        </div>
    );
}
