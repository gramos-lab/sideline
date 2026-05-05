-- Seed data for Sideline dev/staging
-- Wipe-and-reload safe: truncate in dependency order before inserting.

truncate
  outbound_messages,
  inbound_messages,
  coverage_attempts,
  cascade_state,
  callouts,
  assignments,
  sessions,
  availability_exceptions,
  availability_recurring,
  trainers,
  clubs
restart identity cascade;

-- Clubs
insert into clubs (id, name, slug, color) values
  ('11111111-1111-1111-1111-111111111111', 'RSG NAL', 'rsg-nal', '#1E40AF'),
  ('22222222-2222-2222-2222-222222222222', 'Manhasset Soccer Club', 'msc', '#0F766E');

-- Trainers — RSG NAL
insert into trainers (id, club_id, full_name, phone, email, cert_level, age_groups, priority_tier, max_hours_week)
values
  ('aaaaaaa1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Maria Alvarez', '+15550100001', 'maria@example.com', 'USSF C', array['U10','U11','U12'], 1, 22),
  ('aaaaaaa1-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sam Patel',     '+15550100002', 'sam@example.com',   'USSF D', array['U11','U12'],       1, 18),
  ('aaaaaaa1-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Carlos Mendes', '+15550100003', 'carlos@example.com','USSF C', array['U10','U11','U13'], 2, 20),
  ('aaaaaaa1-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Tina Ortiz',    '+15550100004', 'tina@example.com',  'USSF E', array['U10'],             2, 12),
  ('aaaaaaa1-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Devin Brooks',  '+15550100005', 'devin@example.com', 'USSF D', array['U12','U13'],       3, 10);

-- Trainers — MSC
insert into trainers (id, club_id, full_name, phone, email, cert_level, age_groups, priority_tier, max_hours_week)
values
  ('bbbbbbb2-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Jordan Reilly', '+15550100101', 'jordan@example.com','USSF C', array['U9','U10'],   1, 20),
  ('bbbbbbb2-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Priya Singh',   '+15550100102', 'priya@example.com', 'USSF D', array['U11','U12'],  1, 16),
  ('bbbbbbb2-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Mike Halloran', '+15550100103', 'mike@example.com',  'USSF E', array['U10'],        2, 12),
  ('bbbbbbb2-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Lena Park',     '+15550100104', 'lena@example.com',  'USSF C', array['U12','U13'],  2, 14),
  ('bbbbbbb2-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Rob Fagan',     '+15550100105', 'rob@example.com',   'USSF D', array['U10','U11'],  3, 8);

-- Recurring availability — varied
-- weekday evenings 4pm-9pm, plus some weekend morning availability
do $$
declare
  t record;
  d int;
begin
  for t in select id, full_name from trainers loop
    -- weekdays Mon-Fri (1-5)
    for d in 1..5 loop
      insert into availability_recurring (trainer_id, day_of_week, start_time, end_time)
      values (t.id, d, '16:00', '21:00');
    end loop;
    -- weekend mornings for half the trainers based on hash
    if length(t.full_name) % 2 = 0 then
      insert into availability_recurring (trainer_id, day_of_week, start_time, end_time)
      values (t.id, 6, '08:00', '12:00');
      insert into availability_recurring (trainer_id, day_of_week, start_time, end_time)
      values (t.id, 0, '08:00', '12:00');
    end if;
  end loop;
end$$;

-- Sessions for the current week (Mon..Sat) for each club.
-- "Current week" anchored on the Monday of the week of CURRENT_DATE.
do $$
declare
  monday date := date_trunc('week', current_date)::date; -- Postgres week starts Monday
  nal uuid := '11111111-1111-1111-1111-111111111111';
  msc uuid := '22222222-2222-2222-2222-222222222222';
begin
  -- RSG NAL
  insert into sessions (id, club_id, date, start_time, end_time, location, age_groups, program_name, session_type) values
    ('ccccccc3-0000-0000-0000-000000000001', nal, monday + 1, '17:00', '18:30', 'Memorial Field', array['U10'], 'U10 Intramural', 'intramural'),
    ('ccccccc3-0000-0000-0000-000000000002', nal, monday + 1, '18:30', '20:00', 'Memorial Field', array['U12'], 'U12 Practice',   'practice'),
    ('ccccccc3-0000-0000-0000-000000000003', nal, monday + 2, '17:30', '19:00', 'Whitney Park',   array['U11'], 'U11 Practice',   'practice'),
    ('ccccccc3-0000-0000-0000-000000000004', nal, monday + 2, '18:00', '19:30', 'Whitney Park',   array['U12'], 'U12 Tryout',     'tryout'),
    ('ccccccc3-0000-0000-0000-000000000005', nal, monday + 3, '17:00', '18:30', 'Memorial Field', array['U10'], 'U10 Intramural', 'intramural'),
    ('ccccccc3-0000-0000-0000-000000000006', nal, monday + 4, '17:30', '19:00', 'Whitney Park',   array['U11'], 'U11 Practice',   'practice'),
    ('ccccccc3-0000-0000-0000-000000000007', nal, monday + 5, '09:00', '10:30', 'Memorial Field', array['U10'], 'U10 Intramural', 'intramural'),
    ('ccccccc3-0000-0000-0000-000000000008', nal, monday + 5, '10:30', '12:00', 'Memorial Field', array['U12'], 'U12 Practice',   'practice'),
    -- Multi-age camp + clinic demos.
    ('ccccccc3-0000-0000-0000-000000000009', nal, monday + 6, '09:00', '12:00', 'Memorial Field', array['U5','U6','U7','U8','U9','U10','U11','U12'], 'Holiday Camp',     'camp'),
    ('ccccccc3-0000-0000-0000-00000000000a', nal, monday + 4, '19:00', '20:30', 'Whitney Park',   array['U10','U11','U12'], 'Goalkeeper Clinic', 'clinic');

  -- MSC
  insert into sessions (id, club_id, date, start_time, end_time, location, age_groups, program_name, session_type) values
    ('ddddddd4-0000-0000-0000-000000000001', msc, monday + 1, '17:00', '18:00', 'Mary Jane Davies', array['U9'],  'U9 Practice',  'practice'),
    ('ddddddd4-0000-0000-0000-000000000002', msc, monday + 1, '18:00', '19:30', 'Mary Jane Davies', array['U11'], 'U11 Practice','practice'),
    ('ddddddd4-0000-0000-0000-000000000003', msc, monday + 2, '17:30', '19:00', 'Manhasset HS',     array['U12'], 'U12 Practice','practice'),
    ('ddddddd4-0000-0000-0000-000000000004', msc, monday + 3, '17:00', '18:30', 'Mary Jane Davies', array['U10'], 'U10 Practice','practice'),
    ('ddddddd4-0000-0000-0000-000000000005', msc, monday + 4, '18:00', '19:30', 'Manhasset HS',     array['U13'], 'U13 Practice','practice'),
    ('ddddddd4-0000-0000-0000-000000000006', msc, monday + 5, '09:30', '11:00', 'Mary Jane Davies', array['U10'], 'U10 Game',    'game');
end$$;

-- Assignments showing every status
insert into assignments (session_id, trainer_id, status, notified_at, initial_yes_at, confirmed_at) values
  ('ccccccc3-0000-0000-0000-000000000001', 'aaaaaaa1-0000-0000-0000-000000000001', 'confirmed',  now() - interval '2 days', now() - interval '1 day', now() - interval '6 hours'),
  ('ccccccc3-0000-0000-0000-000000000002', 'aaaaaaa1-0000-0000-0000-000000000002', 'initial_yes', now() - interval '1 day', now() - interval '12 hours', null),
  ('ccccccc3-0000-0000-0000-000000000003', 'aaaaaaa1-0000-0000-0000-000000000002', 'callout',     now() - interval '1 day', now() - interval '10 hours', null),
  ('ccccccc3-0000-0000-0000-000000000004', 'aaaaaaa1-0000-0000-0000-000000000003', 'notified',    now() - interval '6 hours', null, null),
  ('ccccccc3-0000-0000-0000-000000000006', 'aaaaaaa1-0000-0000-0000-000000000004', 'notified',    now() - interval '6 hours', null, null),
  ('ccccccc3-0000-0000-0000-000000000007', 'aaaaaaa1-0000-0000-0000-000000000001', 'confirmed',   now() - interval '2 days', now() - interval '1 day', now() - interval '8 hours');

insert into assignments (session_id, trainer_id, status, notified_at, initial_yes_at, confirmed_at) values
  ('ddddddd4-0000-0000-0000-000000000001', 'bbbbbbb2-0000-0000-0000-000000000001', 'confirmed',   now() - interval '2 days', now() - interval '1 day', now() - interval '4 hours'),
  ('ddddddd4-0000-0000-0000-000000000002', 'bbbbbbb2-0000-0000-0000-000000000002', 'initial_yes', now() - interval '1 day', now() - interval '12 hours', null),
  ('ddddddd4-0000-0000-0000-000000000003', 'bbbbbbb2-0000-0000-0000-000000000004', 'notified',    now() - interval '6 hours', null, null),
  ('ddddddd4-0000-0000-0000-000000000005', 'bbbbbbb2-0000-0000-0000-000000000003', 'notified',    now() - interval '6 hours', null, null),
  ('ddddddd4-0000-0000-0000-000000000006', 'bbbbbbb2-0000-0000-0000-000000000001', 'confirmed',   now() - interval '2 days', now() - interval '1 day', now() - interval '6 hours');

-- A live callout + cascade so the dashboard shows the orange card
do $$
declare
  callout_id uuid;
  cascade_id uuid;
  assign_id uuid;
begin
  select id into assign_id from assignments
    where session_id = 'ccccccc3-0000-0000-0000-000000000003' limit 1;

  insert into callouts (assignment_id, source, reason)
  values (assign_id, 'quo', 'Sick — sorry')
  returning id into callout_id;

  insert into cascade_state (callout_id, current_wave, last_wave_sent_at, status)
  values (callout_id, 2, now() - interval '90 seconds', 'active')
  returning id into cascade_id;

  insert into coverage_attempts (callout_id, trainer_id, wave) values
    (callout_id, 'aaaaaaa1-0000-0000-0000-000000000003', 1),
    (callout_id, 'aaaaaaa1-0000-0000-0000-000000000001', 1),
    (callout_id, 'aaaaaaa1-0000-0000-0000-000000000004', 1);
end$$;
