/**
 * Feature Grid Component - Eventtts Style
 * 
 * Displays features with vibrant gradient icon circles
 * matching the Eventtts design aesthetic
 */

import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  Award, 
  Bug, 
  Image,
  Zap,
  QrCode,
  Users,
  PieChart
} from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconGradient: string;
}

const features: Feature[] = [
  {
    id: "analytics",
    title: "AI-Powered Analytics",
    description: "Get intelligent insights about your events with automated reports on attendance, engagement, and revenue performance.",
    icon: <BarChart3 className="w-8 h-8" />,
    iconGradient: "icon-gradient-purple",
  },
  {
    id: "feedback",
    title: "Auto Feedback Collection",
    description: "Automatically collect and analyze attendee feedback with customizable forms and AI-generated insights.",
    icon: <FileText className="w-8 h-8" />,
    iconGradient: "icon-gradient-cyan",
  },
  {
    id: "revenue",
    title: "Revenue Analytics",
    description: "Track ticket sales, monitor revenue streams, and get detailed financial insights for better decision making.",
    icon: <TrendingUp className="w-8 h-8" />,
    iconGradient: "icon-gradient-green",
  },
  {
    id: "certificates",
    title: "Certificate Generation",
    description: "Automatically generate and distribute digital certificates to attendees with customizable templates and branding.",
    icon: <Award className="w-8 h-8" />,
    iconGradient: "icon-gradient-orange",
  },
  {
    id: "reporting",
    title: "Issue Reporting",
    description: "Built-in system for attendees to report issues and for organizers to track and resolve problems efficiently.",
    icon: <Bug className="w-8 h-8" />,
    iconGradient: "icon-gradient-pink",
  },
  {
    id: "gallery",
    title: "Event Gallery",
    description: "Enable photo sharing with attendees, create collaborative galleries, and showcase your event memories.",
    icon: <Image className="w-8 h-8" />,
    iconGradient: "icon-gradient-purple",
  },
  {
    id: "planning",
    title: "AI Event Planning",
    description: "Get AI-generated event plans, schedules, and suggestions to streamline your event organization process.",
    icon: <Zap className="w-8 h-8" />,
    iconGradient: "icon-gradient-cyan",
  },
  {
    id: "qr-tickets",
    title: "QR Code Tickets",
    description: "Generate secure QR code tickets for easy check-in, attendance tracking, and enhanced security at your events.",
    icon: <QrCode className="w-8 h-8" />,
    iconGradient: "icon-gradient-orange",
  },
  {
    id: "attendees",
    title: "Attendee Management",
    description: "Comprehensive attendee tracking, registration management, and communication tools all in one place.",
    icon: <Users className="w-8 h-8" />,
    iconGradient: "icon-gradient-purple",
  },
  {
    id: "dashboard",
    title: "Stakeholder Dashboard",
    description: "Provide stakeholders with real-time event insights, progress reports, and collaborative planning tools.",
    icon: <PieChart className="w-8 h-8" />,
    iconGradient: "icon-gradient-cyan",
  },
];

export default function FeatureGrid() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Powerful Tools for Event Organizers
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Streamline your event management with AI-powered features designed to
            maximize efficiency, engagement, and success.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-card rounded-xl shadow-card p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="mb-4">
                <div
                  className={`w-16 h-16 rounded-full ${feature.iconGradient} flex items-center justify-center text-white shadow-feature-icon`}
                >
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
