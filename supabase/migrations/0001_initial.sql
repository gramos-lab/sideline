create extension if not exists "uuid-ossp";

create table clubs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  color text default '#1E40AF',
  active boolean default true,
  created_at timestamptz default now()
);

create table trainers (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid references clubs(id) on delete cascade not null,
  full_name text not null,
  phone text not null,
  email text,
  cert_level text,
  age_groups text[],
  priority_tier int default 2,
  min_hours_week int default 0,
  max_hours_week int default 40,
  active boolean default true,
  notes text,
  created_at timestamptz default now(),
  unique (club_id, phone)
);

create table availability_recurring (
  id uuid primary key default uuid_generate_v4(),
  trainer_id uuid references trainers(id) on delete cascade not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null
);

create table availability_exceptions (
  id uuid primary key default uuid_generate_v4(),
  trainer_id uuid references trainers(id) on delete cascade not null,
  date date not null,
  available boolean not null,
  start_time time,
  end_time time,
  note text
);

create table sessions (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid references clubs(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  location text not null,
  age_groups text[] not null,
  program_name text not null,
  session_type text not null,
  required_cert_level text,
  notes text,
  created_at timestamptz default now()
);

create table assignments (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  trainer_id uuid references trainers(id) not null,
  status text not null default 'unassigned',
  assigned_at timestamptz default now(),
  notified_at timestamptz,
  initial_yes_at timestamptz,
  confirmed_at timestamptz,
  reminder_sent_at timestamptz,
  unique (session_id, trainer_id)
);

create table callouts (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid references assignments(id) on delete cascade not null,
  reported_at timestamptz default now(),
  source text not null,
  reason text,
  resolved boolean default false,
  resolved_assignment_id uuid references assignments(id)
);

create table cascade_state (
  id uuid primary key default uuid_generate_v4(),
  callout_id uuid references callouts(id) on delete cascade not null unique,
  current_wave int default 1,
  last_wave_sent_at timestamptz,
  status text default 'active',
  updated_at timestamptz default now()
);

create table coverage_attempts (
  id uuid primary key default uuid_generate_v4(),
  callout_id uuid references callouts(id) on delete cascade not null,
  trainer_id uuid references trainers(id) not null,
  wave int not null,
  sent_at timestamptz default now(),
  responded_at timestamptz,
  response text,
  message_in text,
  message_out text
);

create table inbound_messages (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid references clubs(id),
  from_phone text not null,
  trainer_id uuid references trainers(id),
  body text not null,
  received_at timestamptz default now(),
  intent text,
  parsed_data jsonb,
  handled boolean default false,
  handled_by text
);

create table outbound_messages (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid references clubs(id),
  to_phone text not null,
  trainer_id uuid references trainers(id),
  body text not null,
  kind text not null,
  status text not null default 'pending',
  sent_at timestamptz,
  related_assignment_id uuid references assignments(id),
  related_callout_id uuid references callouts(id)
);

create table system_settings (
  id int primary key default 1,
  agent_enabled boolean default true,
  approval_mode boolean default true,
  wave_size int default 3,
  wave_wait_minutes int default 4,
  max_waves int default 3,
  reminder_hours_before int default 24,
  max_outbound_per_hour int default 50,
  loop_threshold int default 3,
  escalation_phone text,
  check (id = 1)
);

insert into system_settings (id) values (1) on conflict do nothing;

-- Indexes
create index idx_sessions_club_date on sessions(club_id, date);
create index idx_assignments_session on assignments(session_id);
create index idx_assignments_trainer_status on assignments(trainer_id, status);
create index idx_cascade_state_status on cascade_state(status);
create index idx_inbound_unhandled on inbound_messages(handled) where handled = false;
create index idx_outbound_pending on outbound_messages(status) where status in ('pending','approved');

-- Row Level Security
alter table clubs enable row level security;
alter table trainers enable row level security;
alter table availability_recurring enable row level security;
alter table availability_exceptions enable row level security;
alter table sessions enable row level security;
alter table assignments enable row level security;
alter table callouts enable row level security;
alter table cascade_state enable row level security;
alter table coverage_attempts enable row level security;
alter table inbound_messages enable row level security;
alter table outbound_messages enable row level security;
alter table system_settings enable row level security;

-- v1 policy: service role bypasses RLS, anon can read all clubs (auth lands in v2)
create policy "anon read clubs" on clubs for select using (true);
