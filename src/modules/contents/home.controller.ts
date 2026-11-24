import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { ContentsService } from './contents.service';

@ApiTags('home')
@Controller('home')
export class HomeController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ operationId: 'getHome', summary: '홈 통합 데이터 조회' })
  getHome(@CurrentUser() user?: AuthUser) {
    return this.contentsService.getHome(user?.id);
  }
}
