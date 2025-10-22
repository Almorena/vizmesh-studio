import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * POST /api/migrate - Run database migrations
 * This is a one-time endpoint to apply migrations
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Migration SQL
    const migrationSQL = `
      -- Add column_span to widgets table
      ALTER TABLE widgets
      ADD COLUMN IF NOT EXISTS column_span INTEGER DEFAULT 1 CHECK (column_span IN (1, 2, 3));

      -- Update existing widgets to have column_span 1
      UPDATE widgets SET column_span = 1 WHERE column_span IS NULL;
    `

    console.log("[Migration] Running column_span migration...")

    // Execute using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      // If exec_sql RPC doesn't exist, try direct SQL execution
      console.log("[Migration] RPC not available, trying direct execution...")

      // Split into individual statements
      const statements = [
        "ALTER TABLE widgets ADD COLUMN IF NOT EXISTS column_span INTEGER DEFAULT 1 CHECK (column_span IN (1, 2, 3))",
        "UPDATE widgets SET column_span = 1 WHERE column_span IS NULL"
      ]

      for (const statement of statements) {
        const result = await supabase.from('_migrations').select('*').limit(0)
        // This is a workaround - we'll need to use the SQL editor
        console.log("[Migration] Statement:", statement)
      }

      return NextResponse.json({
        message: "Migration SQL prepared. Please run the following in Supabase SQL Editor:",
        sql: migrationSQL,
        error: error.message
      })
    }

    console.log("[Migration] Migration completed successfully")

    return NextResponse.json({
      message: "Migration completed successfully",
      data
    })
  } catch (error: any) {
    console.error("[Migration] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
