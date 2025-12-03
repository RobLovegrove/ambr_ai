# Ambr Technical Assessment - Meeting Transcript Analyzer

A full-stack application that analyzes meeting transcripts using AI and presents actionable insights to users.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for PostfgreSQL)
- OpenAI API key

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ambr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ambr_assessment"
   OPENAI_API_KEY="your-openai-api-key-here"
   ANTHROPIC_API_KEY="your-anthropic-api-key-here"  # Optional, used as fallback
   API_PORT=3001
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   ```
   
   **Note:** You need at least one LLM API key. If both are provided, the system will automatically fall back to Anthropic if OpenAI fails (or vice versa).

4. **Start PostgreSQL database**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   This single command will start both:
   - API server on `http://localhost:3001`
   - Next.js frontend on `http://localhost:3000`
   
   **Note:** Turborepo runs both servers in parallel. You'll see output from both in your terminal.

## 📁 Project Structure

```
Ambr/
├── apps/
│   ├── api/          # Express backend with ts-rest
│   └── web/          # Next.js 14 frontend
├── packages/
│   ├── db/           # Prisma schema and database client
│   ├── llm/          # LLM adapter pattern implementation
│   └── shared/       # Zod schemas and shared types
├── docker-compose.yml
└── turbo.json        # Turborepo configuration
```

## 🏗️ Architecture

### Monorepo Setup
- **Turborepo** for managing the monorepo
- **npm workspaces** for package management
- Shared packages for type safety and code reuse

### Backend (`apps/api`)
- **Express** server with **ts-rest** for type-safe API contracts
- **Zod** schemas for runtime validation
- **Prisma** ORM for database operations
- **LLM Adapter Pattern** for easy switching between LLM providers

### Frontend (`apps/web`)
- **Next.js 14** with App Router
- **React Query** for data fetching and caching
- **Tailwind CSS** for styling (Material-inspired design)
- Real-time validation and error handling

### Database
- **PostgreSQL** via Docker Compose
- **Prisma** for schema management and migrations
- Models: `Transcript`, `Analysis`, `ActionItem`, `KeyDecision`

## 🔌 API Endpoints

### `POST /api/analyze`
Analyze a meeting transcript and store results.

**Request:**
```json
{
  "text": "Meeting transcript text..."
}
```

**Response:**
```json
{
  "id": "analysis-id",
  "transcriptId": "transcript-id",
  "title": "Meeting Title",
  "sentiment": "positive|neutral|negative|mixed",
  "summary": "Brief summary...",
  "actionItems": [...],
  "keyDecisions": [...],
  "createdAt": "2024-12-02T..."
}
```

### `GET /api/analysis/:id`
Get a specific analysis by ID (includes full transcript text).

### `GET /api/analyses`
List all analyses with pagination.

**Query Parameters:**
- `limit` (optional): Number of results (default: 10, max: 100)
- `offset` (optional): Pagination offset (default: 0)

### `DELETE /api/analysis/:id`
Delete an analysis and all related records (cascade delete).

## 🎨 Features

### Core Functionality
- ✅ Analyze meeting transcripts using GPT-3.5 Turbo
- ✅ Extract action items with owners and deadlines
- ✅ Identify key decisions with context
- ✅ Determine overall meeting sentiment
- ✅ Generate meeting title and summary
- ✅ Store all analyses in database
- ✅ View analysis history
- ✅ Delete analyses

### User Experience
- ✅ Real-time character count with validation
- ✅ Warning at 45,000 characters (90% of limit)
- ✅ Error prevention for transcripts over 50,000 characters
- ✅ Visual indicator for selected analysis in history
- ✅ Transcript persists after analysis (can be edited for re-analysis)
- ✅ Clean, Material-inspired UI
- ✅ Responsive design

### Error Handling
- ✅ Frontend validation with clear error messages
- ✅ Backend validation using Zod schemas
- ✅ Network error handling
- ✅ LLM error handling with custom error types
- ✅ Database error handling (Prisma errors)
- ✅ User-friendly error messages throughout

## 🔧 Key Decisions & Rationale

### 1. **LLM Choice: GPT-3.5 Turbo with Anthropic Fallback**
- **Why:** Cost-effective, reliable, good performance for structured extraction
- **Fallback system:** Automatically switches to Anthropic Claude if OpenAI fails
- **Adapter pattern:** Easy to switch between providers, supports multiple LLMs simultaneously
- **Resilience:** If one provider has issues, the system automatically uses the other

### 2. **Transcript Length Limit: 50,000 characters**
- **Why:** 
  - GPT-3.5 Turbo context window: 16,384 tokens
  - ~1 token ≈ 4 characters → 50k chars ≈ 12,500 tokens
  - Leaves room for system prompt (~1k tokens) and response (~2k tokens)
  - Conservative limit to avoid hitting token limits
- **Handling:** Frontend validation with warnings at 45k characters

### 3. **Storing Full Transcripts**
- **Why:** 
  - Allows users to review original context
  - Enables re-analysis if needed
  - Useful for debugging and audit trail
- **Trade-off:** Storage cost, but acceptable for assessment scope

### 4. **Monorepo with Turborepo**
- **Why:** 
  - Clean separation of concerns
  - Shared types and schemas
  - Easy to add more packages/apps
  - Parallel builds and caching

### 5. **ts-rest over tRPC**
- **Why:** 
  - Explicitly mentioned in requirements
  - Type-safe contracts
  - Works well with Express
  - Clear API documentation

### 6. **Material-Inspired Design**
- **Why:** 
  - Clean, professional appearance
  - Familiar UX patterns
  - Good accessibility defaults
  - Easy to implement with Tailwind

### 7. **Analysis History with Titles**
- **Why:** 
  - Titles are more scannable than summaries
  - Better UX for browsing past analyses
  - LLM generates concise 3-8 word titles

### 8. **Frontend Validation & Warnings**
- **Why:**
  - Prevents user frustration from backend rejections
  - Real-time feedback improves UX
  - Warning at 90% gives users time to adjust
  - Clear visual indicators (color coding)

## 🚧 What I'd Improve With More Time

### High Priority
1. **Testing**
   - Unit tests for handlers and LLM adapter
   - Integration tests for API endpoints
   - E2E tests for critical user flows

2. **Token Limit Handling**
   - Implement proper token counting before sending to LLM
   - Add chunking strategy for very long transcripts
   - Consider using GPT-4 Turbo for longer transcripts
   - Use tiktoken library for accurate token estimation

3. **Pagination UI**
   - Add pagination controls to Analysis History
   - Currently API supports it but UI doesn't use it

4. **Loading States & UX Polish**
   - Replace text loading indicators with skeleton screens
   - Add toast notifications for success/error feedback
   - Improve empty states with helpful guidance
   - Add smooth transitions and animations

### Medium Priority
4. **Search & Filtering**
   - Search analyses by title or content
   - Filter by sentiment or date range

5. **Export Functionality**
   - Download analyses as JSON/CSV
   - Export action items to task management tools

6. **RAG (Retrieval Augmented Generation)**
   - Store a knowledge base of analysis guidelines and best practices
   - Provide the LLM with contextual examples of well-formatted action items and decisions
   - Retrieve relevant guidelines based on meeting type or content
   - Feed the LLM with company-specific preferences (e.g., "always include deadlines when mentioned", "prioritize technical decisions")
   - Use embeddings to find and inject relevant examples into the prompt, improving consistency and quality
   - Could include examples of good vs. bad analyses to guide the LLM's output format

7. **Accessibility Improvements**
   - ARIA labels for screen readers
   - Keyboard navigation improvements
   - Focus management

### Low Priority
8. **Performance Optimizations**
   - Add loading skeletons instead of text
   - Implement virtual scrolling for long history lists
   - Optimize React Query cache strategies

9. **Additional Features**
   - Edit analyses
   - Bulk delete
   - Analysis comparison
   - Meeting templates
   - Toast notifications for better user feedback
   - Keyboard shortcuts (e.g., Cmd+K for search)
   - Dark mode
   - Better empty states with helpful suggestions

## 🐛 Known Issues / Limitations

- No tests (time constraint)
- Pagination API exists but UI doesn't use it yet
- No chunking for very long transcripts (relies on 50k char limit)
- Basic accessibility (could be enhanced)

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for LLM | At least one |
| `ANTHROPIC_API_KEY` | Anthropic API key for LLM (fallback) | At least one |
| `API_PORT` | Port for API server (default: 3001) | No |
| `NEXT_PUBLIC_API_URL` | API URL for frontend (default: http://localhost:3001) | No |

## 🛠️ Available Scripts

### Root Level
- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all packages and apps
- `npm run lint` - Lint all packages
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

### Individual Packages
- `cd apps/api && npm run dev` - Start API server only
- `cd apps/web && npm run dev` - Start frontend only

## 🧪 Testing the Application

1. **Start the servers** (see Quick Start above)

2. **Test with sample transcript:**
   - Use the sample transcript from the assessment PDF
   - Or paste any meeting transcript
   - Click "Analyze" and view the results

3. **Test error handling:**
   - Try submitting an empty transcript
   - Try submitting a transcript over 50,000 characters
   - Try deleting an analysis

## 📚 Tech Stack Summary

- **Language:** TypeScript throughout
- **Backend:** Express + ts-rest
- **Database:** PostgreSQL + Prisma
- **Frontend:** Next.js 14 + React + Tailwind CSS
- **Data Fetching:** React Query
- **Validation:** Zod
- **LLM:** OpenAI GPT-3.5 Turbo
- **Monorepo:** Turborepo + npm workspaces

## 📄 License

This is a technical assessment project for Ambr.ai.

## 🙋 Questions?

If you have any questions about the implementation or need help running it, please reach out!

---

**Note:** Make sure Docker is running before starting the database, and ensure your `.env` file is properly configured with the required API keys.

