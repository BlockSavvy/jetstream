-- This function allows executing SQL statements from the migration script
-- It requires superuser privileges to create and should be used with caution

CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$; 