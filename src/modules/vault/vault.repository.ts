import { Injectable } from '@nestjs/common';
import { Prisma, PublishStatus, VaultItemType } from '@prisma/client';
import { uuidv7 } from '../../common/utils/uuidv7';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { VaultItemsQueryDto } from './vault.dto';

const VAULT_ITEM_INCLUDE = {
  folder: true,
  tags: { include: { vaultTag: true } },
  content: {
    include: {
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  },
} satisfies Prisma.VaultItemInclude;

@Injectable()
export class VaultRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listItems(userId: string, query: VaultItemsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const keyword = query.q?.trim();

    const where: Prisma.VaultItemWhereInput = {
      userId,
      ...(query.folderId ? { folderId: query.folderId } : {}),
      ...(query.itemType ? { itemType: query.itemType } : {}),
      ...(query.tag
        ? {
            tags: {
              some: {
                vaultTag: { userId, name: query.tag.trim() },
              },
            },
          }
        : {}),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { memo: { contains: keyword, mode: 'insensitive' } },
              { description: { contains: keyword, mode: 'insensitive' } },
              { url: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vaultItem.findMany({
        where,
        include: VAULT_ITEM_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.vaultItem.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  findPublishedContentById(contentId: string) {
    return this.prisma.content.findFirst({
      where: { id: contentId, publishStatus: PublishStatus.PUBLISHED, deletedAt: null },
    });
  }

  findFolderByIdForUser(userId: string, folderId: string) {
    return this.prisma.vaultFolder.findFirst({
      where: { id: folderId, userId },
    });
  }

  findItemByUserAndContent(userId: string, contentId: string) {
    return this.prisma.vaultItem.findFirst({
      where: { userId, contentId },
    });
  }

  findItemByUserAndNormalizedUrl(userId: string, normalizedUrl: string) {
    return this.prisma.vaultItem.findFirst({
      where: { userId, normalizedUrl },
    });
  }

  findItemByIdForUser(userId: string, id: string) {
    return this.prisma.vaultItem.findFirst({
      where: { id, userId },
      include: VAULT_ITEM_INCLUDE,
    });
  }

  async createItem(params: {
    userId: string;
    itemType: VaultItemType;
    contentId?: string | null;
    folderId?: string | null;
    url?: string | null;
    normalizedUrl?: string | null;
    title: string;
    description?: string | null;
    faviconUrl?: string | null;
    memo?: string | null;
    tagNames?: string[];
  }) {
    const id = uuidv7();
    return this.prisma.$transaction(async (tx) => {
      await tx.vaultItem.create({
        data: {
          id,
          userId: params.userId,
          itemType: params.itemType,
          contentId: params.contentId ?? null,
          folderId: params.folderId ?? null,
          url: params.url ?? null,
          normalizedUrl: params.normalizedUrl ?? null,
          title: params.title,
          description: params.description ?? null,
          faviconUrl: params.faviconUrl ?? null,
          memo: params.memo ?? null,
        },
      });

      if (params.tagNames && params.tagNames.length > 0) {
        await this.syncItemTags(tx, params.userId, id, params.tagNames);
      }

      return tx.vaultItem.findUniqueOrThrow({
        where: { id },
        include: VAULT_ITEM_INCLUDE,
      });
    });
  }

  async updateItem(
    userId: string,
    id: string,
    data: {
      title?: string;
      memo?: string | null;
      folderId?: string | null;
      tagNames?: string[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.vaultItem.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.memo !== undefined ? { memo: data.memo } : {}),
          ...(data.folderId !== undefined ? { folderId: data.folderId } : {}),
        },
      });

      if (data.tagNames !== undefined) {
        await tx.vaultItemTag.deleteMany({ where: { vaultItemId: id } });
        if (data.tagNames.length > 0) {
          await this.syncItemTags(tx, userId, id, data.tagNames);
        }
      }

      return tx.vaultItem.findUniqueOrThrow({
        where: { id },
        include: VAULT_ITEM_INCLUDE,
      });
    });
  }

  deleteItem(id: string) {
    return this.prisma.vaultItem.delete({ where: { id } });
  }

  listFolders(userId: string) {
    return this.prisma.vaultFolder.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findFolderByUserAndName(userId: string, name: string) {
    return this.prisma.vaultFolder.findUnique({
      where: { userId_name: { userId, name } },
    });
  }

  createFolder(userId: string, name: string, sortOrder = 0) {
    return this.prisma.vaultFolder.create({
      data: {
        id: uuidv7(),
        userId,
        name,
        sortOrder,
      },
      include: { _count: { select: { items: true } } },
    });
  }

  updateFolder(id: string, data: { name?: string; sortOrder?: number }) {
    return this.prisma.vaultFolder.update({
      where: { id },
      data,
      include: { _count: { select: { items: true } } },
    });
  }

  deleteFolder(id: string) {
    return this.prisma.vaultFolder.delete({ where: { id } });
  }

  listTags(userId: string) {
    return this.prisma.vaultTag.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    });
  }

  findTagByIdForUser(userId: string, id: string) {
    return this.prisma.vaultTag.findFirst({
      where: { id, userId },
    });
  }

  deleteTag(id: string) {
    return this.prisma.vaultTag.delete({ where: { id } });
  }

  private async syncItemTags(
    tx: Prisma.TransactionClient,
    userId: string,
    vaultItemId: string,
    rawNames: string[],
  ): Promise<void> {
    const names = [...new Set(rawNames.map((n) => n.trim()).filter(Boolean))];
    for (const name of names) {
      const tag = await tx.vaultTag.upsert({
        where: { userId_name: { userId, name } },
        update: {},
        create: { id: uuidv7(), userId, name },
      });
      await tx.vaultItemTag.create({
        data: { vaultItemId, vaultTagId: tag.id },
      });
    }
  }
}
