import { Module } from '@nestjs/common';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { DruidService } from './services/druid.service';
import { HttpModule } from '@nestjs/axios';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  imports: [HttpModule],
  controllers: [EventsController, AnalyticsController],
  providers: [EventsService, DruidService],
})
export class EventsModule {}
