alter table public.asespro_properties
  add column if not exists has_garage boolean not null default false,
  add column if not exists has_patio boolean not null default false,
  add column if not exists has_laundry boolean not null default false,
  add column if not exists has_living boolean not null default false,
  add column if not exists has_dining boolean not null default false,
  add column if not exists has_kitchen boolean not null default false,
  add column if not exists has_balcony boolean not null default false,
  add column if not exists has_security boolean not null default false,
  add column if not exists has_pool boolean not null default false;
