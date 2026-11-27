import { Module } from '@nestjs/common';
import { ContentsRepository } from './contents.repository';
import { ContentsService } from './contents.service';
import { GuidesController } from './guides.controller';
import { HomeController } from './home.controller';
import { NewsController } from './news.controller';
import { SkillsController } from './skills.controller';
import { ToolsController } from './tools.controller';

@Module({
  controllers: [
    HomeController,
    GuidesController,
    ToolsController,
    NewsController,
    SkillsController,
  ],
  providers: [ContentsService, ContentsRepository],
  exports: [ContentsService, ContentsRepository],
})
export class ContentsModule {}
