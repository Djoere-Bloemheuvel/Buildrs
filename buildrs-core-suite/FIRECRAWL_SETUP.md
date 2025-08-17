# 🔥 FireCrawl MCP Integration Setup

This document outlines the complete setup and usage of FireCrawl MCP (Model Context Protocol) integration with your CRM system.

## ✅ What's Been Set Up

### 1. **MCP Server Configuration**
- ✅ FireCrawl MCP server installed globally
- ✅ Claude Desktop configuration created
- ✅ API key configured: `fc-cb591017790341b1aea9f2d3b1a79b3a`
- ✅ Configuration file: `~/Library/Application Support/Claude/claude_desktop_config.json`

### 2. **Project Integration**
- ✅ FireCrawl SDK installed: `@mendable/firecrawl-js`
- ✅ TypeScript integration library created: `src/lib/firecrawl.ts`
- ✅ Convex backend functions: `convex/firecrawl.ts`
- ✅ React components: `src/components/firecrawl/WebEnrichmentButton.tsx`

### 3. **CRM Features**
- ✅ Company enrichment from websites
- ✅ Contact enrichment from LinkedIn/company data
- ✅ Website insights and research
- ✅ Bulk enrichment capabilities
- ✅ Activity logging for all enrichment actions

## 🚀 How to Use

### **In Claude Desktop (MCP Tools)**

After restarting Claude Desktop, you'll have access to these FireCrawl tools:

1. **`firecrawl_scrape`** - Scrape a single URL
   ```
   Please scrape https://example.com and extract the main content
   ```

2. **`firecrawl_crawl`** - Crawl an entire website
   ```
   Crawl https://example.com and get content from up to 10 pages
   ```

3. **`firecrawl_map`** - Map website structure
   ```
   Map the sitemap of https://example.com
   ```

4. **`firecrawl_search`** - Search with web scraping
   ```
   Search for "AI startups" and scrape the top 5 results
   ```

### **In Your CRM Application**

#### **Company Enrichment**
```tsx
import { WebEnrichmentButton } from '@/components/firecrawl/WebEnrichmentButton';

// In your company detail view
<WebEnrichmentButton
  type="company"
  entityId={company._id}
  clientId={clientId}
  websiteUrl={company.website}
  userId={user.id}
/>
```

#### **Contact Enrichment**
```tsx
<WebEnrichmentButton
  type="contact"
  entityId={contact._id}
  clientId={clientId}
  profileUrl={contact.linkedinUrl}
  websiteUrl={contact.company?.website}
  userId={user.id}
/>
```

#### **Bulk Enrichment**
```tsx
import { BulkEnrichmentButton } from '@/components/firecrawl/WebEnrichmentButton';

<BulkEnrichmentButton
  type="company"
  entities={companies.map(c => ({
    id: c._id,
    name: c.name,
    websiteUrl: c.website
  }))}
  clientId={clientId}
  userId={user.id}
  onComplete={(results) => {
    console.log('Bulk enrichment completed:', results);
  }}
/>
```

#### **Direct API Usage**
```tsx
import { scrapeUrl, extractCompanyInfo } from '@/lib/firecrawl';

// Scrape a single page
const result = await scrapeUrl('https://example.com', {
  onlyMainContent: true,
  includeHtml: false
});

// Extract company information
const companyInfo = await extractCompanyInfo('https://company.com');
```

## 🔧 Configuration

### **Environment Variables**

Add to your `.env.local`:
```bash
VITE_FIRECRAWL_API_KEY=fc-cb591017790341b1aea9f2d3b1a79b3a
```

### **Claude Desktop Configuration**

Located at: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-cb591017790341b1aea9f2d3b1a79b3a"
      }
    }
  }
}
```

## 🎯 Use Cases

### **1. Lead Research**
- Automatically scrape prospect websites to gather company information
- Extract key personnel and contact details
- Identify technologies and competitive intelligence
- Get recent news and updates

### **2. Data Enrichment**
- Enhance existing company records with missing information
- Update contact profiles with current job titles and responsibilities
- Fill in industry, size, and location data
- Add social media and contact information

### **3. Market Intelligence**
- Monitor competitor websites for changes
- Track industry trends and news
- Analyze company positioning and messaging
- Identify potential partnership opportunities

### **4. Lead Qualification**
- Assess company fit based on website content
- Identify decision makers and their roles
- Understand company needs and pain points
- Score leads based on extracted data

## 📊 Data Extracted

### **Company Information**
- Company name and description
- Industry and market focus
- Company size and employee count
- Location and office addresses
- Technologies used
- Social media profiles
- Contact information
- Key features and services

### **Contact Information**
- Job titles and responsibilities
- Seniority and function groups
- Professional background
- Skills and expertise
- Education and experience
- Bio and summary information

## 🔒 Security & Privacy

- API key is securely stored in Claude Desktop configuration
- All web scraping respects robots.txt and rate limits
- Data is processed locally and stored in your Convex database
- Activity logging tracks all enrichment actions for audit purposes

## 🚨 Important Notes

### **Rate Limits**
- FireCrawl has API rate limits based on your plan
- The integration includes automatic delays for bulk operations
- Monitor your usage in the FireCrawl dashboard

### **Legal Compliance**
- Only scrape publicly available information
- Respect website terms of service
- Follow data protection regulations (GDPR, etc.)
- Use enriched data responsibly

### **Restart Required**
- After configuration changes, restart Claude Desktop
- The MCP server will be available after restart
- Test the connection with a simple scrape command

## 🧪 Testing

Run the test script to verify your setup:
```bash
cd /path/to/your/project
export FIRECRAWL_API_KEY="fc-cb591017790341b1aea9f2d3b1a79b3a"
node test-firecrawl-mcp.js
```

## 📞 Support

### **FireCrawl Issues**
- FireCrawl Documentation: https://docs.firecrawl.dev
- FireCrawl Support: https://firecrawl.dev/support

### **MCP Issues**
- MCP Documentation: https://modelcontextprotocol.io
- Claude Desktop MCP Guide: https://docs.anthropic.com/claude/docs/desktop-mcp

### **Integration Issues**
- Check the activity logs in your CRM for error details
- Verify API key validity in the FireCrawl dashboard
- Ensure proper permissions in Claude Desktop configuration

---

🎉 **Your FireCrawl MCP integration is now ready to use!**

Restart Claude Desktop and start enriching your CRM data with powerful web scraping capabilities.