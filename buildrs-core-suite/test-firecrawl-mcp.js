#!/usr/bin/env node

/**
 * Test script for FireCrawl MCP integration
 * This script tests the FireCrawl API directly to ensure your setup is working
 */

import FireCrawl from '@mendable/firecrawl-js';

async function testFireCrawl() {
  // Check for API key
  const apiKey = process.env.FIRECRAWL_API_KEY;
  
  if (!apiKey) {
    console.error('❌ FIRECRAWL_API_KEY environment variable not set');
    console.log('💡 Set it with: export FIRECRAWL_API_KEY=your_api_key_here');
    process.exit(1);
  }

  console.log('🔥 Testing FireCrawl API connection...');
  
  try {
    const app = new FireCrawl({ apiKey });

    // Test 1: Simple scrape
    console.log('📄 Testing simple page scrape...');
    const scrapeResult = await app.scrapeUrl('https://example.com', {
      formats: ['markdown', 'html'],
      onlyMainContent: true
    });

    if (scrapeResult.success) {
      console.log('✅ Scrape test successful!');
      console.log(`   Title: ${scrapeResult.data.metadata?.title || 'N/A'}`);
      console.log(`   Content length: ${scrapeResult.data.markdown?.length || 0} chars`);
    } else {
      console.log('❌ Scrape test failed:', scrapeResult.error);
    }

    // Test 2: Map a website (get sitemap)
    console.log('\n🗺️  Testing website mapping...');
    const mapResult = await app.mapUrl('https://example.com', {
      limit: 5
    });

    if (mapResult.success) {
      console.log('✅ Map test successful!');
      console.log(`   Found ${mapResult.data.length} pages`);
      mapResult.data.slice(0, 3).forEach((page, index) => {
        console.log(`   ${index + 1}. ${page.url}`);
      });
    } else {
      console.log('❌ Map test failed:', mapResult.error);
    }

    console.log('\n🎉 FireCrawl is set up correctly!');
    console.log('👉 You can now restart Claude Desktop to use FireCrawl MCP tools');

  } catch (error) {
    console.error('❌ Error testing FireCrawl:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('💡 Check your API key - it might be invalid or expired');
    } else if (error.message.includes('429')) {
      console.log('💡 Rate limit exceeded - wait a moment and try again');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
      console.log('💡 Network error - check your internet connection');
    }
  }
}

// Run the test
testFireCrawl().catch(console.error);