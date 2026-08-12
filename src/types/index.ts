export interface CustomerEnvironment {
  os?: string;
  framework?: string;
  cloud_provider?: string;
  sdk_version?: string;
  db_engine?: string;
  plan_tier?: string;
  [key: string]: any;
}

export type FrustrationLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
  environment?: CustomerEnvironment | null;
  frustration_level?: FrustrationLevel | null;
  frustration_score?: number | null;
  created_at?: string;
  updated_at?: string;
  mental_model?: any;
  mental_model_updated_at?: string | null;
}

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'failed' | 'escalated';

export interface Ticket {
  id: string;
  customer_id: string;
  subject: string;
  description: string;
  category: string;
  priority: PriorityLevel;
  status: TicketStatus;
  resolution?: string | null;
  frustration_level?: FrustrationLevel | null;
  repeat_issue_detected?: boolean | null;
  environment_snapshot?: CustomerEnvironment | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  hindsight_memory_id?: string | null;
  hindsight_retained?: boolean;
  hindsight_retained_at?: string | null;
  customer?: Customer;
}

export interface KnownIssue {
  id: string;
  title: string;
  category: string;
  affected_environment?: string;
  description: string;
  workaround: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'investigating' | 'identified' | 'fixing' | 'resolved';
  created_at?: string;
}

export interface ProvenSolution {
  ticket_id?: string;
  problem_summary: string;
  action_taken: string;
  outcome: string;
  confidence: number;
  environment_match?: boolean;
  notes?: string;
}

export interface FrustrationAssessment {
  score: number; // 0 - 100
  level: FrustrationLevel;
  reasoning: string;
  friction_warning?: string;
  repeat_explanations_count?: number;
}

export interface Message {
  id: string;
  ticket_id: string;
  sender: string;
  content: string;
  created_at: string;
}

export type OutcomeType = 'successful' | 'failed' | 'escalated';

export interface TicketOutcome {
  id: string;
  ticket_id: string;
  action: string;
  outcome: OutcomeType;
  notes?: string | null;
  created_at: string;
}

export interface GeminiAnalysis {
  summary: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  frustration_assessment?: FrustrationAssessment;
  proven_solutions?: ProvenSolution[];
  known_issue_match?: {
    issue_id?: string;
    title: string;
    workaround: string;
    severity: string;
  } | null;
  environment_analysis?: {
    compatibility_status: 'compatible' | 'known_conflict' | 'deprecated' | 'unknown';
    notes: string;
  };
  historical_evidence: Array<{
    memory_id?: string;
    ticket_id?: string;
    relevance_explanation: string;
    previous_action?: string;
    previous_outcome?: string;
  }>;
  recommended_actions: string[];
  reasoning: string;
  confidence: number;
  next_steps: string[];
  escalation_required: boolean;
}

export interface AgentRun {
  id: string;
  ticket_id: string;
  query?: string | null;
  recalled_memory_count: number;
  unique_memory_count: number;
  gemini_response?: GeminiAnalysis | null;
  status: string;
  error?: string | null;
  created_at: string;
}

export type MemoryOperation = 'recall' | 'retain';
export type MemoryType = 'ticket_created' | 'resolution' | 'failed_attempt' | 'escalation';
export type MemoryEventStatus = 'started' | 'success' | 'failed' | 'duplicate';

export interface MemoryEvent {
  id: string;
  ticket_id?: string | null;
  customer_id?: string | null;
  operation: MemoryOperation;
  memory_type: MemoryType;
  hindsight_bank: string;
  hindsight_memory_id?: string | null;
  memory_fingerprint?: string | null;
  status: MemoryEventStatus;
  error?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface HindsightMemory {
  id: string;
  bank: string;
  text: string;
  metadata: {
    ticket_id?: string;
    customer_name?: string;
    customer_id?: string;
    company?: string;
    category?: string;
    problem?: string;
    action?: string;
    outcome?: string;
    memory_type?: string;
    fingerprint?: string;
    [key: string]: any;
  };
  created_at?: string;
  score?: number;
}

export interface AIProposal {
  id?: string | null;
  ticket_id: string;
  content: string;
  status?: 'proposed' | 'approved' | 'rejected';
  message_id?: string | null;
  created_at?: string | null;
  approved_at?: string | null;
}

export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

