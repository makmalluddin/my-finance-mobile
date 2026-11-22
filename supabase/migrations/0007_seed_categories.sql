-- 0007_seed_categories.sql
-- Seed 10 Category sistem. Idempoten: konflik pada (type, name) hanya
-- memperbarui urutan dan status aktif.

insert into public.categories (id, type, name, sort_order, is_active)
values
  ('00000000-0000-0000-0000-000000000101', 'income',  'Salary',         1, true),
  ('00000000-0000-0000-0000-000000000102', 'income',  'Freelance',      2, true),
  ('00000000-0000-0000-0000-000000000103', 'income',  'Bonus',          3, true),
  ('00000000-0000-0000-0000-000000000104', 'income',  'Other Income',   4, true),
  ('00000000-0000-0000-0000-000000000201', 'expense', 'Food',           1, true),
  ('00000000-0000-0000-0000-000000000202', 'expense', 'Transportation', 2, true),
  ('00000000-0000-0000-0000-000000000203', 'expense', 'Bills',          3, true),
  ('00000000-0000-0000-0000-000000000204', 'expense', 'Shopping',       4, true),
  ('00000000-0000-0000-0000-000000000205', 'expense', 'Entertainment',  5, true),
  ('00000000-0000-0000-0000-000000000206', 'expense', 'Other',          6, true)
on conflict (type, name) do update
set
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
