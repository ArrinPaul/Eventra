# Advanced Integrations Setup Guide

This guide provides comprehensive instructions for setting up and configuring all the advanced integrations in the CIS-SAP Event Management Platform.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Overview](#installation-overview)
3. [Integration Modules](#integration-modules)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [API Documentation](#api-documentation)

## 🔧 Prerequisites

### System Requirements
- Node.js 18+ 
- Firebase Project with Admin SDK
- Google Cloud Project (for Google Workspace integration)
- TypeScript support
- React/Next.js 13+ with App Router

### Required Dependencies

```json
{
  "dependencies": {
    "@google-cloud/storage": "^7.7.0",
    "googleapis": "^131.0.0",
    "recharts": "^2.8.0",
    "lucide-react": "^0.294.0",
    "firebase": "^10.7.0",
    "firebase-admin": "^12.0.0",
    "openai": "^4.20.0",
    "cheerio": "^1.0.0-rc.12",
    "puppeteer": "^21.6.0"
  },
  "devDependencies": {
    "@types/cheerio": "^0.22.35",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service@project.iam.gserviceaccount.com

# OpenAI Configuration
OPENAI_API_KEY=sk-...

# n8n Configuration
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key

# Web Scraping Configuration
SCRAPING_USER_AGENT="CIS-SAP Event Platform Bot 1.0"
SCRAPING_RATE_LIMIT=1000
```

## 📦 Installation Overview

### 1. Install Dependencies

```bash
npm install @google-cloud/storage googleapis recharts lucide-react firebase firebase-admin openai cheerio puppeteer
npm install -D @types/cheerio @types/node typescript
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore, Authentication, and Cloud Functions
3. Generate a service account key
4. Add the service account credentials to your environment variables

### 3. Google Cloud Setup

1. Create a Google Cloud Project
2. Enable the following APIs:
   - Google Drive API
   - Google Docs API
   - Google Sheets API
   - Google Cloud Storage API
3. Create a service account with appropriate permissions
4. Download the service account key and add to environment variables

## 🔗 Integration Modules

### 1. Enhanced Google Workspace Integration

**Features:**
- Google Drive Picker integration
- Real-time document collaboration
- File management with Firebase Storage
- Role-based access control

**Files Created:**
- `src/components/workspace/enhanced-google-workspace.tsx`
- `src/app/api/google-workspace/route.ts`

**Setup Steps:**

1. Enable Google Drive API in Google Cloud Console
2. Configure OAuth2 credentials
3. Set up Firebase Storage bucket
4. Test Drive Picker functionality

**Configuration:**

```typescript
// Google Drive API Configuration
const GOOGLE_DRIVE_CONFIG = {
  apiKey: process.env.GOOGLE_API_KEY,
  clientId: process.env.GOOGLE_CLIENT_ID,
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  scope: 'https://www.googleapis.com/auth/drive.file'
};
```

### 2. Collaborative Notation System

**Features:**
- Rich text editor with ProseMirror
- AI-powered summarization
- Team collaboration features
- Export to multiple formats (PDF, DOCX, MD)

**Files Created:**
- `src/components/notation/notation-system.tsx`
- `src/app/api/notation/route.ts`

**Setup Steps:**

1. Configure OpenAI API for AI summarization
2. Set up Firestore collections for notes
3. Initialize rich text editor
4. Test collaboration features

**Firestore Collections:**

```javascript
// Collection: notes
{
  id: string,
  title: string,
  content: object, // ProseMirror JSON
  createdBy: string,
  collaborators: string[],
  createdAt: timestamp,
  updatedAt: timestamp,
  tags: string[],
  isPublic: boolean
}
```

### 3. n8n Automation Integration

**Features:**
- Visual workflow builder
- Event-triggered automation
- API integrations
- Scheduled tasks

**Files Created:**
- `src/components/automation/n8n-automation.tsx`
- `src/app/api/automation/route.ts`

**Setup Steps:**

1. Set up n8n instance (self-hosted or cloud)
2. Generate API key from n8n
3. Configure webhook endpoints
4. Test workflow creation and execution

**n8n Workflow Example:**

```json
{
  "name": "Event Registration Automation",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "event-registration"
      }
    },
    {
      "name": "Send Welcome Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "subject": "Welcome to {{$json.eventTitle}}",
        "message": "Thank you for registering!"
      }
    }
  ]
}
```

### 4. AI-Powered Chatbot System

**Features:**
- Conversational AI with OpenAI integration
- Voice input/output capabilities
- Context-aware responses
- Quick action buttons

**Files Created:**
- `src/components/ai/ai-chatbot.tsx`
- `src/app/api/ai-chat/route.ts`

**Setup Steps:**

1. Configure OpenAI API key
2. Set up conversation context storage
3. Enable speech recognition (Web Speech API)
4. Test conversation flows

**OpenAI Configuration:**

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are an AI assistant for the CIS-SAP Event Management Platform.
You help users with event planning, navigation, and platform features.
Be helpful, concise, and professional.
`;
```

### 5. AI Insights Dashboard

**Features:**
- Predictive analytics
- Data visualization with Recharts
- AI-powered recommendations
- Export capabilities (PDF, CSV, XLSX)

**Files Created:**
- `src/components/ai/ai-insights-dashboard.tsx`
- `src/app/api/ai-insights/analytics/route.ts`
- `src/app/api/ai-insights/export/route.ts`

**Setup Steps:**

1. Configure analytics data sources
2. Set up Recharts visualizations
3. Implement predictive algorithms
4. Test export functionality

**Analytics Metrics:**

- Attendance trends and forecasting
- Engagement pattern analysis
- User satisfaction scoring
- Event performance metrics
- Demographic insights

### 6. Web Scraper & Timeline Analytics

**Features:**
- Automated event data scraping
- Competitor analysis
- Timeline visualization
- Market intelligence insights

**Files Created:**
- `src/components/scraper/web-scraper-timeline.tsx`
- `src/app/api/scraper/route.ts`
- `src/app/api/timeline-analytics/route.ts`

**Setup Steps:**

1. Configure web scraping targets
2. Set up Puppeteer for dynamic content
3. Implement rate limiting and politeness policies
4. Test data aggregation and analysis

**Scraping Configuration:**

```typescript
const SCRAPING_CONFIG = {
  userAgent: 'CIS-SAP Event Platform Bot 1.0',
  rateLimit: 1000, // 1 second between requests
  timeout: 30000,
  retries: 3,
  respectRobotsTxt: true
};
```

## ⚙️ Configuration

### Firebase Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Notes collection
    match /notes/{noteId} {
      allow read, write: if request.auth != null && 
        (resource.data.createdBy == request.auth.uid || 
         request.auth.uid in resource.data.collaborators);
    }
    
    // Scraped events collection
    match /scrapedEvents/{eventId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Workflows collection
    match /workflows/{workflowId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### API Rate Limits

```typescript
// Rate limiting configuration
const RATE_LIMITS = {
  openai: 60, // requests per minute
  googleDrive: 100, // requests per 100 seconds
  n8n: 30, // requests per minute
  scraping: 1, // requests per second
};
```

## 🧪 Testing

### Unit Tests

Create test files for each integration:

```typescript
// Example test for AI Chat
import { POST } from '@/app/api/ai-chat/route';

describe('AI Chat API', () => {
  it('should generate AI response', async () => {
    const request = new Request('http://localhost/api/ai-chat', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        conversationId: 'test-123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.response).toBeDefined();
  });
});
```

### Integration Tests

```bash
# Test Google Workspace integration
npm run test:workspace

# Test AI features
npm run test:ai

# Test automation workflows
npm run test:automation

# Test web scraping
npm run test:scraper
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Google API Authentication Errors

**Error:** `Invalid credentials` or `Token expired`

**Solution:**
- Verify service account key is correctly formatted
- Check API scopes in Google Cloud Console
- Ensure APIs are enabled for the project

#### 2. OpenAI API Errors

**Error:** `Rate limit exceeded` or `Invalid API key`

**Solution:**
- Check API key validity and billing status
- Implement proper rate limiting
- Use exponential backoff for retries

#### 3. n8n Connection Issues

**Error:** `Connection refused` or `Unauthorized`

**Solution:**
- Verify n8n instance is running
- Check API key permissions
- Test connectivity with curl

#### 4. Web Scraping Blocked

**Error:** `403 Forbidden` or `Captcha required`

**Solution:**
- Implement proper delays between requests
- Use rotating user agents
- Respect robots.txt files
- Consider using proxy services

### Debug Mode

Enable debug logging by setting:

```env
DEBUG_INTEGRATIONS=true
LOG_LEVEL=debug
```

## 📚 API Documentation

### Authentication

All API endpoints require Firebase Authentication:

```typescript
headers: {
  'Authorization': 'Bearer <firebase-id-token>',
  'Content-Type': 'application/json'
}
```

### API Endpoints

#### Google Workspace API

```
POST /api/google-workspace
- uploadFile: Upload file to Google Drive
- createDocument: Create new Google Doc/Sheet
- shareFile: Share file with collaborators
- getFileContent: Retrieve file content
```

#### Notation System API

```
POST /api/notation
- createNote: Create new note
- updateNote: Update existing note
- generateSummary: AI-powered summarization
- shareNote: Share with collaborators
```

#### Automation API

```
POST /api/automation
- createWorkflow: Create n8n workflow
- executeWorkflow: Execute workflow
- getWorkflows: List user workflows
- updateWorkflow: Modify workflow
```

#### AI Chat API

```
POST /api/ai-chat
- sendMessage: Send message to AI
- getConversations: Get conversation history
- clearContext: Reset conversation context
```

#### Analytics API

```
POST /api/ai-insights/analytics
- generateAnalytics: Create analytics report
- getPredictions: Get AI predictions
- exportData: Export analytics data
```

#### Web Scraper API

```
POST /api/scraper
- startScraping: Begin scraping process
- addTarget: Add new scraping target
- getEvents: Retrieve scraped events
- analyzeCompetitors: Generate competitor analysis
```

## 🚀 Deployment

### Production Checklist

- [ ] Configure all environment variables
- [ ] Set up Firebase project with proper security rules
- [ ] Enable required Google Cloud APIs
- [ ] Configure n8n instance for production
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Test all integrations end-to-end
- [ ] Set up backup procedures
- [ ] Configure SSL certificates
- [ ] Set up CDN for static assets

### Monitoring

Implement monitoring for:
- API response times
- Error rates
- Rate limit violations
- Resource usage
- Integration health checks

### Scaling Considerations

- Use Firebase Cloud Functions for heavy processing
- Implement caching for frequently accessed data
- Use background jobs for long-running tasks
- Consider microservices architecture for large deployments

## 📞 Support

For technical support or questions about the integrations:

1. Check the troubleshooting section
2. Review the API documentation
3. Test with debug mode enabled
4. Contact the development team with detailed error logs

---

*This documentation covers all six advanced integrations implemented for the CIS-SAP Event Management Platform. Each integration is designed to work seamlessly with the existing Firebase architecture while providing powerful new capabilities for event management, collaboration, and analytics.*