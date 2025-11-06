import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { UserEvent } from '../interfaces/events.interfaces';

@Injectable()
export class DruidService {
  private readonly logger = new Logger(DruidService.name);
  private readonly druidQueryUrl: string;
  private readonly druidIngestUrl: string;
  private readonly druidTaskStatusUrl: string;

  constructor(private readonly http: HttpService) {
    const baseUrl = process.env.DRUID_HOST || 'http://localhost:8888';
    this.druidQueryUrl = `${baseUrl}/druid/v2/sql`;
    this.druidIngestUrl = `${baseUrl}/druid/indexer/v1/task`;
    this.druidTaskStatusUrl = `${baseUrl}/druid/indexer/v1/task`;
  }

  async query(sql: string) {
    try {
      const safeSql = sql.replace(/\s+/g, ' ').trim();
      this.logger.debug(`🧩 Ejecutando SQL: ${safeSql}`);
      const response = await this.http.axiosRef.post(
        this.druidQueryUrl,
        { query: safeSql },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error querying Druid', error.response?.data || error);
      throw new Error('Failed to query Druid');
    }
  }

  buildWhereClause(filters: Record<string, any>): string {
    const conditions: string[] = [];
    const map: Record<string, string> = {
      user_id: 'user_id',
      course_id: 'course_id',
      exercise_id: 'exercise_id',
      country: 'country',
      event_type: 'event_type',
      error_type: 'error_type',
      device: 'device',
    };

    for (const key in map) {
      if (filters[key]) conditions.push(`${map[key]} = '${filters[key]}'`);
    }

    if (filters.start && filters.end) {
      conditions.push(
        `__time BETWEEN TIMESTAMP '${filters.start}' AND TIMESTAMP '${filters.end}'`,
      );
    } else if (filters.start) {
      conditions.push(`__time >= TIMESTAMP '${filters.start}'`);
    } else if (filters.end) {
      conditions.push(`__time <= TIMESTAMP '${filters.end}'`);
    }

    conditions.push('(is_deleted IS NULL OR is_deleted = false)');

    return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  async ingestEvents(events: UserEvent | UserEvent[]) {
    const eventsArray = Array.isArray(events) ? events : [events];

    const spec = {
      type: 'index_parallel',
      spec: {
        dataSchema: {
          dataSource: 'user_events',
          timestampSpec: { column: 'timestamp', format: 'auto' },
          dimensionsSpec: {
            dimensions: [
              'event_id',
              'user_id',
              'course_id',
              'exercise_id',
              'event_type',
              'error_type',
              'device',
              'country',
              'is_deleted',
            ],
          },
          metricsSpec: [
            {
              name: 'duration_seconds',
              type: 'doubleSum',
              fieldName: 'duration_seconds',
            },
            { name: 'score', type: 'doubleSum', fieldName: 'score' },
          ],
          granularitySpec: {
            type: 'uniform',
            segmentGranularity: 'day',
            queryGranularity: 'none',
            rollup: false,
          },
          reportParseExceptions: true,
        },
        ioConfig: {
          type: 'index_parallel',
          inputSource: {
            type: 'inline',
            data: eventsArray.map((e) => JSON.stringify(e)).join('\n'),
          },
          inputFormat: { type: 'json' },
          appendToExisting: true,
        },
        tuningConfig: { type: 'index_parallel' },
      },
    };

    try {
      this.logger.log(
        `📤 Enviando ingesta de ${eventsArray.length} evento(s) a Druid`,
      );
      const response = await this.http.axiosRef.post(this.druidIngestUrl, spec);
      this.logger.log(`✅ Ingestión enviada: ${response.data.task}`);
      return response.data;
    } catch (error) {
      this.logger.error('❌ Error ingesting events', error);
      throw new Error('Failed to ingest events into Druid', error);
    }
  }

  async getTaskStatus(taskId: string) {
    try {
      const response = await this.http.axiosRef.get(
        `${this.druidTaskStatusUrl}/${taskId}/status`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error getting task status',
        error.response?.data || error,
      );
      throw new Error('Failed to get task status');
    }
  }

  async getAllEvents(limit = 20) {
    return this.query(`
      SELECT * FROM user_events
      WHERE is_deleted IS NULL OR is_deleted = false
      ORDER BY "__time" DESC
      LIMIT ${limit}
    `);
  }

  async waitForDatasource(name: string, timeoutMs = 60000) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      try {
        const baseUrl = process.env.DRUID_HOST || 'http://localhost:8081';
        const res = await this.http.axiosRef.get(
          `${baseUrl}/druid/coordinator/v1/datasources`,
        );

        this.logger.debug(
          `🟡 Druid datasources response: ${JSON.stringify(res.data)}`,
        );

        if (Array.isArray(res.data)) {
          const names = res.data.map((d: any) =>
            typeof d === 'string' ? d : d.name,
          );
          if (names.includes(name)) {
            this.logger.log(`✅ Datasource "${name}" disponible`);
            return true;
          }
        }
      } catch (err) {
        this.logger.warn(`Waiting for Druid coordinator... ${err.message}`);
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    throw new Error(
      `Datasource "${name}" not available after ${timeoutMs / 1000}s`,
    );
  }

  async getErrorsPerType(filters: any = {}) {
    const where = this.buildWhereClause({ ...filters, event_type: 'error' });
    return this.query(`
      SELECT error_type, COUNT(*) AS total
      FROM user_events
      ${where}
      GROUP BY error_type
      ORDER BY total DESC
    `);
  }

  async getEventsPerType(filters: any = {}) {
    const where = this.buildWhereClause(filters);
    return this.query(`
      SELECT event_type, COUNT(*) AS total
      FROM user_events
      ${where}
      GROUP BY event_type
      ORDER BY total DESC
    `);
  }

  async getScoreTrends(filters: any = {}, period = 'daily') {
    const timeFormat =
      period === 'monthly'
        ? "TIME_FORMAT(__time, 'yyyy-MM')"
        : period === 'weekly'
          ? "TIME_FORMAT(__time, 'yyyy-ww')"
          : "TIME_FORMAT(__time, 'yyyy-MM-dd')";

    const where = this.buildWhereClause(filters);
    return this.query(`
      SELECT ${timeFormat} AS date, AVG(score) AS avg_score
      FROM user_events
      ${where}
      GROUP BY ${timeFormat}
      ORDER BY date
    `);
  }

  async getUserActivity(filters: any = {}) {
    const where = this.buildWhereClause(filters);
    return this.query(`
      SELECT user_id, COUNT(*) AS events
      FROM user_events
      ${where}
      GROUP BY user_id
      ORDER BY events DESC
    `);
  }

  async getDevices(filters: any = {}) {
    const where = this.buildWhereClause(filters);
    return this.query(`
      SELECT device, COUNT(*) AS total
      FROM user_events
      ${where}
      GROUP BY device
      ORDER BY total DESC
    `);
  }

  async getSummary(filters: any = {}) {
    const where = this.buildWhereClause(filters);
    const [result] = await this.query(`
      SELECT
        COUNT(*) AS total_events,
        COUNT(DISTINCT user_id) AS unique_users,
        AVG(score) AS average_score,
        AVG(duration_seconds) AS average_duration,
        SUM(CASE WHEN event_type = 'attempt' THEN 1 ELSE 0 END) AS attempts,
        SUM(CASE WHEN event_type = 'error' THEN 1 ELSE 0 END) AS errors
      FROM user_events
      ${where}
    `);
    return result;
  }

  async getErrorRateByExercise(filters: any = {}) {
    const where = this.buildWhereClause(filters);
    return this.query(`
      SELECT exercise_id,
             (SUM(CASE WHEN event_type = 'error' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS error_rate
      FROM user_events
      ${where}
      GROUP BY exercise_id
      ORDER BY error_rate DESC
    `);
  }
}
