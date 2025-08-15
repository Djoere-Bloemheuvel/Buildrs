
-- Verbeter de RLS policy voor deals om beter te filteren op client_id
DROP POLICY IF EXISTS "Users can manage deals for their clients" ON public.deals;

CREATE POLICY "Users can manage deals for their clients" 
ON public.deals 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.client_id = deals.client_id
    AND p.role IN ('admin', 'user')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.client_id = deals.client_id
    AND p.role IN ('admin', 'user')
  )
);

-- Voeg een trigger toe om automatisch client_id in te stellen voor deals
CREATE OR REPLACE FUNCTION public.set_deal_client_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Als client_id al is ingesteld, doe niets
  IF NEW.client_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Haal client_id op van de huidige gebruiker
  SELECT p.client_id INTO NEW.client_id
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;

  -- Als geen client_id gevonden, gooi error
  IF NEW.client_id IS NULL THEN
    RAISE EXCEPTION 'Geen client_id gevonden voor gebruiker %', auth.uid();
  END IF;

  RETURN NEW;
END;
$function$;

-- Maak de trigger aan
DROP TRIGGER IF EXISTS trigger_set_deal_client_id ON public.deals;
CREATE TRIGGER trigger_set_deal_client_id
  BEFORE INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_deal_client_id();

-- Zorg ervoor dat pipeline_id en stage_id NOT NULL zijn
ALTER TABLE public.deals 
ALTER COLUMN pipeline_id SET NOT NULL,
ALTER COLUMN stage_id SET NOT NULL;

-- Voeg een debug functie toe om auth status te controleren
CREATE OR REPLACE FUNCTION public.debug_auth_status()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'current_user', current_user,
    'session_user', session_user
  );
$$;
