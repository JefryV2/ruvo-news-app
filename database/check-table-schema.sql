-- Quick check of user_signals table schema
-- Run this in Supabase SQL Editor to see the current structure

SELECT 
    column_name, 
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_signals'
ORDER BY ordinal_position;

-- Expected output:
-- column_name  | data_type                   | is_nullable
-- -------------|-----------------------------|--------------
-- id           | uuid                        | NO
-- user_id      | uuid                        | NO  ← Should be UUID
-- signal_id    | text                        | NO  ← Should be TEXT
-- liked        | boolean                     | YES
-- saved        | boolean                     | YES
-- created_at   | timestamp with time zone    | YES
-- updated_at   | timestamp with time zone    | YES
