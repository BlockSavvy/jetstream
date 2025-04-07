-- Function to retrieve foreign key constraints
CREATE OR REPLACE FUNCTION get_foreign_keys()
RETURNS TABLE (
    constraint_name text,
    source_table text,
    source_column text,
    target_table text,
    target_column text
) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT
        tc.constraint_name::text,
        tc.table_name::text as source_table,
        kcu.column_name::text as source_column,
        ccu.table_name::text as target_table,
        ccu.column_name::text as target_column
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';
$$; 