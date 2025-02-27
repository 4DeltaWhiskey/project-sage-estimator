
-- Create a stored procedure to upsert user_azure_settings
CREATE OR REPLACE FUNCTION public.upsert_azure_settings(
  p_user_id UUID,
  p_organization VARCHAR,
  p_last_project VARCHAR
) RETURNS void AS $$
BEGIN
  INSERT INTO public.user_azure_settings (user_id, organization, last_project)
  VALUES (p_user_id, p_organization, p_last_project)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    organization = p_organization,
    last_project = p_last_project,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
