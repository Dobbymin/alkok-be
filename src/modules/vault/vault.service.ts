import { HttpStatus, Injectable } from '@nestjs/common';
import { VaultItemType } from '@prisma/client';
import { buildPaginationMeta } from '../../common/dto/pagination.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { mapContentSummary } from '../../common/utils/content-mapper.util';
import { normalizeUrl } from '../../common/utils/normalize-url';
import type {
  CreateBookmarkDto,
  CreateExternalUrlDto,
  CreateVaultFolderDto,
  UpdateVaultFolderDto,
  UpdateVaultItemDto,
  VaultItemsQueryDto,
} from './vault.dto';
import { VaultRepository } from './vault.repository';

type VaultItemRow = Awaited<ReturnType<VaultRepository['listItems']>>['items'][number];

@Injectable()
export class VaultService {
  constructor(private readonly vaultRepository: VaultRepository) {}

  async listItems(userId: string, query: VaultItemsQueryDto) {
    const result = await this.vaultRepository.listItems(userId, query);
    return {
      data: result.items.map((item) => this.mapVaultItem(item)),
      meta: buildPaginationMeta(result.page, result.limit, result.total),
    };
  }

  async createBookmark(userId: string, dto: CreateBookmarkDto) {
    const content = await this.vaultRepository.findPublishedContentById(dto.contentId);
    if (!content) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '콘텐츠를 찾을 수 없습니다.',
      );
    }

    if (dto.folderId) {
      await this.assertFolderOwnership(userId, dto.folderId);
    }

    const existing = await this.vaultRepository.findItemByUserAndContent(userId, dto.contentId);
    if (existing) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'VAULT_DUPLICATE_BOOKMARK',
        '이미 보관함에 저장된 콘텐츠입니다.',
        { existingItemId: existing.id },
      );
    }

    const created = await this.vaultRepository.createItem({
      userId,
      itemType: VaultItemType.INTERNAL_CONTENT,
      contentId: content.id,
      folderId: dto.folderId ?? null,
      title: content.title,
      description: content.summary,
      memo: dto.memo ?? null,
      tagNames: dto.tagNames,
    });
    return this.mapVaultItem(created);
  }

  async createExternalUrl(userId: string, dto: CreateExternalUrlDto) {
    const normalizedUrl = normalizeUrl(dto.url);

    if (dto.folderId) {
      await this.assertFolderOwnership(userId, dto.folderId);
    }

    const existing = await this.vaultRepository.findItemByUserAndNormalizedUrl(
      userId,
      normalizedUrl,
    );
    if (existing) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'VAULT_DUPLICATE_URL',
        '이미 보관함에 저장된 URL입니다.',
        { existingItemId: existing.id },
      );
    }

    const created = await this.vaultRepository.createItem({
      userId,
      itemType: VaultItemType.EXTERNAL_URL,
      folderId: dto.folderId ?? null,
      url: dto.url.trim(),
      normalizedUrl,
      title: dto.title.trim(),
      description: dto.description ?? dto.summary ?? null,
      faviconUrl: dto.faviconUrl ?? dto.thumbnailUrl ?? null,
      memo: dto.memo ?? null,
      tagNames: dto.tagNames,
    });
    return this.mapVaultItem(created);
  }

  async updateItem(userId: string, id: string, dto: UpdateVaultItemDto) {
    const existing = await this.vaultRepository.findItemByIdForUser(userId, id);
    if (!existing) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '보관함 항목을 찾을 수 없습니다.');
    }

    if (dto.folderId) {
      await this.assertFolderOwnership(userId, dto.folderId);
    }

    const updated = await this.vaultRepository.updateItem(userId, id, {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.memo !== undefined ? { memo: dto.memo } : {}),
      ...(dto.folderId !== undefined ? { folderId: dto.folderId } : {}),
      ...(dto.tagNames !== undefined ? { tagNames: dto.tagNames } : {}),
    });
    return this.mapVaultItem(updated);
  }

  async deleteItem(userId: string, id: string): Promise<{ deleted: boolean }> {
    const existing = await this.vaultRepository.findItemByIdForUser(userId, id);
    if (!existing) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '보관함 항목을 찾을 수 없습니다.');
    }
    await this.vaultRepository.deleteItem(id);
    return { deleted: true };
  }

  async listFolders(userId: string) {
    const folders = await this.vaultRepository.listFolders(userId);
    return folders.map((f) => ({
      id: f.id,
      name: f.name,
      sortOrder: f.sortOrder,
      itemCount: f._count.items,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  async createFolder(userId: string, dto: CreateVaultFolderDto) {
    const name = dto.name.trim();
    const existing = await this.vaultRepository.findFolderByUserAndName(userId, name);
    if (existing) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'VAULT_FOLDER_DUPLICATE',
        '동일한 이름의 폴더가 이미 존재합니다.',
      );
    }
    const created = await this.vaultRepository.createFolder(userId, name, dto.sortOrder ?? 0);
    return {
      id: created.id,
      name: created.name,
      sortOrder: created.sortOrder,
      itemCount: created._count.items,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async updateFolder(userId: string, id: string, dto: UpdateVaultFolderDto) {
    await this.assertFolderOwnership(userId, id);
    const trimmedName = dto.name?.trim();
    if (trimmedName) {
      const dup = await this.vaultRepository.findFolderByUserAndName(userId, trimmedName);
      if (dup && dup.id !== id) {
        throw new AppException(
          HttpStatus.CONFLICT,
          'VAULT_FOLDER_DUPLICATE',
          '동일한 이름의 폴더가 이미 존재합니다.',
        );
      }
    }

    const updated = await this.vaultRepository.updateFolder(id, {
      ...(trimmedName !== undefined ? { name: trimmedName } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
    });
    return {
      id: updated.id,
      name: updated.name,
      sortOrder: updated.sortOrder,
      itemCount: updated._count.items,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async deleteFolder(userId: string, id: string): Promise<{ deleted: boolean }> {
    await this.assertFolderOwnership(userId, id);
    await this.vaultRepository.deleteFolder(id);
    return { deleted: true };
  }

  async listTags(userId: string) {
    const tags = await this.vaultRepository.listTags(userId);
    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      itemCount: t._count.items,
    }));
  }

  async deleteTag(userId: string, id: string): Promise<{ deleted: boolean }> {
    const existing = await this.vaultRepository.findTagByIdForUser(userId, id);
    if (!existing) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '태그를 찾을 수 없습니다.');
    }
    await this.vaultRepository.deleteTag(id);
    return { deleted: true };
  }

  private async assertFolderOwnership(userId: string, folderId: string) {
    const folder = await this.vaultRepository.findFolderByIdForUser(userId, folderId);
    if (!folder) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '폴더를 찾을 수 없습니다.');
    }
    return folder;
  }

  private mapVaultItem(row: VaultItemRow) {
    return {
      id: row.id,
      itemType: row.itemType,
      contentId: row.contentId,
      content: row.content ? mapContentSummary(row.content, { isBookmarked: true }) : null,
      url: row.url,
      normalizedUrl: row.normalizedUrl,
      externalUrl: row.url,
      title: row.title,
      description: row.description,
      summary: row.description,
      faviconUrl: row.faviconUrl,
      thumbnailUrl: row.faviconUrl,
      memo: row.memo,
      folderId: row.folderId,
      folderName: row.folder?.name ?? null,
      tags: row.tags.map((t) => ({ id: t.vaultTag.id, name: t.vaultTag.name })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
