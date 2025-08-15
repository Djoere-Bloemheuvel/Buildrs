
-- Fix RLS policy voor activity_log tabel
DROP POLICY IF EXISTS "Users can view activity logs for their clients" ON public.activity_log;

-- Create comprehensive RLS policies voor activity_log
CREATE POLICY "Users can manage activity logs for their clients" 
ON public.activity_log 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.client_id = activity_log.client_id
    AND p.role IN ('admin', 'user')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.client_id = activity_log.client_id
    AND p.role IN ('admin', 'user')
  )
);

-- Update log_deal_created function om client_id correct in te stellen
CREATE OR REPLACE FUNCTION public.log_deal_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.activity_log (
    deal_id,
    contact_id,
    company_id,
    client_id,
    user_id,
    action,
    description
  ) VALUES (
    NEW.id,
    NEW.contact_id,
    NEW.company_id,
    NEW.client_id,  -- client_id is nu beschikbaar via de trigger
    NEW.owner_id,
    'deal_created',
    'Nieuwe deal aangemaakt: ' || NEW.title
  );
  RETURN NEW;
END;
$function$;

-- Zorg ervoor dat de trigger AFTER INSERT is (niet BEFORE) zodat client_id al is ingesteld
DROP TRIGGER IF EXISTS trigger_log_deal_created ON public.deals;
CREATE TRIGGER trigger_log_deal_created
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deal_created();
