import { categoryRepository } from '@/data/repositories/categoryRepository';
import { AppError, getErrorMessage } from '@/shared/utils/errors';

const CATEGORY_TYPES = new Set(['income', 'expense']);

/**
 * Kategori sistem hanya dibaca. Pengelolaan kategori kustom tidak termasuk MVP.
 */
export const categoryService = {
  listCategories(type) {
    if (type !== undefined && !CATEGORY_TYPES.has(type)) {
      throw new AppError('VALIDATION_ERROR', getErrorMessage('VALIDATION_ERROR'), {
        details: { field: 'type', value: type },
      });
    }
    return categoryRepository.listCategories(type);
  },

  async listCategoriesByType() {
    const categories = await categoryRepository.listCategories();
    return {
      income: categories.filter((category) => category.type === 'income'),
      expense: categories.filter((category) => category.type === 'expense'),
    };
  },
};

export default categoryService;
