-- Farm Fresh Phase 1: foundational farm-production records.
create table public.farm_zones (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  zone_type text not null default 'planting',
  width_m numeric(8,2) not null check (width_m > 0),
  length_m numeric(8,2) not null check (length_m > 0),
  area_m2 numeric(10,2) generated always as (width_m * length_m) stored,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seed_inventory (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  variety text,
  crop_family text,
  quantity numeric(10,2),
  quantity_unit text,
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  acquired_date date,
  packet_expiry_date date,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plantings (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.farm_zones(id) on delete restrict,
  crop_name text not null,
  variety text,
  crop_family text,
  planting_date date,
  planting_date_precision text not null default 'unknown' check (planting_date_precision in ('exact', 'approximate', 'unknown')),
  planting_method text not null default 'unknown' check (planting_method in ('direct_seed', 'transplanted', 'existing', 'unknown')),
  status text not null default 'planned' check (status in ('planned', 'seeded', 'transplanted', 'growing', 'ready_to_harvest', 'harvesting', 'finished', 'removed')),
  area_used_percent numeric(5,2) check (area_used_percent is null or (area_used_percent >= 0 and area_used_percent <= 100)),
  expected_harvest_start date,
  expected_harvest_end date,
  actual_harvest_date date,
  perennial boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plantings_zone_id_idx on public.plantings(zone_id);
create index plantings_status_idx on public.plantings(status);
create index seed_inventory_stock_status_idx on public.seed_inventory(stock_status);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger farm_zones_updated_at before update on public.farm_zones for each row execute function public.set_updated_at();
create trigger seed_inventory_updated_at before update on public.seed_inventory for each row execute function public.set_updated_at();
create trigger plantings_updated_at before update on public.plantings for each row execute function public.set_updated_at();

insert into public.farm_zones (code, name, width_m, length_m) values
('RB1', 'Raised Bed 1', 3, 3), ('RB2', 'Raised Bed 2', 3, 3), ('RB3', 'Raised Bed 3', 3, 3), ('RB4', 'Raised Bed 4', 3, 3),
('NB1', 'Narrow Bed 1', 1, 3), ('NB2', 'Narrow Bed 2', 1, 3), ('NB3', 'Narrow Bed 3', 1, 3), ('NB4', 'Narrow Bed 4', 1, 3), ('NB5', 'Narrow Bed 5', 1, 3), ('NB6', 'Narrow Bed 6', 1, 3), ('NB7', 'Narrow Bed 7', 1, 3), ('NB8', 'Narrow Bed 8', 1, 3),
('FR1', 'Front Right 1', 5, 3), ('FR2', 'Front Right 2', 5, 3), ('FR3', 'Front Right 3', 5, 3), ('FR4', 'Front Right 4', 5, 3), ('FR5', 'Front Right 5', 5, 3), ('FR6', 'Front Right 6', 5, 3), ('FR7', 'Front Right 7', 5, 3), ('FR8', 'Front Right 8', 5, 3), ('FR9', 'Front Right 9', 5, 3), ('FR10', 'Front Right 10', 8, 3),
('FL1', 'Front Left 1', 8, 3), ('FL2', 'Front Left 2', 5, 3), ('FL3', 'Front Left 3', 5, 3), ('FL4', 'Front Left 4', 5, 3), ('FL5', 'Front Left 5', 5, 3), ('FL6', 'Front Left 6', 5, 3), ('FL7', 'Front Left 7', 5, 3), ('FL8', 'Front Left 8', 5, 3), ('FL9', 'Front Left 9', 5, 3), ('FL10', 'Front Left 10', 5, 3),
('MF1', 'Main Field', 22, 11);

insert into public.seed_inventory (crop_name, variety, crop_family) values
('Tomato', 'Cœur de Bœuf', 'Solanaceae'), ('Cherry Tomato', 'Yellow', 'Solanaceae'), ('Onion', null, 'Amaryllidaceae'), ('Fava Bean', null, 'Fabaceae'), ('Spaghetti Squash', null, 'Cucurbitaceae'), ('Pumpkin', null, 'Cucurbitaceae'), ('Courgette', 'Grise', 'Cucurbitaceae'), ('Courgette', 'Verte', 'Cucurbitaceae'), ('Potato', null, 'Solanaceae');
