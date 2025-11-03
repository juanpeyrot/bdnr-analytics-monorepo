import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { EventsService } from '../services/events.service';
import type { UserEvent } from '../interfaces/events.interfaces';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(@Query('limit') limit = 20) {
    return this.eventsService.findAll(Number(limit));
  }

  @Post()
  create(@Body() event: UserEvent) {
    return this.eventsService.create(event);
  }
}
