import { unstable_cache } from 'next/cache';
import { getCompanyById } from './db';

export const getCachedCompanyById = unstable_cache(
  async (companyId: string) => getCompanyById(companyId),
  ['company-by-id-v1'],
  {
    revalidate: 30,
    tags: ['companies'],
  }
);
