-- jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number text,
  customer text,
  weave_type text,
  width_mm int,
  length_m int,
  due_date date,
  priority int,
  colour_signature jsonb,
  status text DEFAULT 'pending'
);

-- looms table
CREATE TABLE IF NOT EXISTS looms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  loom_type text,
  creel_type text,
  usable_width_mm int,
  nominal_speed float,
  current_colour_state jsonb
);

-- runs table
CREATE TABLE IF NOT EXISTS runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loom_id uuid REFERENCES looms(id),
  start_time timestamp,
  end_time timestamp,
  waste_width_mm int,
  setup_minutes int
);

-- run_items table
CREATE TABLE IF NOT EXISTS run_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES runs(id),
  job_id uuid REFERENCES jobs(id),
  position text,
  width_mm int
);
