export type AssignmentStatus =
  | 'unassigned'
  | 'notified'
  | 'initial_yes'
  | 'confirmed'
  | 'callout'
  | 'covered'
  | 'unfilled';

export type SessionType = 'practice' | 'intramural' | 'tryout' | 'game' | 'camp' | 'clinic';

export type CascadeStatus = 'active' | 'resolved' | 'escalated' | 'cancelled';

export type OutboundKind =
  | 'initial'
  | 'reminder'
  | 'cascade'
  | 'confirmed'
  | 'standdown'
  | 'custom';

export type OutboundStatus = 'pending' | 'approved' | 'sent' | 'failed';

export interface Club {
  id: string;
  name: string;
  slug: string;
  color: string;
  short?: string;
  active: boolean;
}

export interface Trainer {
  id: string;
  club_id: string;
  full_name: string;
  first_name?: string;
  phone: string;
  email?: string | null;
  cert_level?: string | null;
  age_groups: string[];
  priority_tier: number;
  min_hours_week: number;
  max_hours_week: number;
  active: boolean;
  notes?: string | null;
  reliability?: number;
  hours_this_week?: number;
}

export interface Session {
  id: string;
  club_id: string;
  date: string; // ISO date
  start_time: string; // HH:mm
  end_time: string;
  location: string;
  age_groups: string[];
  program_name: string;
  session_type: SessionType;
  required_cert_level?: string | null;
  notes?: string | null;
}

export interface Assignment {
  id: string;
  session_id: string;
  trainer_id: string | null;
  status: AssignmentStatus;
  assigned_at?: string;
  notified_at?: string | null;
  initial_yes_at?: string | null;
  confirmed_at?: string | null;
  reminder_sent_at?: string | null;
  // for cascade reassignment display
  prior_trainer_id?: string | null;
}

export interface Callout {
  id: string;
  assignment_id: string;
  reported_at: string;
  source: 'quo' | 'base44' | 'manual';
  reason?: string | null;
  resolved: boolean;
  resolved_assignment_id?: string | null;
}

export interface CascadeState {
  id: string;
  callout_id: string;
  current_wave: number;
  last_wave_sent_at?: string | null;
  status: CascadeStatus;
  updated_at: string;
}

export interface InboundMessage {
  id: string;
  club_id?: string | null;
  from_phone: string;
  trainer_id?: string | null;
  body: string;
  received_at: string;
  intent?: string | null;
  parsed_data?: Record<string, unknown> | null;
  handled: boolean;
  handled_by?: string | null;
}

export interface OutboundMessage {
  id: string;
  club_id?: string | null;
  to_phone: string;
  trainer_id?: string | null;
  body: string;
  kind: OutboundKind;
  status: OutboundStatus;
  sent_at?: string | null;
  related_assignment_id?: string | null;
  related_callout_id?: string | null;
}

export interface SystemSettings {
  agent_enabled: boolean;
  approval_mode: boolean;
  wave_size: number;
  wave_wait_minutes: number;
  max_waves: number;
  reminder_hours_before: number;
  max_outbound_per_hour: number;
  loop_threshold: number;
  escalation_phone?: string | null;
}

// Combined view used by the UI
export interface AssignmentSlot {
  assignment: Assignment;
  trainer: Trainer | null;
  prior_trainer: Trainer | null;
}

export interface SessionWithAssignment {
  session: Session;
  assignments: AssignmentSlot[];
}

export interface ActiveCascade {
  cascade: CascadeState;
  callout: Callout;
  session: Session;
  original_trainer: Trainer | null;
  attempted_trainers: Trainer[];
  attempts: CoverageAttempt[];
  max_waves: number;
  wave_size: number;
  reason?: string | null;
  reported_at_human?: string;
  next_wave_at: string | null;
}

export type InboxIntent = 'question' | 'availability' | 'callout' | 'confirmation' | 'unclear';

export interface InboxItem {
  id: string;
  trainer: Trainer | null;
  from_phone: string;
  body: string;
  received_at: string;
  intent?: InboxIntent;
}

export interface CoverageAttempt {
  trainer_id: string;
  wave: number;
  response: 'yes' | 'no' | 'timeout' | null;
  responded_at?: string | null;
}
