import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Summary,
  EventCount,
  ErrorCount,
  ScorePoint,
  UserActivity,
  DeviceCount,
  CountryCount,
  TopExercise,
} from '../models/analytics.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private base = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  private generateEvent(i: number) {
    const users = ['U001', 'U002', 'U003', 'U004'];
    const courses = ['C001', 'C002', 'C003'];
    const exercises = ['E001', 'E002', 'E003', 'E004'];
    const devices = ['mobile', 'tablet', 'desktop'];
    const countries = ['Argentina', 'Uruguay', 'Chile', 'Paraguay'];
    const eventTypes = ['attempt', 'error'];
    const errorTypes = [null, 'timeout', 'wrong_answer', 'grammar'];

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const errorType =
      eventType === 'error' ? errorTypes[Math.floor(Math.random() * errorTypes.length)] : null;

    return {
      event_id: `EVT${2000 + i}`,
      timestamp: new Date(Date.now() - Math.random() * 1e9).toISOString(),
      user_id: users[Math.floor(Math.random() * users.length)],
      course_id: courses[Math.floor(Math.random() * courses.length)],
      exercise_id: exercises[Math.floor(Math.random() * exercises.length)],
      event_type: eventType,
      duration_seconds: Math.floor(Math.random() * 60),
      score: eventType === 'attempt' ? Math.floor(Math.random() * 100) : 0,
      error_type: errorType,
      device: devices[Math.floor(Math.random() * devices.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      is_deleted: false,
    };
  }

  private buildParams(filters: Record<string, any>): HttpParams {
    let params = new HttpParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params = params.set(k, String(v));
    });
    return params;
  }

  generateEvents(count: number = 200): Observable<any> {
    const events = Array.from({ length: count }, (_, i) => this.generateEvent(i));
    return this.http.post(`${this.base}/events`, events);
  }

  getSummary(filters: Record<string, any> = {}): Observable<Summary> {
    return this.http
      .get<Summary[]>(`${this.base}/analytics/summary`, {
        params: this.buildParams(filters),
      })
      .pipe(
        map((response) => {
          console.log('📥 Summary response:', response);
          return (
            response[0] || {
              total_events: 0,
              unique_users: 0,
              average_score: 0,
              average_duration: 0,
              attempts: 0,
              errors: 0,
            }
          );
        })
      );
  }

  getEventsPerType(filters: Record<string, any> = {}): Observable<EventCount[]> {
    return this.http.get<EventCount[]>(`${this.base}/analytics/events-per-type`, {
      params: this.buildParams(filters),
    });
  }

  getErrors(filters: Record<string, any> = {}): Observable<ErrorCount[]> {
    return this.http.get<ErrorCount[]>(`${this.base}/analytics/errors`, {
      params: this.buildParams(filters),
    });
  }

  getScoreTrends(filters: Record<string, any> = {}): Observable<ScorePoint[]> {
    return this.http.get<ScorePoint[]>(`${this.base}/analytics/score-trends`, {
      params: this.buildParams(filters),
    });
  }

  getUserActivity(filters: Record<string, any> = {}): Observable<UserActivity[]> {
    return this.http.get<UserActivity[]>(`${this.base}/analytics/user-activity`, {
      params: this.buildParams(filters),
    });
  }

  getDevices(filters: Record<string, any> = {}): Observable<DeviceCount[]> {
    return this.http.get<DeviceCount[]>(`${this.base}/analytics/devices`, {
      params: this.buildParams(filters),
    });
  }

  getCountries(filters: Record<string, any> = {}): Observable<CountryCount[]> {
    return this.http.get<CountryCount[]>(`${this.base}/analytics/countries`, {
      params: this.buildParams(filters),
    });
  }

  getTopExercises(filters: Record<string, any> = {}): Observable<TopExercise[]> {
    return this.http.get<TopExercise[]>(`${this.base}/analytics/exercises/top`, {
      params: this.buildParams(filters),
    });
  }
}
