import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CreateBookmarkDto,
  CreateExternalUrlDto,
  CreateVaultFolderDto,
  PreviewUrlDto,
  UpdateVaultFolderDto,
  UpdateVaultItemDto,
  VaultItemsQueryDto,
} from './vault.dto';
import { VaultPreviewService } from './vault-preview.service';
import { VaultService } from './vault.service';

@ApiTags('vault')
@ApiBearerAuth()
@Controller('vault')
@UseGuards(JwtAuthGuard)
export class VaultController {
  constructor(
    private readonly vaultService: VaultService,
    private readonly vaultPreviewService: VaultPreviewService,
  ) {}

  @Post('preview-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'previewVaultUrl',
    summary: '외부 URL OG 메타 파싱 (SSRF 방어 + Fallback)',
  })
  previewUrl(@CurrentUser() user: AuthUser, @Body() dto: PreviewUrlDto) {
    return this.vaultPreviewService.previewUrl(user.id, dto.url);
  }

  @Get('items')
  @ApiOperation({ operationId: 'listVaultItems', summary: '보관함 항목 목록' })
  listItems(@CurrentUser() user: AuthUser, @Query() query: VaultItemsQueryDto) {
    return this.vaultService.listItems(user.id, query);
  }

  @Post('items/bookmark')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'createVaultBookmark', summary: '알콕 콘텐츠 북마크 저장' })
  createBookmark(@CurrentUser() user: AuthUser, @Body() dto: CreateBookmarkDto) {
    return this.vaultService.createBookmark(user.id, dto);
  }

  @Post('items/external-url')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'createVaultExternalUrl', summary: '외부 URL 저장' })
  createExternalUrl(@CurrentUser() user: AuthUser, @Body() dto: CreateExternalUrlDto) {
    return this.vaultService.createExternalUrl(user.id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ operationId: 'updateVaultItem', summary: '보관함 항목 수정' })
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateVaultItemDto,
  ) {
    return this.vaultService.updateItem(user.id, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ operationId: 'deleteVaultItem', summary: '보관함 항목 Hard Delete' })
  deleteItem(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vaultService.deleteItem(user.id, id);
  }

  @Get('folders')
  @ApiOperation({ operationId: 'listVaultFolders', summary: '보관함 폴더 목록' })
  listFolders(@CurrentUser() user: AuthUser) {
    return this.vaultService.listFolders(user.id);
  }

  @Post('folders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'createVaultFolder', summary: '보관함 폴더 생성' })
  createFolder(@CurrentUser() user: AuthUser, @Body() dto: CreateVaultFolderDto) {
    return this.vaultService.createFolder(user.id, dto);
  }

  @Patch('folders/:id')
  @ApiOperation({ operationId: 'updateVaultFolder', summary: '보관함 폴더 수정' })
  updateFolder(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateVaultFolderDto,
  ) {
    return this.vaultService.updateFolder(user.id, id, dto);
  }

  @Delete('folders/:id')
  @ApiOperation({ operationId: 'deleteVaultFolder', summary: '보관함 폴더 삭제' })
  deleteFolder(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vaultService.deleteFolder(user.id, id);
  }

  @Get('tags')
  @ApiOperation({ operationId: 'listVaultTags', summary: '보관함 태그 목록' })
  listTags(@CurrentUser() user: AuthUser) {
    return this.vaultService.listTags(user.id);
  }

  @Delete('tags/:id')
  @ApiOperation({ operationId: 'deleteVaultTag', summary: '보관함 태그 삭제' })
  deleteTag(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vaultService.deleteTag(user.id, id);
  }
}
