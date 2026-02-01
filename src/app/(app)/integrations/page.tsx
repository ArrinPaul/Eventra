'use client';

import React, { useState } from 'react';
import {
  FileText,
  MessageSquare,
  Zap,
  BarChart3,
  Globe,
  Settings,
  ChevronRight,
  Users,
  Calendar,
  TrendingUp,
  Bot,
  Brain,
  Workflow,
} from 'lucide-react';

// Import FUNCTIONAL integration components (not placeholder versions)
import GoogleWorkspaceIntegration from '@/components/integrations/google-workspace-integration';
import NotationClient from '@/components/notation/notation-client';
import N8nAutomation from '@/components/integrations/n8n-automation';
import AIChatbot from '@/components/ai/ai-chatbot';
import AnalyticsDashboard from '@/components/analytics/comprehensive-analytics-dashboard';
import WebScraperTimeline from '@/components/scraper/web-scraper-timeline';

interface IntegrationModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  category: 'productivity' | 'automation' | 'analytics' | 'ai';
  features: string[];
  status: 'active' | 'beta' | 'coming-soon';
}

const integrationModules: IntegrationModule[] = [
  {
    id: 'google-workspace',
    title: 'Enhanced Google Workspace',
    description: 'Advanced collaboration with Google Drive, Docs, and Sheets integration',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    category: 'productivity',
    features: ['Drive Picker', 'Real-time Collaboration', 'Document Management', 'Role-based Access'],
    status: 'active',
  },
  {
    id: 'notation-system',
    title: 'Collaborative Notation',
    description: 'Internal Notion-like system for documentation and note-taking',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    category: 'productivity',
    features: ['Rich Text Editor', 'AI Summarization', 'Team Collaboration', 'Export Options'],
    status: 'active',
  },
  {
    id: 'n8n-automation',
    title: 'Workflow Automation',
    description: 'n8n integration for automated workflows and AI-triggered actions',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    category: 'automation',
    features: ['Visual Workflow Builder', 'Event Triggers', 'API Integrations', 'Scheduled Tasks'],
    status: 'active',
  },
  {
    id: 'ai-chatbot',
    title: 'AI Assistant',
    description: 'Intelligent chatbot for interactive assistance and event planning',
    icon: Bot,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    category: 'ai',
    features: ['Conversational AI', 'Voice Input', 'Context Awareness', 'Quick Actions'],
    status: 'active',
  },
  {
    id: 'ai-insights',
    title: 'AI Insights Dashboard',
    description: 'Advanced analytics with predictive insights and recommendations',
    icon: Brain,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    category: 'analytics',
    features: ['Predictive Analytics', 'Data Visualization', 'AI Recommendations', 'Export Reports'],
    status: 'active',
  },
  {
    id: 'web-scraper',
    title: 'Web Scraper & Timeline',
    description: 'Event data aggregation with competitor analysis and timeline insights',
    icon: Globe,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    category: 'analytics',
    features: ['Event Scraping', 'Competitor Analysis', 'Timeline View', 'Market Insights'],
    status: 'active',
  },
];

export default function IntegrationsHub() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Integrations', count: integrationModules.length },
    { id: 'productivity', label: 'Productivity', count: integrationModules.filter(m => m.category === 'productivity').length },
    { id: 'automation', label: 'Automation', count: integrationModules.filter(m => m.category === 'automation').length },
    { id: 'analytics', label: 'Analytics', count: integrationModules.filter(m => m.category === 'analytics').length },
    { id: 'ai', label: 'AI & Intelligence', count: integrationModules.filter(m => m.category === 'ai').length },
  ];

  const filteredModules = selectedCategory === 'all' 
    ? integrationModules 
    : integrationModules.filter(m => m.category === selectedCategory);

  const renderModuleComponent = () => {
    switch (activeModule) {
      case 'google-workspace':
        // Google Workspace integration - shows global settings when no event selected
        return <GoogleWorkspaceIntegration eventId="" eventTitle="Global Integration Settings" />;
      case 'notation-system':
        return <NotationClient />;
      case 'n8n-automation':
        return <N8nAutomation userRole="organizer" />;
      case 'ai-chatbot':
        return <AIChatbot />;
      case 'ai-insights':
        return <AnalyticsDashboard />;
      case 'web-scraper':
        return <WebScraperTimeline />;
      default:
        return null;
    }
  };

  if (activeModule) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with back navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveModule(null)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronRight className="rotate-180" size={20} />
                <span>Back to Integrations</span>
              </button>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-gray-800">
                {integrationModules.find(m => m.id === activeModule)?.title}
              </span>
            </div>
          </div>
        </div>

        {/* Module Component */}
        <div className="p-6">
          {renderModuleComponent()}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Workflow className="text-blue-500" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">Advanced Integrations Hub</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Comprehensive suite of advanced integrations for enhanced event management and automation
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Integrations</p>
              <p className="text-2xl font-bold text-blue-600">{integrationModules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Modules</p>
              <p className="text-2xl font-bold text-green-600">
                {integrationModules.filter(m => m.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">AI Features</p>
              <p className="text-2xl font-bold text-purple-600">
                {integrationModules.filter(m => m.category === 'ai').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Automations</p>
              <p className="text-2xl font-bold text-orange-600">
                {integrationModules.filter(m => m.category === 'automation').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
              <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Integration Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => (
          <div
            key={module.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveModule(module.id)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${module.bgColor}`}>
                  <module.icon className={module.color} size={24} />
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    module.status === 'active' ? 'bg-green-100 text-green-800' :
                    module.status === 'beta' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {module.status === 'active' ? 'Active' :
                     module.status === 'beta' ? 'Beta' : 'Coming Soon'}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">{module.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{module.description}</p>

              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700">Key Features:</p>
                <div className="flex flex-wrap gap-1">
                  {module.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium capitalize ${module.color}`}>
                  {module.category}
                </span>
                <button className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  module.status === 'active' 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-not-allowed'
                }`}>
                  <span>{module.status === 'active' ? 'Open' : 'Preview'}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Information */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Complete Integration Ecosystem
          </h2>
          <p className="text-gray-600 mb-6 max-w-3xl mx-auto">
            Our advanced integrations provide a comprehensive suite of tools for event management,
            from collaborative documentation and workflow automation to AI-powered insights and
            competitive intelligence. All modules are designed to work seamlessly together while
            maintaining the existing platform&apos;s design language and functionality.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                <Users className="text-blue-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Enhanced Collaboration</h3>
              <p className="text-sm text-gray-600">
                Real-time collaboration tools and shared workspaces for better team coordination
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3">
                <Brain className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">AI-Powered Intelligence</h3>
              <p className="text-sm text-gray-600">
                Smart insights, predictive analytics, and automated assistance powered by AI
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-3">
                <Zap className="text-orange-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Seamless Automation</h3>
              <p className="text-sm text-gray-600">
                Automated workflows and intelligent triggers to streamline operations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}