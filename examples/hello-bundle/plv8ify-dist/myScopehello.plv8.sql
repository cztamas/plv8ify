DROP FUNCTION IF EXISTS myScopehello();
CREATE OR REPLACE FUNCTION myScopehello() RETURNS text AS $plv8ify$
if (globalThis.myScope === undefined) plv8.execute('SELECT myScope_init();');
return hello()

$plv8ify$ LANGUAGE plv8 IMMUTABLE STRICT;