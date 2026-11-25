import { AppException } from '../../common/exceptions/app.exception';
import { SafeFetchService } from '../../common/utils/safe-fetch';
import { VaultService } from './vault.service';
import type { VaultRepository } from './vault.repository';

describe('VaultService SSRF guard on createExternalUrl', () => {
  const createRepoMock = () =>
    ({
      findItemByUserAndNormalizedUrl: jest.fn().mockResolvedValue(null),
      createItem: jest.fn().mockResolvedValue({
        id: 'item-1',
        itemType: 'EXTERNAL_URL',
        contentId: null,
        content: null,
        url: 'https://example.com',
        normalizedUrl: 'https://example.com',
        title: 'Example',
        description: null,
        faviconUrl: null,
        memo: null,
        folderId: null,
        folder: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    }) as unknown as VaultRepository;

  it.each(['http://127.0.0.1:8080', 'http://localhost:3000', 'http://169.254.169.254/latest'])(
    'blocks SSRF URL %s with 400 SSRF_BLOCKED_URL',
    async (blockedUrl) => {
      const service = new VaultService(createRepoMock(), new SafeFetchService());
      await expect(
        service.createExternalUrl('user-1', { url: blockedUrl, title: 'SSRF' }),
      ).rejects.toMatchObject({
        errorCode: 'SSRF_BLOCKED_URL',
      } satisfies Partial<AppException>);
    },
  );
});
