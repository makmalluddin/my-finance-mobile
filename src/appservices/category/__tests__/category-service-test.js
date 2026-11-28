import { categoryService } from '@/appservices/category/categoryService';
import { categoryRepository } from '@/data/repositories/categoryRepository';

jest.mock('@/data/repositories/categoryRepository', () => ({
  categoryRepository: {
    listCategories: jest.fn(),
  },
}));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('categoryService', () => {
  test('listCategories meneruskan filter tipe yang valid', async () => {
    categoryRepository.listCategories.mockResolvedValue([
      { id: '1', type: 'income', name: 'Salary' },
    ]);

    const result = await categoryService.listCategories('income');

    expect(categoryRepository.listCategories).toHaveBeenCalledWith('income');
    expect(result).toHaveLength(1);
  });

  test('tipe kategori selain income/expense ditolak', async () => {
    expect(() => categoryService.listCategories('transfer')).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
    expect(categoryRepository.listCategories).not.toHaveBeenCalled();
  });

  test('listCategoriesByType mengelompokkan kategori sistem', async () => {
    categoryRepository.listCategories.mockResolvedValue([
      { id: '1', type: 'income', name: 'Salary' },
      { id: '2', type: 'expense', name: 'Food' },
      { id: '3', type: 'expense', name: 'Bills' },
    ]);

    const result = await categoryService.listCategoriesByType();

    expect(result.income.map((item) => item.name)).toEqual(['Salary']);
    expect(result.expense.map((item) => item.name)).toEqual(['Food', 'Bills']);
  });
});
