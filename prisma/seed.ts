import { CategoryGroup, PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { uuidv7 } from '../src/common/utils/uuidv7';

const prisma = new PrismaClient();

const WORK_DOMAIN_CATEGORIES = [
  { slug: 'docs-reports', name: '문서·보고서', sortOrder: 1 },
  { slug: 'meetings-comms', name: '회의·커뮤니케이션', sortOrder: 2 },
  { slug: 'research', name: '리서치·정보조사', sortOrder: 3 },
  { slug: 'data-sheets', name: '데이터·스프레드시트', sortOrder: 4 },
  { slug: 'planning-slides', name: '기획·프레젠테이션', sortOrder: 5 },
  { slug: 'content-design', name: '콘텐츠·디자인', sortOrder: 6 },
];

const AI_USE_CATEGORIES = [
  { slug: 'writing-summary', name: '글쓰기·요약', sortOrder: 1 },
  { slug: 'search-analysis', name: '검색·분석', sortOrder: 2 },
  { slug: 'image-video', name: '이미지·영상', sortOrder: 3 },
  { slug: 'audio-meetings', name: '음성·회의록', sortOrder: 4 },
  { slug: 'automation-workflow', name: '업무 자동화·도구 조합', sortOrder: 5 },
];

export async function runSeed(client: PrismaClient = prisma): Promise<void> {
  for (const item of WORK_DOMAIN_CATEGORIES) {
    await client.category.upsert({
      where: { slug: item.slug },
      update: {
        group: CategoryGroup.WORK_DOMAIN,
        name: item.name,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        id: uuidv7(),
        group: CategoryGroup.WORK_DOMAIN,
        slug: item.slug,
        name: item.name,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
  }

  for (const item of AI_USE_CATEGORIES) {
    await client.category.upsert({
      where: { slug: item.slug },
      update: {
        group: CategoryGroup.AI_USE,
        name: item.name,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        id: uuidv7(),
        group: CategoryGroup.AI_USE,
        slug: item.slug,
        name: item.name,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@alkok.dobbymin.cloud').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMeAdmin123!';
  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await client.user.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      id: uuidv7(),
      email: adminEmail,
      passwordHash,
      nickname: '알콕 관리자',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });
}

if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('[seed] Completed successfully');
    })
    .catch((err: unknown) => {
      console.error('[seed] Failed:', err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
