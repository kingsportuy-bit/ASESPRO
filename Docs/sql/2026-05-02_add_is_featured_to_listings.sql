-- ASESPRO production migration
-- Adds manual control for featured publications on home.

ALTER TABLE public.asespro_listings
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS asespro_listings_is_featured_idx
  ON public.asespro_listings (is_featured)
  WHERE is_featured = true;
