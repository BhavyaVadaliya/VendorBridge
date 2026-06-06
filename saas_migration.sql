-- SaaS Multi-Tenant Database Migration
-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard/project/ofzrnvwowpjabgbfuqjo/sql/new)

-- 1. Create the companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert a default company if not already present
INSERT INTO public.companies (id, name)
VALUES ('d3b07384-d113-40a2-a5d6-3e3c6a4959db', 'Default Company')
ON CONFLICT (id) DO NOTHING;

-- 3. Add company_id column and populate it for each table to avoid NULL loading blocks
-- Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.profiles SET company_id = 'd3b07384-d113-40a2-a5d6-3e3c6a4959db' WHERE company_id IS NULL;

-- RFQs
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.rfqs SET company_id = 'd3b07384-d113-40a2-a5d6-3e3c6a4959db' WHERE company_id IS NULL;

-- Vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.vendors SET company_id = 'd3b07384-d113-40a2-a5d6-3e3c6a4959db' WHERE company_id IS NULL;

-- Quotations
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.quotations SET company_id = 'd3b07384-d113-40a2-a5d6-3e3c6a4959db' WHERE company_id IS NULL;

-- Purchase Orders
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.purchase_orders SET company_id = 'd3b07384-d113-40a2-a5d6-3e3c6a4959db' WHERE company_id IS NULL;

-- Activity Logs
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.activity_logs SET company_id = 'd3b07384-d113-40a2-a5d6-3e3c6a4959db' WHERE company_id IS NULL;
