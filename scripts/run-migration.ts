import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250121_add_column_span_to_widgets.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('Running migration...')
    console.log(migrationSQL)

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }

    console.log('Migration completed successfully!')
    console.log('Result:', data)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

runMigration()
