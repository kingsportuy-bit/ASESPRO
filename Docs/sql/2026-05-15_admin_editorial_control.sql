-- Panel profesional: control editorial de publicaciones, media y trazabilidad.
-- Ejecutar en Supabase SQL Editor. Es idempotente para poder aplicarlo en entornos existentes.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'asespro_publish_status') then
    create type asespro_publish_status as enum ('borrador', 'revision', 'publicado', 'pausado', 'archivado');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'asespro_visibility') then
    create type asespro_visibility as enum ('web', 'privado', 'link_directo');
  end if;
end $$;

alter table if exists asespro_listings
  add column if not exists slug text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists public_summary text,
  add column if not exists internal_notes text,
  add column if not exists publish_status asespro_publish_status not null default 'publicado',
  add column if not exists visibility asespro_visibility not null default 'web',
  add column if not exists featured_order int,
  add column if not exists homepage_section text,
  add column if not exists unpublished_at timestamptz;

create unique index if not exists asespro_listings_slug_unique_idx
  on asespro_listings (slug)
  where slug is not null and slug <> '';

create index if not exists asespro_listings_publish_status_idx on asespro_listings (publish_status);
create index if not exists asespro_listings_featured_order_idx on asespro_listings (is_featured, featured_order);

alter table if exists asespro_property_media
  add column if not exists alt_text text,
  add column if not exists caption text,
  add column if not exists focal_x numeric not null default 50,
  add column if not exists focal_y numeric not null default 50,
  add column if not exists crop_card text,
  add column if not exists crop_detail text,
  add column if not exists crop_social text,
  add column if not exists is_visible boolean not null default true,
  add column if not exists quality_status text not null default 'pendiente',
  add column if not exists width int,
  add column if not exists height int,
  add column if not exists dominant_color text;

alter table if exists asespro_listing_media
  add column if not exists alt_text text,
  add column if not exists caption text,
  add column if not exists focal_x numeric not null default 50,
  add column if not exists focal_y numeric not null default 50,
  add column if not exists crop_card text,
  add column if not exists crop_detail text,
  add column if not exists crop_social text,
  add column if not exists is_visible boolean not null default true,
  add column if not exists quality_status text not null default 'pendiente',
  add column if not exists width int,
  add column if not exists height int,
  add column if not exists dominant_color text;

create table if not exists asespro_listing_media_overrides (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references asespro_listings(id) on delete cascade,
  media_id uuid references asespro_property_media(id) on delete cascade,
  public_url text,
  storage_path text,
  media_type asespro_media_type not null default 'photo',
  sort_order int not null default 0,
  is_cover boolean not null default false,
  is_visible boolean not null default true,
  focal_x numeric not null default 50,
  focal_y numeric not null default 50,
  crop_card text,
  crop_detail text,
  crop_social text,
  alt_text text,
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asespro_listing_media_overrides_listing_idx
  on asespro_listing_media_overrides (listing_id, media_type, sort_order);

create unique index if not exists asespro_listing_media_overrides_cover_idx
  on asespro_listing_media_overrides (listing_id)
  where media_type = 'photo' and is_cover = true;

create table if not exists asespro_listing_revisions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references asespro_listings(id) on delete cascade,
  actor_id uuid,
  change_type text not null,
  summary text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists asespro_listing_revisions_listing_idx
  on asespro_listing_revisions (listing_id, created_at desc);

alter table if exists asespro_owners
  add column if not exists document_id text,
  add column if not exists address text,
  add column if not exists contact_preference text,
  add column if not exists commercial_status text not null default 'activo',
  add column if not exists private_notes text;
