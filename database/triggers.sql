-- Trigger function to insert a row into public.users and public.user_stats
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
    extracted_username text;
BEGIN
    -- Extract username from raw_user_meta_data if it exists, otherwise generate a fallback
    extracted_username := COALESCE(
        new.raw_user_meta_data->>'username',
        split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 6)
    );

    -- 1. Insert into our custom public.users table
    INSERT INTO public.users (id, username, email, password_hash, is_public)
    VALUES (
        new.id,
        extracted_username,
        new.email,
        -- Supabase auth handles password hashing, so we just store a placeholder or rely on Supabase.
        -- For the schema's sake, we can insert a dummy value since login happens via Supabase Auth.
        'handled_by_supabase_auth',
        true
    );

    -- 2. Initialize the user_stats row
    INSERT INTO public.user_stats (user_id)
    VALUES (new.id);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
