-- 1. Create the companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add company_id to existing tables
-- Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
-- RFQs
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
-- Vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
-- Quotations
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
-- Purchase Orders
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
-- Activity Logs
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Optional: If you want to drop foreign key constraints that might block deletion (for dev only)
-- You can ignore this if not needed.
