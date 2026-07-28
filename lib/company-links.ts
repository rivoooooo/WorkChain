import { db } from '../drizzle/db';
import { companyLinks } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export interface CreateCompanyLinkDTO {
  companyId: string;
  type: 'logo' | 'image' | 'url' | 'document';
  url: string;
  storagePath?: string;
  title?: string;
}

function generateLinkId(): string {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.randomUUID) {
    return 'link-' + globalThis.crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  }
  return 'link-' + Math.random().toString(36).substring(2, 14);
}

export async function addCompanyLink(dto: CreateCompanyLinkDTO) {
  const id = generateLinkId();
  const [newLink] = await db
    .insert(companyLinks)
    .values({
      id,
      company_id: dto.companyId,
      type: dto.type,
      url: dto.url,
      storage_path: dto.storagePath || null,
      title: dto.title || null,
    })
    .returning();

  return newLink;
}

export async function getCompanyLinks(companyId: string) {
  return await db
    .select()
    .from(companyLinks)
    .where(eq(companyLinks.company_id, companyId))
    .orderBy(desc(companyLinks.created_at));
}
