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

  private buildParams(filters: Record<string, any>): HttpParams {
    let params = new HttpParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params = params.set(k, String(v));
    });
    return params;
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
