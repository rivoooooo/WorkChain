import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const BUCKET_NAME = 'company-assets';

export interface UploadOptions {
  companyId: string;
  file: Buffer | ArrayBuffer | Blob;
  fileName: string;
  contentType?: string;
  type?: 'logo' | 'image' | 'document';
}

export interface UploadResult {
  url: string;
  storagePath: string;
}

/**
 * 上传图片/文件至 Supabase Object Storage (company-assets)
 */
export async function uploadCompanyMedia(options: UploadOptions): Promise<UploadResult> {
  const { companyId, file, fileName, contentType, type = 'image' } = options;

  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'png';
  const uniqueId = globalThis.crypto.randomUUID();
  const safeFileName = `${type}_${uniqueId}.${ext}`;
  const storagePath = `companies/${companyId}/${safeFileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: contentType || 'image/png',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload company asset to Supabase Storage: ${error.message}`);
  }

  // 获取可公开访问的 Public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return {
    url: publicUrlData.publicUrl,
    storagePath: data.path,
  };
}
