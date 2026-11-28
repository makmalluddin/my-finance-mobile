import { useCallback, useState } from 'react';
import { categoryService } from '@/appservices/category/categoryService';
import { toAppError } from '@/shared/utils/errors';

const EMPTY_CATEGORIES = { income: [], expense: [] };

export function useCategories() {
  const [categories, setCategories] = useState(EMPTY_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await categoryService.listCategoriesByType();
      setCategories(data);
      return data;
    } catch (loadError) {
      setError(toAppError(loadError).message);
      return EMPTY_CATEGORIES;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    categories,
    loading,
    error,
    refresh,
    clearError: () => setError(null),
  };
}

export default useCategories;
