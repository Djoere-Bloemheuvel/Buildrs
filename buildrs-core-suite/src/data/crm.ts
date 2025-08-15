
import { supabase } from '@/integrations/supabase/client';

// ===============
// COMPANIES
// ===============

export async function fetchCompanies(search?: string) {
  let query = supabase
    .from('companies')
    .select('id,name,domain,website,industry_label,subindustry_label,city,state,country,company_size,created_at')
    .order('name');

  if (search) {
    query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%,industry_label.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createCompany(input: {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  client_id: string;
}) {
  const { data, error } = await supabase
    .from('companies')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompany(id: string, updates: Partial<{
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
}>) {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCompany(id: string) {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===============
// CONTACTS
// ===============

export async function fetchContacts(searchTerm?: string, companyId?: string, clientId?: string) {
  let query = supabase
    .from('contacts')
    .select(`
      *,
      companies (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (searchTerm) {
    query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
  }

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Enriched contacts from canonical view v_contacts_enriched
export async function fetchEnrichedContacts(
  search: string = '', 
  page: number = 1, 
  pageSize: number = 20, 
  clientId?: string, 
  sortBy: string = 'created_at', 
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  // base query
  let query = supabase
    .from('v_contacts_enriched' as any)
    .select('*', { count: 'exact' })
    .range(from, to);

  if (clientId) query = query.eq('client_id', clientId);
  if (search) {
    query = query.or([
      `first_name.ilike.%${search}%`,
      `last_name.ilike.%${search}%`,
      `email.ilike.%${search}%`,
      `company_name.ilike.%${search}%`,
      `domain.ilike.%${search}%`,
    ].join(','));
  }

  // try order, but if the column is missing in the view, fallback without order
  try {
    if (sortBy) query = query.order(sortBy as any, { ascending: sortOrder === 'asc' });
    const { data, error, count } = await query as any;
    if (error) throw error;
    return { data: data || [], count: count ?? 0 };
  } catch {
    const { data, error, count } = await supabase
      .from('v_contacts_enriched' as any)
      .select('*', { count: 'exact' })
      .range(from, to)
      .maybeSingle?.();
    if (error) throw error as any;
    // .maybeSingle() returns single; but we want array. If undefined, coerce to []
    const rows = Array.isArray((data as any)) ? (data as any) : (data ? [data] : []);
    return { data: rows, count: count ?? rows.length };
  }
}

export async function fetchContactById(id: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      companies (
        id,
        name,
        industry,
        website
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createContact(input: {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title?: string;
  company_id?: string;
  client_id: string;
}) {
  const { data, error } = await supabase
    .from('contacts')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateContact(id: string, updates: Partial<{
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
  company_id: string;
}>) {
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContact(id: string) {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===============
// CLIENTS
// ===============

export async function fetchClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('company');
  if (error) throw error;
  return data || [];
}

// ===============
// PIPELINES
// ===============

export async function fetchPipelines() {
  const { data, error } = await supabase
    .from('pipelines')
    .select('id,name,is_default')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createPipeline(input: {
  name: string;
  proposition_id: string;
  client_id: string;
  is_active?: boolean;
  is_default?: boolean;
}) {
  const { data, error } = await supabase
    .from('pipelines')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updatePipeline(id: string, updates: {
  name?: string;
  proposition_id?: string;
  color?: string;
  is_active?: boolean;
  is_default?: boolean;
}) {
  const { data, error } = await supabase
    .from('pipelines')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deletePipeline(id: string) {
  const { error } = await supabase
    .from('pipelines')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===============
// STAGES
// ===============

export async function fetchStagesByPipeline(pipelineId: string) {
  const { data, error } = await supabase
    .from('stages')
    .select('id,name,position,pipeline_id,default_probability')
    .eq('pipeline_id', pipelineId)
    .order('position');
  if (error) throw error;
  return data || [];
}

export async function createStage(input: {
  name: string;
  position: number;
  pipeline_id: string;
  default_probability?: number;
}) {
  const { data, error } = await supabase
    .from('stages')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function createStagesBulk(
  pipelineId: string,
  stages: { name: string; position: number; default_probability?: number }[]
) {
  if (!stages.length) return [] as any[];
  const payload = stages.map(s => ({ ...s, pipeline_id: pipelineId }));
  const { data, error } = await supabase
    .from('stages')
    .insert(payload)
    .select('id,name,position,pipeline_id,default_probability');
  if (error) throw error;
  return data || [];
}

export async function updateStage(id: string, updates: {
  name?: string;
  position?: number;
}) {
  const { data, error } = await supabase
    .from('stages')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStage(id: string) {
  const { error } = await supabase
    .from('stages')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===============
// DEALS
// ===============

export async function fetchDealsByPipeline(pipelineId: string) {
  const { data, error } = await supabase
    .from('deals')
    .select(`
      id,
      title,
      value,
      status,
      stage_id,
      confidence,
      companies (
        name
      )
    `)
    .eq('pipeline_id', pipelineId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createDeal(input: any) {
  console.log('Creating deal with input:', input);
  
  // Debug auth status voor troubleshooting
  try {
    const { data: authStatus } = await supabase.rpc('debug_auth_status');
    console.log('Auth status bij deal creation:', authStatus);
  } catch (error) {
    console.error('Kon auth status niet ophalen:', error);
  }
  
  // Zorg ervoor dat status expliciet wordt meegegeven
  const dealData = {
    ...input,
    status: input.status || 'open', // Expliciet status toevoegen als fallback
  };
  
  // Verwijder client_id uit dealData omdat die door de trigger wordt ingesteld
  delete dealData.client_id;
  
  console.log('Deal data to insert (zonder client_id):', dealData);
  
  const { data, error } = await supabase
    .from('deals')
    .insert(dealData)
    .select('*')
    .single();
    
  if (error) {
    console.error('Deal creation error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }
  
  console.log('Deal created successfully:', data);
  return data;
}

export async function moveDealToStage(dealId: string, stageId: string, newConfidence?: number) {
  const updates: Record<string, any> = { stage_id: stageId };
  if (typeof newConfidence === 'number') updates.confidence = newConfidence;
  const { error } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', dealId);
  if (error) throw error;
  // No row return needed for UI; optimistic update handles UX
  return { id: dealId, stage_id: stageId, confidence: newConfidence } as any;
}

// ===============
// PROPOSITIONS
// ===============

export async function fetchPropositions(search?: string, clientId?: string) {
  const { data, error } = await supabase
    .from('propositions')
    .select(`
      id,
      name,
      description,
      offer_type,
      target_audience,
      unique_value,
      ai_summary,
      ai_personalization_prompt,
      pain_triggers,
      problems_solved,
      created_at
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  let filteredData = data || [];
  
  if (clientId) {
    // Note: client_id filtering would need to be added to the table structure
    // For now, we'll filter client-side if needed
  }
  
  if (search) {
    filteredData = filteredData.filter(item => 
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.target_audience?.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  return filteredData;
}

export async function createProposition(input: any) {
  const { data, error } = await supabase
    .from('propositions')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateProposition(id: string, patch: any) {
  const { data, error } = await supabase
    .from('propositions')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProposition(id: string) {
  const { error } = await supabase
    .from('propositions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===============
// FILTER OPTIONS - Get real values from database
// ===============

export async function fetchFilterOptions() {
  try {
    // Get unique function groups
    const { data: functionGroups, error: fgError } = await supabase
      .from('v_contacts_enriched' as any)
      .select('function_group')
      .not('function_group', 'is', null)
      .order('function_group');
    
    if (fgError) console.error('Error fetching function groups:', fgError);

    // Get unique industry labels
    const { data: industryLabels, error: ilError } = await supabase
      .from('v_contacts_enriched' as any)
      .select('industry_label')
      .not('industry_label', 'is', null)
      .order('industry_label');
    
    if (ilError) console.error('Error fetching industry labels:', ilError);

    // Get unique subindustry labels
    const { data: subindustryLabels, error: silError } = await supabase
      .from('v_contacts_enriched' as any)
      .select('subindustry_label')
      .not('subindustry_label', 'is', null)
      .order('subindustry_label');
    
    if (silError) console.error('Error fetching subindustry labels:', silError);

    // Get unique locations (cities and countries)
    const { data: locationData, error: locError } = await supabase
      .from('v_contacts_enriched' as any)
      .select('city, state, country, company_city, company_state, company_country, contact_city, contact_state, contact_country');
    
    if (locError) console.error('Error fetching locations:', locError);

    // Get employee count range
    const { data: employeeRange, error: erError } = await supabase
      .from('v_contacts_enriched' as any)
      .select('company_size, employee_count')
      .not('company_size', 'is', null)
      .not('employee_count', 'is', null);
    
    if (erError) console.error('Error fetching employee range:', erError);

    // Process unique values
    const uniqueFunctionGroups = [...new Set(functionGroups?.map(item => item.function_group).filter(Boolean))];
    const uniqueIndustryLabels = [...new Set(industryLabels?.map(item => item.industry_label).filter(Boolean))];
    const uniqueSubindustryLabels = [...new Set(subindustryLabels?.map(item => item.subindustry_label).filter(Boolean))];
    
    // Process location data - combine cities and countries into meaningful location strings
    const locationSet = new Set<string>();
    locationData?.forEach(item => {
      // Process company locations
      if (item.company_city && item.company_country) {
        locationSet.add(`${item.company_city}, ${item.company_country}`);
      }
      if (item.company_country) {
        locationSet.add(item.company_country);
      }
      
      // Process contact locations as fallback
      if (item.contact_city && item.contact_country) {
        locationSet.add(`${item.contact_city}, ${item.contact_country}`);
      }
      if (item.contact_country) {
        locationSet.add(item.contact_country);
      }
      
      // Process general location fields
      if (item.city && item.country) {
        locationSet.add(`${item.city}, ${item.country}`);
      }
      if (item.country) {
        locationSet.add(item.country);
      }
    });
    
    const uniqueLocations = [...locationSet].filter(Boolean).sort();
    
    // Calculate employee count range
    const allSizes = employeeRange?.map(item => item.company_size || item.employee_count).filter(Boolean) || [];
    const minEmployees = allSizes.length > 0 ? Math.min(...allSizes) : 1;
    const maxEmployees = allSizes.length > 0 ? Math.min(Math.max(...allSizes), 1000) : 1000;

    return {
      functionGroups: uniqueFunctionGroups,
      industryLabels: uniqueIndustryLabels,
      subindustryLabels: uniqueSubindustryLabels,
      locations: uniqueLocations,
      employeeRange: { min: minEmployees, max: maxEmployees }
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      functionGroups: [],
      industryLabels: [],
      subindustryLabels: [],
      locations: [],
      employeeRange: { min: 1, max: 1000 }
    };
  }
}

// ===============
// ACTIVITIES - PLACEHOLDER (table doesn't exist yet)
// ===============

export async function fetchActivities(search?: string) {
  // Return empty array since activities table doesn't exist yet
  console.log('Activities table not implemented yet', search);
  return [];
}

export async function createActivity(input: {
  type: string;
  subject: string;
  description?: string;
  scheduled_at?: string;
  contact_id?: string;
  company_id?: string;
  client_id: string;
}) {
  // Placeholder implementation
  console.log('Creating activity:', input);
  return { id: 'temp-id', ...input };
}

// ===============
// STAGE SWAPPING
// ===============

export async function swapStagePositions(stageA: { id: string; position: number }, stageB: { id: string; position: number }) {
  // Swap positions
  const tempPosition = stageA.position;
  stageA.position = stageB.position;
  stageB.position = tempPosition;
  
  // Update both stages
  await updateStage(stageA.id, { position: stageA.position });
  await updateStage(stageB.id, { position: stageB.position });
}
