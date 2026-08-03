-- Run this in Supabase Dashboard → SQL Editor

-- Sales log (online & offline)
CREATE TABLE IF NOT EXISTS public.sales_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  channel text NOT NULL CHECK (channel IN ('online', 'offline')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read sales_logs"
  ON public.sales_logs FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert sales_logs"
  ON public.sales_logs FOR INSERT TO anon WITH CHECK (true);

-- Increase stock when goods arrive
CREATE OR REPLACE FUNCTION public.handle_inbound()
RETURNS trigger AS $$
BEGIN
  UPDATE public.variants
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.variant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_sale_insert ON public.sales_logs;
CREATE TRIGGER on_sale_insert
  AFTER INSERT ON public.sales_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_sale();
