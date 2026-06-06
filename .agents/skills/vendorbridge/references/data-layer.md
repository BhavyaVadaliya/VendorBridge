# VendorBridge Data Layer

## Supabase Client Setup

```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

`.env` file (project root):
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Database Tables

### profiles
```sql
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  role text check (role in ('admin','officer','vendor','manager')),
  phone text,
  country text,
  created_at timestamptz default now()
);
```

### vendors
```sql
create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  gst_number text,
  contact_phone text,
  email text,
  location text,
  status text default 'Active',
  created_at timestamptz default now()
);
```

### rfqs
```sql
create table rfqs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  priority text default 'Medium',
  deadline date,
  description text,
  status text default 'Open',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

### quotations
```sql
create table quotations (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid references rfqs(id),
  vendor_id uuid references vendors(id),
  total_price numeric,
  delivery_days integer,
  payment_terms text,
  notes text,
  status text default 'Submitted',
  created_at timestamptz default now()
);
```

### purchase_orders
```sql
create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid references quotations(id),
  po_number text unique,
  status text default 'Pending',
  approved_by uuid references profiles(id),
  tax_amount numeric default 0,
  grand_total numeric default 0,
  created_at timestamptz default now()
);
```

### activity_logs
```sql
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text,
  entity_id uuid,
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);
```

---

## Auth Patterns

### Login
```js
const { error } = await supabase.auth.signInWithPassword({ email, password })
```

### Register
```js
const { data, error } = await supabase.auth.signUp({ email, password })
// Then insert profile:
await supabase.from('profiles').insert({
  id: data.user.id,
  full_name: values.fullName,
  role: values.role,
  phone: values.phone,
  country: values.country,
})
```

### Logout
```js
await supabase.auth.signOut()
navigate('/')
```

### Get current user
```js
const { data: { user } } = await supabase.auth.getUser()
```

### Auth guard (protect routes)
```jsx
// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
  }, [])
  if (session === undefined) return <div className="p-8 text-gray-400">Loading...</div>
  if (!session) return <Navigate to="/" replace />
  return children
}
```

---

## CRUD Patterns per Module

### Vendors
```js
// List
const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false })

// Create
await supabase.from('vendors').insert({ name, category, gst_number, contact_phone, email, location, status: 'Active' })

// Update status
await supabase.from('vendors').update({ status }).eq('id', vendorId)
```

### RFQs
```js
// List with count
const { data, count } = await supabase.from('rfqs').select('*', { count: 'exact' }).eq('status', 'Open')

// Create
await supabase.from('rfqs').insert({ title, category, priority, deadline, description, created_by: user.id })

// Close RFQ
await supabase.from('rfqs').update({ status: 'Closed' }).eq('id', rfqId)
```

### Quotations
```js
// Fetch with vendor info
const { data } = await supabase
  .from('quotations')
  .select('*, vendors(name, email)')
  .eq('rfq_id', rfqId)

// Submit quotation
await supabase.from('quotations').insert({ rfq_id, vendor_id, total_price, delivery_days, payment_terms, notes })
```

### Purchase Orders
```js
// Auto-generate PO number
const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

// Create PO from approved quotation
await supabase.from('purchase_orders').insert({
  quotation_id: quotation.id,
  po_number: poNumber,
  status: 'Approved',
  approved_by: user.id,
  grand_total: quotation.total_price * 1.18  // including 18% GST
})

// Update approval status
await supabase.from('purchase_orders').update({ status: 'Approved', approved_by: user.id }).eq('id', poId)
```

### Activity Logs
```js
// Log any significant action
const logActivity = async (action, entityType, entityId) => {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('activity_logs').insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    user_id: user?.id,
  })
}

// Usage examples:
logActivity('RFQ created: Office Furniture Q2', 'rfq', rfq.id)
logActivity('Quotation approved', 'quotation', quotation.id)
logActivity('Invoice generated', 'invoice', po.id)
```

### Dashboard Counts (real-time)
```js
const fetchDashboardStats = async () => {
  const [rfqs, approvals, pos] = await Promise.all([
    supabase.from('rfqs').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('purchase_orders').select('grand_total').eq('status', 'Approved'),
  ])
  return {
    activeRFQs: rfqs.count,
    pendingApprovals: approvals.count,
    totalSpend: pos.data?.reduce((sum, p) => sum + (p.grand_total || 0), 0),
  }
}
```

---

## Invoice PDF Generation

```js
// Install: npm install jspdf jspdf-autotable
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generateInvoicePDF = (po, vendor, items) => {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('VendorBridge', 20, 20)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text('Procurement & Vendor Management ERP', 20, 28)

  // PO info
  doc.setTextColor(0)
  doc.setFontSize(14)
  doc.text('PURCHASE ORDER / TAX INVOICE', 130, 20)
  doc.setFontSize(10)
  doc.text(`PO Number: ${po.po_number}`, 130, 30)
  doc.text(`Date: ${new Date(po.created_at).toLocaleDateString()}`, 130, 37)
  doc.text(`Status: ${po.status}`, 130, 44)

  // Vendor info
  doc.setFontSize(10)
  doc.text('Vendor:', 20, 50)
  doc.setFont('helvetica', 'bold')
  doc.text(vendor.name, 20, 57)
  doc.setFont('helvetica', 'normal')
  doc.text(vendor.email || '', 20, 64)

  // Items table
  autoTable(doc, {
    startY: 75,
    head: [['#', 'Item Description', 'Qty', 'Unit Price (₹)', 'Total (₹)']],
    body: items.map((item, i) => [
      i + 1,
      item.name,
      item.qty,
      item.unit_price.toLocaleString('en-IN'),
      (item.qty * item.unit_price).toLocaleString('en-IN'),
    ]),
    headStyles: { fillColor: [34, 197, 94] },  // green-500
    alternateRowStyles: { fillColor: [249, 250, 251] },
  })

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0)
  const gst = subtotal * 0.18
  const grand = subtotal + gst

  doc.text(`Sub Total: ₹${subtotal.toLocaleString('en-IN')}`, 130, finalY)
  doc.text(`GST (18%): ₹${gst.toLocaleString('en-IN')}`, 130, finalY + 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Grand Total: ₹${grand.toLocaleString('en-IN')}`, 130, finalY + 18)

  // Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(150)
  doc.text('Terms: Payment due within 30 days. Generated by VendorBridge.', 20, 280)

  doc.save(`Invoice-${po.po_number}.pdf`)
}
```

---

## Real-time Subscriptions (Dashboard)

```js
useEffect(() => {
  const channel = supabase
    .channel('dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, fetchStats)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rfqs' }, fetchStats)
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```
