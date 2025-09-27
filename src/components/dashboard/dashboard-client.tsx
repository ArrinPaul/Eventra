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
                <CardTitle className="font-headline flex items-center gap-2">
                    <User /> Profile Summary
                </CardTitle>
                <CardDescription>Your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> <span className="capitalize">{user.role}</span></p>
                {user.role === 'student' && (
                    <>
                        <p><strong>College:</strong> {(user as Student).college}</p>
                        <p><strong>Year:</strong> {(user as Student).year}</p>
                    </>
                )}
                {user.role === 'professional' && (
                    <>
                        <p><strong>Company:</strong> {(user as Professional).company}</p>
                        <p><strong>Designation:</strong> {(user as Professional).designation}</p>
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
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    return (
        <Card className="interactive-element">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <QrCode /> Registration ID
                </CardTitle>
                <CardDescription>Your unique QR code for check-in.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <div className="p-2 bg-white rounded-lg">
                    <Image
                        src={qrUrl}
                        alt="Registration QR Code"
                        width={200}
                        height={200}
                        className="rounded-md"
                    />
                </div>
                <p className="font-mono text-lg font-bold tracking-widest">{user.registrationId}</p>
            </CardContent>
        </Card>
    );
}

const quickActions = [
    { href: "/my-events", title: "My Events", icon: Ticket, description: "View your personal schedule." },
    { href: "/agenda", title: "Agenda", icon: Calendar, description: "Explore all sessions and talks." },
    { href: "/chat", title: "Group Chat", icon: MessageSquare, description: "Connect with other attendees." },
];

function QuickActions() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map(action => (
                <Link href={action.href} key={action.href}>
                    <Card className="h-full interactive-element">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <action.icon className="h-5 w-5" />
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
        <div className="container py-8">
            <h1 className="text-3xl font-bold font-headline mb-4">
                Welcome, {user.name}!
            </h1>
            <p className="text-muted-foreground mb-8">
                Here's your personalized hub for the event.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
