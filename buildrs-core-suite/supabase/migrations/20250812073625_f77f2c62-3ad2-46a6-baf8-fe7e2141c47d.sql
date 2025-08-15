
-- Update RLS policy voor deals tabel om client-based access toe te staan
DROP POLICY IF EXISTS "Users can manage deals for their clients" ON deals;

CREATE POLICY "Users can manage deals for their clients" ON deals
FOR ALL USING (
  client_id = current_client_id()
) WITH CHECK (
  client_id = current_client_id()
);

-- Zorg ervoor dat de status field een default waarde heeft
ALTER TABLE deals ALTER COLUMN status SET DEFAULT 'open';

-- Voeg een constraint toe om te valideren dat stage_id bij de juiste pipeline hoort
-- (Dit is optioneel maar helpt bij data integriteit)
ALTER TABLE deals 
ADD CONSTRAINT deals_stage_pipeline_check 
CHECK (
  pipeline_id IS NULL OR 
  stage_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM stages s 
    WHERE s.id = stage_id AND s.pipeline_id = deals.pipeline_id
  )
);
