-- Clean up dummy purchase orders associated with dummy quotations
DELETE FROM public.purchase_orders
WHERE quotation_id IN (
  SELECT q.id FROM public.quotations q
  JOIN public.vendors v ON q.vendor_id = v.id
  WHERE v.name IN ('Infra Supplies', 'TechCore Ltd', 'FurnCo', 'LogiPro', 'StatioMart', 'TechCorp Ltd')
);

-- Clean up dummy quotations
DELETE FROM public.quotations
WHERE rfq_id IN (
  SELECT id FROM public.rfqs
  WHERE title IN ('Office Furniture Procurement Q2', 'IT Laptops Upgrade', 'Office Stationery Bulk')
) OR vendor_id IN (
  SELECT id FROM public.vendors
  WHERE name IN ('Infra Supplies', 'TechCore Ltd', 'FurnCo', 'LogiPro', 'StatioMart', 'TechCorp Ltd')
);

-- Clean up dummy RFQs
DELETE FROM public.rfqs
WHERE title IN ('Office Furniture Procurement Q2', 'IT Laptops Upgrade', 'Office Stationery Bulk');

-- Clean up dummy vendors
DELETE FROM public.vendors
WHERE name IN ('Infra Supplies', 'TechCore Ltd', 'FurnCo', 'LogiPro', 'StatioMart', 'TechCorp Ltd');

-- Clean up dummy activity logs
DELETE FROM public.activity_logs
WHERE action LIKE '%Office Furniture%' 
   OR action LIKE '%Infra Supplies%' 
   OR action LIKE '%TechCore%' 
   OR action LIKE '%PO-2025-7098%' 
   OR action LIKE '%FurnCo%';
