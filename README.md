# VizMesh Studio

AI-Powered Data Visualization Platform built with Next.js 15, React 19, OpenAI GPT-4, and Supabase.

## Features

- 🤖 **AI-First Widget Creation** - Describe visualizations in natural language
- 📊 **Chart.js Integration** - Beautiful, interactive charts
- 🔒 **Secure Sandbox** - AI-generated code runs in isolated iframes
- 💾 **Persistent Storage** - Save dashboards and widgets to Supabase
- 📱 **Multiple Dashboards** - Organize visualizations across different dashboards
- ⚡ **Real-time Updates** - Instant widget generation and rendering

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS, shadcn/ui
- **AI**: OpenAI GPT-4 Turbo
- **Database**: Supabase (PostgreSQL)
- **Charts**: Chart.js
- **Language**: TypeScript

## Setup

### 1. Clone and Install

\`\`\`bash
cd vizmesh-studio
pnpm install
\`\`\`

### 2. Configure Environment Variables

Create a \`.env.local\` file:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI API
OPENAI_API_KEY=sk-proj-your-key
\`\`\`

### 3. Setup Supabase Database

Run the SQL schema in your Supabase SQL editor:

\`\`\`bash
cat supabase/schema.sql
\`\`\`

This will create:
- \`dashboards\` table
- \`widgets\` table
- \`data_sources\` table
- Row Level Security policies
- Indexes for performance

### 4. Run Development Server

\`\`\`bash
pnpm dev
\`\`\`

Visit http://localhost:3000

## Architecture

### AI Widget Generation Flow

1. User enters natural language prompt
2. GPT-4 generates complete React component with Chart.js
3. Component code is transpiled with Babel in browser
4. Executed safely in iframe sandbox
5. Widget saved to Supabase database

### Security

- **Iframe Sandbox**: All AI-generated code runs in isolated iframes
- **Row Level Security**: Supabase RLS ensures users only see their own data
- **postMessage Communication**: Secure parent-child communication
- **No Direct DOM Access**: Sandboxed code cannot access parent document

### Database Schema

\`\`\`
dashboards
├── id (UUID)
├── user_id (FK to auth.users)
├── name
├── description
└── timestamps

widgets
├── id (UUID)
├── dashboard_id (FK to dashboards)
├── prompt (user's natural language request)
├── title
├── data_source (JSONB - config and data)
├── visualization (JSONB - component code)
├── position (JSONB - x, y)
├── size (JSONB - width, height)
└── timestamps
\`\`\`

## Usage

### Create a Dashboard

1. Click "New Dashboard" on home page
2. Enter name and description
3. Click "Create Dashboard"

### Add Widgets

1. Open a dashboard
2. Click "Add Widget"
3. Describe your visualization:
   - "Show me a bar chart of monthly sales"
   - "Create a line chart of user growth"
   - "Display a pie chart of product categories"
4. AI generates and renders the widget
5. Widget is automatically saved

### Example Prompts

- "Create a bar chart showing revenue by quarter"
- "Line chart of daily active users over last 30 days"
- "Pie chart breaking down expenses by category"
- "Show top 5 products by sales in a bar chart"

## API Endpoints

### Dashboards

- \`GET /api/dashboards\` - List user's dashboards
- \`POST /api/dashboards\` - Create new dashboard

### Widgets

- \`GET /api/dashboards/[id]/widgets\` - Get dashboard widgets
- \`POST /api/dashboards/[id]/widgets\` - Create widget
- \`DELETE /api/dashboards/[id]/widgets?widgetId=...\` - Delete widget

### AI Generation

- \`POST /api/ai/generate-widget\` - Generate widget from prompt

## Future Enhancements

- [ ] Drag & drop widget positioning
- [ ] Resize widgets
- [ ] Real data source integrations (APIs, databases)
- [ ] Agent Graph integration
- [ ] Dashboard sharing
- [ ] Export dashboards
- [ ] Custom themes
- [ ] Widget templates
- [ ] Collaborative editing

## License

MIT

## Credits

Built with Claude Code by Anthropic
