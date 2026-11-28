import { supabase } from '@/data/supabase/client';
import { mapRepositoryError } from './error-mapper';

/**
 * Kategori sistem bersifat read-only. RLS hanya mengizinkan SELECT pada
 * kategori aktif, sehingga repository tidak menyediakan fungsi tulis.
 */
function mapCategory(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
  };
}

export const categoryRepository = {
  async listCategories(type) {
    let query = supabase
      .from('categories')
      .select('id, type, name, sort_order, is_active')
      .eq('is_active', true);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('sort_order', { ascending: true }).order('name');
    if (error) {
      throw mapRepositoryError(error, 'Gagal memuat daftar Category.');
    }
    return (data ?? []).map(mapCategory);
  },
};

export default categoryRepository;
