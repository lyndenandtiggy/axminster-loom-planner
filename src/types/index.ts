export interface Job {
  id: string;
  job_number: string | null;
  customer: string | null;
  weave_type: string | null;
  width_mm: number | null;
  length_m: number | null;
  due_date: string | null;
  priority: number | null;
  colour_signature: Record<string, unknown> | null;
  status: string | null;
}

export interface Loom {
  id: string;
  name: string | null;
  loom_type: string | null;
  creel_type: string | null;
  usable_width_mm: number | null;
  nominal_speed: number | null;
  current_colour_state: Record<string, unknown> | null;
}

export interface Run {
  id: string;
  loom_id: string | null;
  start_time: string | null;
  end_time: string | null;
  waste_width_mm: number | null;
  setup_minutes: number | null;
  run_items?: RunItem[];
  loom?: Loom;
}

export interface RunItem {
  id: string;
  run_id: string | null;
  job_id: string | null;
  position: string | null;
  width_mm: number | null;
  job?: Job;
}

export interface WidthAllocation {
  job1: number;
  job2: number;
  waste: number;
  fits: boolean;
}

export interface RunScore {
  score: number;
  wastePercent: number;
  changeoverClass: 'low' | 'medium' | 'high';
}
