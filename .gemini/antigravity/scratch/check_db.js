
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pqdqumgplcwmzctcmxzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZHF1bWdwbGN3bXpjdGNteHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODQzMTgsImV4cCI6MjA5Mjk2MDMxOH0.SEZ2VCaS5YDUG7TazFB5E3T2XYP19dC4ciqeoQcEG-M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAndAddColumn() {
    console.log('Checking table structure...');
    
    // There isn't a direct way to check columns via JS client without a query
    // We'll try to select and see if it exists, or just try to add it via RPC if available, 
    // but usually we don't have RPC for migrations.
    // Alternatively, I can try to insert a test record with the new column and see if it fails.
    
    const { data, error } = await supabase
        .from('loans')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Error fetching loans:', error);
        return;
    }
    
    if (data && data.length > 0) {
        if ('tipo_juros' in data[0]) {
            console.log('Column tipo_juros already exists.');
        } else {
            console.log('Column tipo_juros does NOT exist. You should add it manually in Supabase Dashboard: ALTER TABLE loans ADD COLUMN tipo_juros text DEFAULT \'percent\';');
        }
    } else {
        console.log('No data to check. Assuming column might not exist.');
    }
}

checkAndAddColumn();
