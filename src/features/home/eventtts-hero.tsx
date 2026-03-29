/**
 * Hero Section Component - Eventtts Style
 * 
 * Modern hero section with red gradient background
 * matching the Eventtts design aesthetic
 */

import Link from "next/link";

export default function EventttsHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-red-hero py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center text-white space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
            <span className="text-sm font-medium">
              ⚡ Professional Event Organization Platform
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Organize & Manage
            <br />
            <span className="text-red-100">Your Events</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-red-50 max-w-3xl mx-auto">
            Everything you need to organize successful events - from planning
            to execution, attendee management to analytics.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              href="/events/create"
              className="px-8 py-4 bg-white text-primary rounded-lg font-semibold text-lg hover:bg-red-50 transition-colors shadow-lg"
            >
              Create New Event →
            </Link>
            <Link
              href="/events"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg border border-white/30 hover:bg-white/20 transition-colors"
            >
              Manage My Events
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl md:text-4xl font-bold mb-1">500+</div>
              <div className="text-sm md:text-base text-red-100">Events Created</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl md:text-4xl font-bold mb-1">95%</div>
              <div className="text-sm md:text-base text-red-100">Success Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl md:text-4xl font-bold mb-1">10K+</div>
              <div className="text-sm md:text-base text-red-100">Total Attendees</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
