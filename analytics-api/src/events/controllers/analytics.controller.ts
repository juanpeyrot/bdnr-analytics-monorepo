import { Controller, Get, Query } from '@nestjs/common';
import { DruidService } from '../services/druid.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly druid: DruidService) {}

  private buildFilters(query: Record<string, any>): string {
    const filters: string[] = [];

    const fields = [
      'user_id',
      'course_id',
      'exercise_id',
      'country',
      'event_type',
      'error_type',
      'device',
    ];

    for (const field of fields) {
      if (query[field]) {
        filters.push(`${field} = '${query[field]}'`);
      }
    }

    if (query.start) filters.push(`__time >= TIMESTAMP '${query.start}'`);
    if (query.end) filters.push(`__time <= TIMESTAMP '${query.end}'`);

    return filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  }

  @Get('summary')
  async getSummary(@Query() query: Record<string, any>) {
    const where = this.buildFilters(query);
    return this.druid.query(`
      SELECT
        COUNT(*) AS total_events,
        COUNT(DISTINCT user_id) AS unique_users,
        AVG(score) AS average_score,
        AVG(duration_seconds) AS average_duration,
        SUM(CASE WHEN event_type = 'attempt' THEN 1 ELSE 0 END) AS attempts,
        SUM(CASE WHEN event_type = 'error' THEN 1 ELSE 0 END) AS errors
      FROM "user_events"
      ${where}
    `);
  }

  @Get('events-per-type')
  async getEventsPerType(@Query() query: Record<string, any>) {
    const where = this.buildFilters(query);
    return this.druid.query(`
      SELECT event_type, COUNT(*) AS total
      FROM user_events
      ${where}
      GROUP BY event_type
      ORDER BY total DESC
    `);
  }

  @Get('errors')
  async getErrors(@Query() query: Record<string, any>) {
    const where = this.buildFilters(query);
    return this.druid.query(`
      SELECT error_type, COUNT(*) AS total
      FROM user_events
      ${where ? where + " AND event_type = 'error'" : "WHERE event_type = 'error'"}
      GROUP BY error_type
      ORDER BY total DESC
    `);
  }

  @Get('score-trends')
  async getScoreTrends(@Query() query: Record<string, any>) {
    const where = this.buildFilters(query);
    const period = query.period || 'daily';

    const timeFloor =
      period === 'weekly'
        ? "TIME_FLOOR(__time, 'P1W')"
        : period === 'monthly'
          ? "TIME_FLOOR(__time, 'P1M')"
          : "TIME_FLOOR(__time, 'P1D')";

    return this.druid.query(`
		SELECT "date", AVG(score) AS avg_score
		FROM (
			SELECT TIME_FLOOR(__time, 'P1D') AS "date", score
			FROM user_events
		) AS t
		GROUP BY "date"
		ORDER BY "date" ASC
		`);
  }

  @Get('user-activity')
  async getUserActivity(@Query() query: Record<string, any>) {
    const where = this.buildFilters(query);
    return this.druid.query(`
      SELECT user_id, COUNT(*) AS events
      FROM user_events
      ${where}
      GROUP BY user_id
      ORDER BY events DESC
    `);
  }

  @Get('devices')
  async getDevices(@Query() query: Record<string, any>) {
    const where = this.buildFilters(query);
    return this.druid.query(`
      SELECT device, COUNT(*) AS total
      FROM user_events
      ${where}
      GROUP BY device
      ORDER BY total DESC
    `);
  }

  @Get('countries')
  async getCountries(@Query() query: Record<string, any>) {
    const where = this.buildFilters(query);
    return this.druid.query(`
      SELECT country, COUNT(*) AS total
      FROM user_events
      ${where}
      GROUP BY country
      ORDER BY total DESC
    `);
  }

  @Get('exercises/top')
  async getTopExercises(@Query() query: Record<string, any>) {
    const where = this.buildFilters(query);
    return this.druid.query(`
      SELECT exercise_id, COUNT(*) AS attempts,
             SUM(CASE WHEN event_type = 'error' THEN 1 ELSE 0 END) AS errors
      FROM user_events
      ${where}
      GROUP BY exercise_id
      ORDER BY attempts DESC
      LIMIT 10
    `);
  }
}
