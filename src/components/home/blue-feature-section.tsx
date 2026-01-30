/**
 * Blue Section Component - Eventtts Style
 * 
 * Feature section with blue gradient background
 * for participant/user-facing content
 */

import Link from "next/link";

export default function BlueFeatureSection() {
  return (
    <section className="py-20 bg-soft-blue">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200">
              <span className="text-sm font-medium text-blue-700">
                🎯 For Participants
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Discover Events{" "}
              <span className="text-gradient-blue">You&apos;ll Love</span>
            </h2>

            {/* Description */}
            <p className="text-lg text-muted-foreground">
              Never miss out on amazing campus experiences again. Get
              personalized event recommendations based on your interests
              and connect with like-minded people.
            </p>

            {/* Features */}
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Smart location-based recommendations</h4>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Connect with friends and meet new people</h4>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Personalized based on your interests</h4>
                </div>
              </li>
            </ul>

            {/* CTA */}
            <div className="pt-4">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                Explore Events Now →
              </Link>
            </div>
          </div>

          {/* Right: Blue Card Section */}
          <div className="bg-gradient-blue-section rounded-2xl p-8 shadow-xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">Your Event Feed</h3>
              
              {/* Event Cards */}
              <div className="space-y-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded bg-white/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📸</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">Photography Workshop</h4>
                      <p className="text-sm text-blue-100">Learn advanced photography techniques</p>
                      <p className="text-xs text-blue-200 mt-1">Art Building • 3:00 PM</p>
                    </div>
                    <div className="px-3 py-1 bg-green-400 text-green-900 rounded-full text-xs font-medium">
                      Interested
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded bg-white/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🎮</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">Gaming Tournament</h4>
                      <p className="text-sm text-blue-100">Join the campus esports championship</p>
                      <p className="text-xs text-blue-200 mt-1">Game Center • 6:00 PM</p>
                    </div>
                    <div className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-medium">
                      Attending
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
