import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TIMEOUT_MS = 8000;
const USER_AGENT = 'AlkokBot/1.0 (+https://alkok.dobbymin.cloud)';

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    });
    if (res.status === 405 || res.status === 403 || res.status >= 500) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
      });
    }
    return { url, status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const contents = await prisma.content.findMany({
    where: { publishStatus: 'PUBLISHED', deletedAt: null },
    select: {
      slug: true,
      sourceUrl: true,
      toolDetail: { select: { officialUrl: true } },
    },
  });

  const urlSet = new Set();
  for (const row of contents) {
    if (row.sourceUrl) urlSet.add(row.sourceUrl);
    if (row.toolDetail?.officialUrl) urlSet.add(row.toolDetail.officialUrl);
  }

  const urls = [...urlSet];
  console.log(`[check:links] Checking ${urls.length} unique URLs from ${contents.length} published contents...`);

  const results = [];
  const concurrency = 6;
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((u) => checkUrl(u)));
    results.push(...batchResults);
  }

  const broken = results.filter((r) => !r.ok);
  for (const item of results) {
    const mark = item.ok ? 'OK' : 'FAIL';
    console.log(`  [${mark}] ${item.status} ${item.url}${item.error ? ` (${item.error})` : ''}`);
  }

  console.log(`[check:links] Summary: ${results.length - broken.length}/${results.length} OK, ${broken.length} broken`);
  if (broken.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error('[check:links] Fatal:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
