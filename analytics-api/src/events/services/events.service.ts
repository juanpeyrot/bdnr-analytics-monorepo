import { Injectable } from '@nestjs/common';
import { DruidService } from './druid.service';
import { UserEvent } from '../interfaces/events.interfaces';

@Injectable()
export class EventsService {
  constructor(private readonly druidService: DruidService) {}

  async findAll(limit = 20) {
    return this.druidService.getAllEvents(limit);
  }

  async create(event: UserEvent) {
    const task = await this.druidService.ingestEvents(event);
    const taskId = task.task;

    for (let i = 0; i < 30; i++) {
      const status = await this.druidService.getTaskStatus(taskId);
      if (status.status.status === 'SUCCESS') {
        console.log('✅ Ingestión completada');
        break;
      }
      if (status.status.status === 'FAILED') {
        throw new Error('❌ Ingestión falló en Druid');
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    await this.druidService.waitForDatasource('user_events', 60000);

    return this.druidService.getAllEvents(10);
  }
}
