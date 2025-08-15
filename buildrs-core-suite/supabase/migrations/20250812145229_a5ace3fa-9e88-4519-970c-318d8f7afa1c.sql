
-- Add missing columns to tasks table for project management
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES project_groups(id);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Create project_fields table for custom columns
CREATE TABLE IF NOT EXISTS public.project_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL DEFAULT current_client_id(),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, key)
);

-- Create project_groups table for task grouping
CREATE TABLE IF NOT EXISTS public.project_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL DEFAULT current_client_id(),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#9CA3AF',
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(project_id, key)
);

-- Create project_field_values table for storing custom field values
CREATE TABLE IF NOT EXISTS public.project_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES project_fields(id) ON DELETE CASCADE,
  client_id UUID NOT NULL DEFAULT current_client_id(),
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, field_id)
);

-- Create project_views table for saving view configurations
CREATE TABLE IF NOT EXISTS public.project_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL DEFAULT current_client_id(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'table',
  is_default BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.project_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_fields
CREATE POLICY "project_fields_select" ON public.project_fields FOR SELECT USING (client_id = current_client_id());
CREATE POLICY "project_fields_write" ON public.project_fields FOR ALL USING (client_id = current_client_id()) WITH CHECK (client_id = current_client_id());

-- Create RLS policies for project_groups
CREATE POLICY "project_groups_select" ON public.project_groups FOR SELECT USING (client_id = current_client_id());
CREATE POLICY "project_groups_write" ON public.project_groups FOR ALL USING (client_id = current_client_id()) WITH CHECK (client_id = current_client_id());

-- Create RLS policies for project_field_values
CREATE POLICY "project_field_values_select" ON public.project_field_values FOR SELECT USING (client_id = current_client_id());
CREATE POLICY "project_field_values_write" ON public.project_field_values FOR ALL USING (client_id = current_client_id()) WITH CHECK (client_id = current_client_id());

-- Create RLS policies for project_views
CREATE POLICY "project_views_select" ON public.project_views FOR SELECT USING (client_id = current_client_id());
CREATE POLICY "project_views_write" ON public.project_views FOR ALL USING (client_id = current_client_id()) WITH CHECK (client_id = current_client_id());

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_fields_updated_at BEFORE UPDATE ON public.project_fields FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_project_field_values_updated_at BEFORE UPDATE ON public.project_field_values FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default groups for existing projects
INSERT INTO public.project_groups (project_id, client_id, key, label, color, order_index)
SELECT DISTINCT p.id, p.client_id, 'this_month', 'This Month', '#0073EA', 0
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_groups pg 
  WHERE pg.project_id = p.id AND pg.key = 'this_month'
);

INSERT INTO public.project_groups (project_id, client_id, key, label, color, order_index)
SELECT DISTINCT p.id, p.client_id, 'next_month', 'Next Month', '#00D647', 1
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_groups pg 
  WHERE pg.project_id = p.id AND pg.key = 'next_month'
);
