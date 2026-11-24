import { Module } from '@nestjs/common';
import { AdminContentsController } from './admin-contents.controller';
import { AdminContentsRepository } from './admin-contents.repository';
import { AdminContentsService } from './admin-contents.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersRepository } from './admin-users.repository';
import { AdminUsersService } from './admin-users.service';

@Module({
  controllers: [AdminContentsController, AdminUsersController],
  providers: [
    AdminContentsService,
    AdminContentsRepository,
    AdminUsersService,
    AdminUsersRepository,
  ],
  exports: [AdminContentsService, AdminContentsRepository],
})
export class AdminModule {}
