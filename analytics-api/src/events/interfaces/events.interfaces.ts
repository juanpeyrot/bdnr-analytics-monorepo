export interface UserEvent {
  event_id: string;
  timestamp: string;
  user_id: string;
  course_id: string;
  exercise_id: string;
  event_type: 'attempt' | 'time_usage' | 'error' | string;
  duration_seconds: number;
  score: number | null;
  error_type: string | null;
  device: string;
  country: string;
  is_deleted?: boolean;
}
