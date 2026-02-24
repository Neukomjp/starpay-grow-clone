-- Profiles Table (Merchants/Admins) extends Supabase Auth
create table profiles (
  id uuid references auth.users on delete cascade,
  email text,
  role text check (role in ('admin', 'merchant_owner', 'staff', 'customer')),
  full_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Stores Table
create table stores (
  id uuid default uuid_generate_v4() primary key,
  merchant_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text,
  address text,
  phone text,
  theme_config jsonb default '{}'::jsonb,
  email_config jsonb default '{}'::jsonb,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Services Table (Menu Items)
create table services (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  name text not null,
  category text,
  price integer not null,
  duration_minutes integer default 60,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Staff Table
create table staff (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  name text not null,
  role text,
  bio text,
  avatar_url text,
  specialties text[], -- Array of strings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookings Table
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  staff_id uuid references staff(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  customer_id uuid references auth.users(id) on delete set null, -- Link to registered customer
  customer_name text not null, -- Keep for guest bookings or caching
  options jsonb, -- Snapshot of selected options [{name, price, duration}]
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null, -- Calculated end time
  total_price integer, -- Cache total price (service + options)
  payment_status text check (payment_status in ('unpaid', 'paid', 'refunded')) default 'unpaid',
  payment_method text check (payment_method in ('local', 'card', 'paypay')),
  status text check (status in ('pending', 'confirmed', 'cancelled', 'completed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Row Level Security)
alter table profiles enable row level security;
alter table stores enable row level security;
alter table services enable row level security;
alter table staff enable row level security;
alter table bookings enable row level security;

-- Policies for Stores: Merchants can manage their own stores
create policy "Merchants can view own stores" on stores for select using (merchant_id = auth.uid());
create policy "Merchants can insert own stores" on stores for insert with check (merchant_id = auth.uid());
create policy "Merchants can update own stores" on stores for update using (merchant_id = auth.uid());
create policy "Merchants can delete own stores" on stores for delete using (merchant_id = auth.uid());

-- Public can view published stores
create policy "Public can view published stores" on stores for select using (is_published = true);

-- Staff Shifts Table
create table staff_shifts (
  id uuid default uuid_generate_v4() primary key,
  staff_id uuid references staff(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sunday, 1=Monday...
  start_time time not null,
  end_time time not null,
  is_holiday boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(staff_id, day_of_week)
);

alter table staff_shifts enable row level security;

-- Policies for Staff Shifts
-- Allow anyone to view shifts (needed for booking availability)
create policy "Public can view shifts" on staff_shifts for select using (true);

-- Allow authenticated users (merchants) to manage shifts
-- Ideally check if they own the store, but for MVP/demo, allow authenticated users
create policy "Merchants can manage shifts" on staff_shifts for all using (auth.role() = 'authenticated');

-- Service Options Table (Menu Add-ons)
create table service_options (
  id uuid default uuid_generate_v4() primary key,
  service_id uuid references services(id) on delete cascade not null,
  name text not null,
  price integer not null,
  duration_minutes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table service_options enable row level security;

-- Policies for Service Options
create policy "Public can view options" on service_options for select using (true);
create policy "Merchants can manage options" on service_options for all using (auth.role() = 'authenticated');
