'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const HERO_SLIDES = [
  {
    id: 1,
    title: 'EventOS',
    subtitle: 'Your Intelligent Event Companion',
    description: 'Plan, manage, and attend events seamlessly with AI-powered tools',
    image: 'https://picsum.photos/seed/event1/1920/1080',
    gradient: 'from-[#FF6B35]/20 via-[#A855F7]/10 to-transparent',
    cta: { text: 'Get Started', href: '/register' },
    badge: 'AI-Powered'
  },
  {
    id: 2,
    title: 'Create Amazing Events',
    subtitle: 'Organize with Confidence',
    description: 'From planning to execution, we handle the details so you can focus on what matters',
    image: 'https://picsum.photos/seed/event2/1920/1080',
    gradient: 'from-[#EC4899]/20 via-[#8B5CF6]/10 to-transparent',
    cta: { text: 'Create Event', href: '/events/create' },
    badge: 'For Organizers'
  },
  {
    id: 3,
    title: 'Discover Events',
    subtitle: 'Never Miss Out',
    description: 'Find events tailored to your interests with smart recommendations',
    image: 'https://picsum.photos/seed/event3/1920/1080',
    gradient: 'from-[#A855F7]/20 via-[#FF6B35]/10 to-transparent',
    cta: { text: 'Explore Events', href: '/explore' },
    badge: 'Smart Discovery'
  }
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div 
      className="relative isolate overflow-hidden h-[calc(100vh-4rem)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images with Transitions */}
      {HERO_SLIDES.map((s, index) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 -z-10 transition-opacity duration-1000",
            index === currentSlide ? "opacity-100" : "opacity-0"
          )}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${s.image})` }}
          />
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
          <div className={cn("absolute inset-0 bg-gradient-to-br", s.gradient)} />
        </div>
      ))}

      {/* Dot Pattern Overlay */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(theme(colors.primary/0.1)_1px,transparent_1px)] [background-size:16px_16px]"></div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex items-center h-full relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <Badge variant="secondary" className="text-sm px-4 py-1.5 bg-primary/10 border-primary/20">
              ✨ {slide.badge}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground sm:text-7xl mb-6 gradient-text animate-in fade-in slide-in-from-top-6 duration-700">
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p className="text-2xl sm:text-3xl font-semibold mb-4 animate-in fade-in slide-in-from-top-8 duration-700">
            {slide.subtitle}
          </p>

          {/* Description */}
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-top-10 duration-700">
            {slide.description}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex items-center justify-center gap-x-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Button asChild size="lg" className="interactive-element">
              <Link href={slide.cta.href}>
                {slide.cta.text}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="interactive-element">
              <Link href="/explore">
                Browse Events
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-all hover:scale-110 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 group-hover:-translate-x-0.5 transition-transform" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-all hover:scale-110 group"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === currentSlide 
                ? "w-8 bg-primary" 
                : "w-2 bg-muted-foreground/50 hover:bg-muted-foreground"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
