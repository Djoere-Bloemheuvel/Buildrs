# 📧 Buildrs Communications System

Complete multi-channel communication monitoring and automation system for CRM platforms. Track, log, and automate all customer communications across email, LinkedIn, and phone channels.

## 🎯 Features

### 📧 **Email Monitoring**
- **Gmail & Outlook Integration**: Automatic email sync with OAuth authentication
- **Smart Contact Matching**: Automatically match emails to existing contacts
- **Real-time Sync**: 15-minute automated sync with token refresh
- **Bi-directional Tracking**: Monitor both inbound and outbound emails
- **Rich Metadata**: Track opens, clicks, replies, and attachments

### 💼 **LinkedIn Automation**
- **PhantomBuster Integration**: Automated LinkedIn outreach campaigns
- **Connection Requests**: Send personalized connection requests
- **Message Sequences**: Multi-step LinkedIn messaging campaigns
- **Profile Scraping**: Extract LinkedIn profile data
- **Real-time Status**: Track message delivery and responses

### 📱 **Phone Integration**
- **AirCall Integration**: Complete call tracking and management
- **Call Recording**: Access call recordings and transcripts
- **Real-time Webhooks**: Instant call status updates
- **Call Analytics**: Track call duration, success rates, and outcomes
- **Contact Matching**: Automatically link calls to contacts

### 📊 **Analytics & Insights**
- **Response Rates**: Track performance across all channels
- **Contact Engagement**: Monitor customer interaction patterns
- **Campaign Performance**: Analyze outreach effectiveness
- **Communication Timeline**: Complete interaction history

## 🚀 Quick Start

### 1. Installation

```bash
# Clone and install dependencies
git clone <your-repo>
cd buildrs-core-suite
npm install

# Run the setup script
./scripts/setup-communications.sh
```

### 2. Configuration

Copy `.env.example` to `.env.local` and configure your API keys:

```bash
cp .env.example .env.local
```

Fill in the required configuration:

```env
# Core Configuration
CONVEX_DEPLOYMENT=your-convex-deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key

# Email Integration
VITE_GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-secret
VITE_OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-secret

# LinkedIn Automation (PhantomBuster)
PHANTOMBUSTER_API_KEY=your-phantombuster-key
PHANTOMBUSTER_LINKEDIN_AGENT_ID=your-agent-id

# Phone Integration (AirCall)
AIRCALL_API_ID=your-aircall-id
AIRCALL_API_TOKEN=your-aircall-token
```

### 3. OAuth Setup

#### Gmail OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:8081/oauth/gmail/callback`

#### Outlook OAuth
1. Go to [Azure Portal](https://portal.azure.com)
2. Register a new application
3. Configure Microsoft Graph permissions
4. Add redirect URI: `http://localhost:8081/oauth/outlook/callback`

### 4. PhantomBuster Setup

1. Create [PhantomBuster](https://phantombuster.com) account
2. Create LinkedIn automation agents:
   - LinkedIn Message Sender
   - LinkedIn Connection Requester
3. Get agent IDs from dashboard
4. Configure LinkedIn session cookie

### 5. AirCall Setup

1. Get API credentials from AirCall admin panel
2. Configure webhook URL: `http://localhost:8081/api/webhooks/aircall`
3. Set up phone number for outbound calls

### 6. Start Development

```bash
# Start frontend
npm run dev

# Start Convex backend (in separate terminal)
npx convex dev
```

Open [http://localhost:8081](http://localhost:8081) in your browser.

## 📋 Configuration Guide

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CONVEX_DEPLOYMENT` | Convex deployment name | Yes |
| `VITE_CONVEX_URL` | Convex backend URL | Yes |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk authentication | Yes |
| `CLERK_SECRET_KEY` | Clerk backend secret | Yes |

### Email Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GMAIL_CLIENT_ID` | Gmail OAuth client ID | For Gmail |
| `GMAIL_CLIENT_SECRET` | Gmail OAuth secret | For Gmail |
| `VITE_OUTLOOK_CLIENT_ID` | Outlook OAuth client ID | For Outlook |
| `OUTLOOK_CLIENT_SECRET` | Outlook OAuth secret | For Outlook |

### LinkedIn Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `PHANTOMBUSTER_API_KEY` | PhantomBuster API key | For LinkedIn |
| `PHANTOMBUSTER_LINKEDIN_AGENT_ID` | LinkedIn messaging agent | For LinkedIn |
| `PHANTOMBUSTER_LINKEDIN_SESSION_COOKIE` | LinkedIn session | For LinkedIn |

### Phone Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `AIRCALL_API_ID` | AirCall API ID | For Phone |
| `AIRCALL_API_TOKEN` | AirCall API token | For Phone |
| `AIRCALL_NUMBER_ID` | AirCall phone number | For Phone |

## 🏗️ System Architecture

### Database Schema

```
📊 Communications Table
├── clientId (Multi-tenant isolation)
├── contactId (Link to contact)
├── type (email, linkedin, phone, meeting)
├── direction (inbound, outbound)
├── status (sent, delivered, opened, clicked, replied, failed)
├── content (Message content)
├── metadata (Provider-specific data)
└── timestamp (Communication time)

📧 Email Accounts Table
├── clientId (Multi-tenant isolation)
├── email (Account email address)
├── provider (gmail, outlook)
├── accessToken (OAuth token)
├── refreshToken (Token refresh)
├── isActive (Monitoring enabled)
└── settings (Sync preferences)
```

### API Integrations

```
🔌 Gmail API
├── OAuth 2.0 authentication
├── Message sync and parsing
├── Real-time push notifications
└── Automatic token refresh

🔌 Microsoft Graph API
├── OAuth 2.0 authentication
├── Delta sync for efficiency
├── Message processing
└── Webhook notifications

🔌 PhantomBuster API
├── LinkedIn agent management
├── Campaign automation
├── Status monitoring
└── Result processing

🔌 AirCall API
├── Call management
├── Recording access
├── Real-time webhooks
└── Contact integration
```

## 🔄 Automated Workflows

### Email Sync (Every 15 minutes)
1. Check all active email accounts
2. Refresh expired OAuth tokens
3. Fetch new messages since last sync
4. Parse and standardize message format
5. Match emails to existing contacts
6. Log communications with metadata
7. Update sync status and statistics

### LinkedIn Automation
1. Launch PhantomBuster agents
2. Monitor agent execution
3. Process webhook status updates
4. Log communication attempts
5. Track success/failure rates
6. Update contact engagement scores

### Phone Call Tracking
1. Receive AirCall webhooks
2. Match phone numbers to contacts
3. Log call events and metadata
4. Track call recordings
5. Update communication timeline
6. Generate call analytics

## 📊 Monitoring & Analytics

### Real-time Dashboards
- Communication volume trends
- Response rate analytics
- Channel performance comparison
- Contact engagement scores
- Campaign effectiveness metrics

### Automated Reports
- Daily sync status reports
- Weekly performance summaries
- Monthly analytics dashboards
- Error tracking and alerts
- Usage statistics and trends

## 🔧 Troubleshooting

### Common Issues

#### Email Sync Not Working
```bash
# Check OAuth tokens
npx convex logs | grep "token"

# Manually refresh tokens
npx convex run emailAccounts:refreshExpiredTokens

# Check account status
npx convex dashboard
```

#### LinkedIn Automation Failing
```bash
# Verify PhantomBuster API key
curl -H "X-Phantombuster-Key: YOUR_KEY" https://api.phantombuster.com/api/v2/agents/fetch-all

# Check agent status
npx convex logs | grep "phantombuster"
```

#### AirCall Webhooks Not Received
```bash
# Test webhook endpoint
curl -X POST http://localhost:8081/api/webhooks/aircall -d '{"test": true}'

# Check webhook configuration in AirCall admin
```

### Debug Mode

Enable debug logging in `.env.local`:

```env
DEBUG=true
VITE_DEBUG=true
```

## 🚀 Production Deployment

### 1. Environment Setup

Update production URLs in `.env.local`:

```env
NODE_ENV=production
VITE_APP_URL=https://your-domain.com
APP_URL=https://your-domain.com
VITE_WEBHOOK_BASE_URL=https://your-domain.com/api/webhooks
```

### 2. OAuth Redirect URIs

Update OAuth redirect URIs:
- Gmail: `https://your-domain.com/oauth/gmail/callback`
- Outlook: `https://your-domain.com/oauth/outlook/callback`

### 3. Webhook URLs

Update webhook URLs in service providers:
- PhantomBuster: `https://your-domain.com/api/webhooks/phantombuster`
- AirCall: `https://your-domain.com/api/webhooks/aircall`
- Instantly: `https://your-domain.com/api/webhooks/instantly`

### 4. Security Considerations

- Use HTTPS for all endpoints
- Implement webhook signature verification
- Rotate API keys regularly
- Monitor for unusual activity
- Set up proper CORS policies

## 📈 Performance Optimization

### Email Sync Optimization
- Adjust sync frequency per account
- Implement incremental sync
- Use Gmail push notifications
- Optimize database queries

### LinkedIn Rate Limiting
- Implement proper delays between requests
- Monitor PhantomBuster usage limits
- Queue campaigns for optimal timing
- Track and respect LinkedIn limits

### Database Performance
- Use proper indexing on communications table
- Implement data archiving for old communications
- Optimize queries with filters
- Monitor Convex function performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is proprietary software for Buildrs CRM platform.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review Convex logs for errors
- Contact the development team
- Create issues for bugs or feature requests

---

**Built with ❤️ by the Buildrs team**