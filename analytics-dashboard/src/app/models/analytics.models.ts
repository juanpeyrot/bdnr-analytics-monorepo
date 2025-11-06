export interface Summary {
  total_events: number;
  unique_users: number;
  average_score: number;
  average_duration: number;
  attempts: number;
  errors: number;
}

export interface EventCount {
  event_type: string;
  total: number;
}

export interface ErrorCount {
  error_type: string | null;
  total: number;
}

export interface ScorePoint {
  date: string;
  avg_score: number;
}

export interface UserActivity {
  user_id: string;
  events: number;
}

export interface DeviceCount {
  device: string;
  total: number;
}

export interface CountryCount {
  country: string;
  total: number;
}

export interface TopExercise {
  exercise_id: string;
  attempts: number;
  errors: number;
}
