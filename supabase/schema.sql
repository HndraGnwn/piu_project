-- Run this in Supabase Dashboard → SQL Editor

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.authorized_users (
  email citext PRIMARY KEY,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_authorized_user()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.authorized_users
    WHERE email = auth.email()
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Authorized users can read themselves" ON public.authorized_users;
CREATE POLICY "Authorized users can read themselves"
  ON public.authorized_users FOR SELECT TO authenticated
  USING (email = auth.email() AND is_active = true);

ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read variants" ON public.variants;
DROP POLICY IF EXISTS "Authorized users can read variants" ON public.variants;
CREATE POLICY "Authorized users can read variants"
  ON public.variants FOR SELECT TO authenticated
  USING (public.is_authorized_user());

ALTER TABLE public.inbound_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read inbound_logs" ON public.inbound_logs;
DROP POLICY IF EXISTS "Allow anon insert inbound_logs" ON public.inbound_logs;
DROP POLICY IF EXISTS "Authorized users can read inbound_logs" ON public.inbound_logs;
DROP POLICY IF EXISTS "Authorized users can insert inbound_logs" ON public.inbound_logs;
CREATE POLICY "Authorized users can read inbound_logs"
  ON public.inbound_logs FOR SELECT TO authenticated
  USING (public.is_authorized_user());

CREATE POLICY "Authorized users can insert inbound_logs"
  ON public.inbound_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_authorized_user());

-- Sales log (online & offline)
CREATE TABLE IF NOT EXISTS public.sales_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  channel text NOT NULL CHECK (channel IN ('online', 'offline')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read sales_logs" ON public.sales_logs;
DROP POLICY IF EXISTS "Allow anon insert sales_logs" ON public.sales_logs;
DROP POLICY IF EXISTS "Authorized users can read sales_logs" ON public.sales_logs;
DROP POLICY IF EXISTS "Authorized users can insert sales_logs" ON public.sales_logs;

CREATE POLICY "Allow anon read sales_logs"
  ON public.sales_logs FOR SELECT TO anon USING (false);

CREATE POLICY "Allow anon insert sales_logs"
  ON public.sales_logs FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Authorized users can read sales_logs"
  ON public.sales_logs FOR SELECT TO authenticated
  USING (public.is_authorized_user());

CREATE POLICY "Authorized users can insert sales_logs"
  ON public.sales_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_authorized_user());

-- Increase stock when goods arrive
CREATE OR REPLACE FUNCTION public.handle_inbound()
RETURNS trigger AS $$
BEGIN
  UPDATE public.variants
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.variant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_inbound_insert ON public.inbound_logs;
CREATE TRIGGER on_inbound_insert
  AFTER INSERT ON public.inbound_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_inbound();

-- Decrease stock when sold
CREATE OR REPLACE FUNCTION public.handle_sale()
RETURNS trigger AS $$
BEGIN
  UPDATE public.variants
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.variant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_sale_insert ON public.sales_logs;
CREATE TRIGGER on_sale_insert
  AFTER INSERT ON public.sales_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_sale();
