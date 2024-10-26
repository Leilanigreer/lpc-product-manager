-- Disable triggers temporarily to avoid foreign key constraint issues
SET session_replication_role = 'replica';

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public."_EmbroideryThreadColorToTag" CASCADE;
DROP TABLE IF EXISTS public."_LeatherColorToTag" CASCADE;
DROP TABLE IF EXISTS public."_StitchingThreadColorToTag" CASCADE;
DROP TABLE IF EXISTS public."ColorTag" CASCADE;
DROP TABLE IF EXISTS public."EmbroideryThread" CASCADE;
DROP TABLE IF EXISTS public."StitchingThread" CASCADE;
DROP TABLE IF EXISTS public."Font" CASCADE;
DROP TABLE IF EXISTS public."LeatherColor" CASCADE;
DROP TABLE IF EXISTS public."Shape" CASCADE;
DROP TABLE IF EXISTS public."ShopifyCollections" CASCADE;
DROP TABLE IF EXISTS public."ProductPrice" CASCADE;
DROP TABLE IF EXISTS public."Session" CASCADE;
DROP TABLE IF EXISTS public."Style" CASCADE;
DROP TABLE IF EXISTS public."_prisma_migrations" CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Now rerun prisma migrate