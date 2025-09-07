const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const workspaces = [
  {
    name: 'Analog Workspace'
  },
  {
    name: 'Metal Workspace'
  },
  {
    name: 'Vintage Workspace'
  }
];

async function initWorkspaces() {
  try {
    console.log('Initializing workspaces...');
    
    for (const workspace of workspaces) {
      console.log(`Creating workspace: ${workspace.name}`);
      
      const { data, error } = await supabase
        .from('workspaces')
        .insert([workspace])
        .select();
        
      if (error) {
        console.error(`Error creating workspace ${workspace.name}:`, error);
      } else {
        console.log(`✓ Created workspace: ${workspace.name}`);
      }
    }
    
    console.log('All workspaces initialized successfully!');
    
  } catch (error) {
    console.error('Error initializing workspaces:', error);
  }
}

initWorkspaces();