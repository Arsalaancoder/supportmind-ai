# SupportMind AI 🧠⚡
> **Autonomous Customer Support Agent Powered by Hindsight Cloud Semantic Memory & Gemini 3.6 AI**

SupportMind AI transforms technical customer support by giving AI agents full customer memory. It eliminates customer frustration caused by repeating stories, re-explaining environments, or re-running failed troubleshooting steps.

---

## 🌟 The Problem Statement
> *"Customer Support Agent: Remembers a customer's full history: past tickets, known issues, their environment, their frustration level, what solutions worked before. Nothing angers a customer more than repeating their story. An agent with full customer memory transforms the entire support experience."*

---

## 🛠️ How Hindsight Memory is Used in SupportMind AI

SupportMind AI connects directly to **Hindsight Cloud (`https://api.hindsight.vectorize.io`)** on Bank ID **`SmartMind`** using two core memory primitives:

```
                  ┌─────────────────────────────────────────┐
                  │            HINDSIGHT CLOUD              │
                  │            (Bank: SmartMind)            │
                  └────▲──────────────────────────────┬─────┘
                       │                              │
        hindsightRetain│ (Outcome Recorded)           │hindsightRecall
                       │                              │ (New Ticket Arrives)
                  ┌────┴──────────────────────────────▼─────┐
                  │            SUPPORTMIND AI               │
                  │    (Express Server + Gemini 3.6)        │
                  └─────────────────────────────────────────┘
```

### 1. `hindsightRetain()` — Long-Term Memory Persistence
- **When It Triggers**: Whenever a support engineer or AI resolves an issue (`Outcome: SUCCESSFUL/FAILED/ESCALATED`).
- **How It Works**: The server formats a structured memory document with explicit `ENTITY:` annotations (`ENTITY: Customer`, `ENTITY: Organization`, `ENTITY: Tech Stack`).
- **Effect**: Hindsight Cloud runs an asynchronous LLM graph pipeline to extract **Fact Nodes** (`experience`, `observation`, `world`) and **Semantic/Entity Graph Links** into Bank `SmartMind`.

### 2. `hindsightRecall()` — Semantic Memory Retrieval & Zero Repetition
- **When It Triggers**: When a new ticket or customer inquiry arrives.
- **How It Works**: Before generating a response, SupportMind AI queries Hindsight Cloud Bank `SmartMind` for vector similarity matches across past troubleshooting outcomes, customer tech stack (`Node.js 20`, `AWS Lambda`, `Supabase PgBouncer`), and error signatures.
- **Effect**: High-confidence past solutions (e.g. 95%+ match) are retrieved and presented as a **"What Solutions Worked Before"** card with a 1-click **Apply Solution** button for the support engineer.

---

## 🔥 Key Features

1. **Zero-Repetition Customer Memory Shield**: Visual banner preventing customers from ever repeating their story.
2. **Frustration Index Gauge (0-100% Critical)**: Sentiment gauge detecting customer anger and repeat issues.
3. **Customer Infrastructure Stack Card**: Displays exact customer OS, Framework, Cloud, SDK, DB Engine, and Subscription Tier.
4. **Known System Issues Matcher**: Matches live system incidents and provides 1-click workaround responses.
5. **What Solutions Worked Before Card**: 1-click apply for proven historical fixes.
6. **Live Hindsight Memory Bank Workspace**: Built-in inspector showing live memory graph nodes in Bank `SmartMind`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Project & Hindsight Cloud API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/supportmind-ai.git
   cd supportmind-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`.env`)**:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
   GEMINI_API_KEY=your_gemini_key
   HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
   HINDSIGHT_API_KEY=your_hindsight_api_key
   HINDSIGHT_BANK_ID=SmartMind
   ```

4. **Seed Clean Hackathon Demo Data**:
   ```bash
   node scripts/reset_clean_tickets.mjs
   ```

5. **Run the application**:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🧪 Verification & Build Commands

- **Run TypeScript Linter**: `npm run lint` (`tsc --noEmit`)
- **Run Production Build**: `npm run build`
