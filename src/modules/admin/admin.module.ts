import { Module } from '@nestjs/common';
import { AdminAiUsageController } from './admin-ai-usage.controller';
import { AdminContentsController } from './admin-contents.controller';
import { AdminContentsRepository } from './admin-contents.repository';
import { AdminContentsService } from './admin-contents.service';
import { AdminInboxController } from './admin-inbox.controller';
import { AdminInboxService } from './admin-inbox.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersRepository } from './admin-users.repository';
import { AdminUsersService } from './admin-users.service';

@Module({
  controllers: [
    AdminContentsController,
    AdminUsersController,
    AdminAiUsageController,
    AdminInboxController,
  ],
  providers: [
    AdminContentsService,
    AdminContentsRepository,
    AdminUsersService,
    AdminUsersRepository,
    AdminInboxService,
  ],
  exports: [AdminContentsService, AdminContentsRepository, AdminInboxService],
})
export class AdminModule {}
