-- LinkedIn Campaigns Table Schema
-- This table tracks detailed LinkedIn campaign statistics and performance

CREATE TABLE li_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Campaign Basic Info
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_name VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES profiles(client_id),
  
  -- Campaign Status & Dates
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Connection Request Statistics
  connection_requests_sent INTEGER DEFAULT 0,
  connection_requests_pending INTEGER DEFAULT 0,
  connection_requests_accepted INTEGER DEFAULT 0,
  connection_requests_rejected INTEGER DEFAULT 0,
  connection_requests_withdrawn INTEGER DEFAULT 0,
  connection_acceptance_rate DECIMAL(5,2) DEFAULT 0, -- percentage
  
  -- New Connections
  new_connections INTEGER DEFAULT 0,
  new_connections_today INTEGER DEFAULT 0,
  new_connections_this_week INTEGER DEFAULT 0,
  new_connections_this_month INTEGER DEFAULT 0,
  
  -- Messages & Responses
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  first_messages_sent INTEGER DEFAULT 0,
  follow_up_messages_sent INTEGER DEFAULT 0,
  
  -- Response Metrics
  replies_received INTEGER DEFAULT 0,
  positive_replies INTEGER DEFAULT 0,
  negative_replies INTEGER DEFAULT 0,
  neutral_replies INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0, -- percentage
  
  -- Meeting & Conversion Metrics
  meetings_requested INTEGER DEFAULT 0,
  meetings_booked INTEGER DEFAULT 0,
  meetings_completed INTEGER DEFAULT 0,
  meetings_no_show INTEGER DEFAULT 0,
  meeting_conversion_rate DECIMAL(5,2) DEFAULT 0, -- percentage
  
  -- Lead Generation
  leads_generated INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  opportunities_created INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  
  -- Engagement Metrics
  profile_views_generated INTEGER DEFAULT 0,
  content_likes INTEGER DEFAULT 0,
  content_comments INTEGER DEFAULT 0,
  content_shares INTEGER DEFAULT 0,
  
  -- Campaign Performance
  daily_connection_limit INTEGER DEFAULT 50,
  daily_message_limit INTEGER DEFAULT 100,
  weekly_connection_quota INTEGER DEFAULT 350,
  
  -- Advanced Metrics
  average_response_time_hours DECIMAL(8,2), -- hours
  conversation_length_avg DECIMAL(4,1), -- average messages per conversation
  cold_outreach_success_rate DECIMAL(5,2), -- percentage
  warm_intro_success_rate DECIMAL(5,2), -- percentage
  
  -- Revenue Metrics (optional)
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  average_deal_value DECIMAL(12,2) DEFAULT 0,
  cost_per_lead DECIMAL(8,2) DEFAULT 0,
  roi_percentage DECIMAL(8,2) DEFAULT 0,
  
  -- Campaign Settings
  target_audience_size INTEGER,
  sequence_steps INTEGER DEFAULT 0,
  follow_up_delay_days INTEGER DEFAULT 3,
  
  -- Metadata
  last_activity_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  tags TEXT[], -- array of tags for categorization
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_percentages CHECK (
    connection_acceptance_rate >= 0 AND connection_acceptance_rate <= 100 AND
    response_rate >= 0 AND response_rate <= 100 AND
    meeting_conversion_rate >= 0 AND meeting_conversion_rate <= 100 AND
    cold_outreach_success_rate >= 0 AND cold_outreach_success_rate <= 100 AND
    warm_intro_success_rate >= 0 AND warm_intro_success_rate <= 100
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_li_campaigns_campaign_id ON li_campaigns(campaign_id);
CREATE INDEX idx_li_campaigns_client_id ON li_campaigns(client_id);
CREATE INDEX idx_li_campaigns_status ON li_campaigns(status);
CREATE INDEX idx_li_campaigns_created_at ON li_campaigns(created_at);
CREATE INDEX idx_li_campaigns_last_activity ON li_campaigns(last_activity_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_li_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_li_campaigns_updated_at
  BEFORE UPDATE ON li_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_li_campaigns_updated_at();

-- Create function to calculate derived metrics
CREATE OR REPLACE FUNCTION calculate_li_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate connection acceptance rate
  IF NEW.connection_requests_sent > 0 THEN
    NEW.connection_acceptance_rate = (NEW.connection_requests_accepted::DECIMAL / NEW.connection_requests_sent) * 100;
  END IF;
  
  -- Calculate response rate
  IF NEW.messages_sent > 0 THEN
    NEW.response_rate = (NEW.replies_received::DECIMAL / NEW.messages_sent) * 100;
  END IF;
  
  -- Calculate meeting conversion rate
  IF NEW.meetings_requested > 0 THEN
    NEW.meeting_conversion_rate = (NEW.meetings_booked::DECIMAL / NEW.meetings_requested) * 100;
  END IF;
  
  -- Calculate cold outreach success rate
  IF NEW.connection_requests_sent > 0 THEN
    NEW.cold_outreach_success_rate = (NEW.leads_generated::DECIMAL / NEW.connection_requests_sent) * 100;
  END IF;
  
  -- Calculate cost per lead
  IF NEW.leads_generated > 0 AND NEW.revenue_generated > 0 THEN
    NEW.cost_per_lead = NEW.revenue_generated / NEW.leads_generated;
  END IF;
  
  -- Calculate ROI percentage
  IF NEW.cost_per_lead > 0 AND NEW.average_deal_value > 0 THEN
    NEW.roi_percentage = ((NEW.average_deal_value - NEW.cost_per_lead) / NEW.cost_per_lead) * 100;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate metrics
CREATE TRIGGER trigger_calculate_li_campaign_metrics
  BEFORE INSERT OR UPDATE ON li_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION calculate_li_campaign_metrics();

-- Create view for campaign summary statistics
CREATE OR REPLACE VIEW li_campaigns_summary AS
SELECT 
  lc.campaign_id,
  lc.campaign_name,
  lc.client_id,
  lc.status,
  lc.created_at,
  lc.started_at,
  lc.completed_at,
  
  -- Connection metrics
  lc.connection_requests_sent,
  lc.connection_requests_accepted,
  lc.connection_acceptance_rate,
  lc.new_connections,
  
  -- Messaging metrics
  lc.messages_sent,
  lc.replies_received,
  lc.response_rate,
  
  -- Meeting metrics
  lc.meetings_requested,
  lc.meetings_booked,
  lc.meeting_conversion_rate,
  
  -- Lead metrics
  lc.leads_generated,
  lc.qualified_leads,
  lc.opportunities_created,
  lc.deals_closed,
  
  -- Performance metrics
  lc.cold_outreach_success_rate,
  lc.revenue_generated,
  lc.roi_percentage,
  lc.last_activity_at,
  
  -- Campaign info from campaigns table
  c.proposition_id,
  c.audience_filter,
  c.description
  
FROM li_campaigns lc
LEFT JOIN campaigns c ON lc.campaign_id = c.id;

-- Sample data insertion function
CREATE OR REPLACE FUNCTION insert_sample_li_campaign_data()
RETURNS VOID AS $$
DECLARE
  sample_campaign_id UUID;
BEGIN
  -- Get or create a sample campaign
  INSERT INTO campaigns (name, type, status, description, client_id)
  VALUES (
    'LinkedIn Tech Startup Outreach',
    'linkedin',
    'active',
    'Targeting tech startups for SaaS solution',
    (SELECT client_id FROM profiles LIMIT 1)
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO sample_campaign_id;
  
  -- Insert sample LinkedIn campaign data
  INSERT INTO li_campaigns (
    campaign_id,
    campaign_name,
    status,
    connection_requests_sent,
    connection_requests_accepted,
    new_connections,
    messages_sent,
    replies_received,
    positive_replies,
    meetings_requested,
    meetings_booked,
    leads_generated,
    qualified_leads,
    opportunities_created,
    deals_closed,
    revenue_generated,
    target_audience_size,
    sequence_steps,
    daily_connection_limit,
    created_by
  ) VALUES (
    sample_campaign_id,
    'LinkedIn Tech Startup Outreach',
    'active',
    250,
    75,
    65,
    180,
    32,
    18,
    12,
    8,
    15,
    10,
    5,
    2,
    25000.00,
    500,
    4,
    50,
    (SELECT id FROM auth.users LIMIT 1)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE li_campaigns IS 'Detailed LinkedIn campaign tracking with comprehensive metrics for connection requests, responses, meetings, and conversions';
COMMENT ON COLUMN li_campaigns.connection_acceptance_rate IS 'Percentage of connection requests that were accepted';
COMMENT ON COLUMN li_campaigns.response_rate IS 'Percentage of messages that received a response';
COMMENT ON COLUMN li_campaigns.meeting_conversion_rate IS 'Percentage of meeting requests that resulted in booked meetings';
COMMENT ON COLUMN li_campaigns.cold_outreach_success_rate IS 'Percentage of cold outreach attempts that resulted in leads';
COMMENT ON COLUMN li_campaigns.roi_percentage IS 'Return on investment percentage for the campaign';