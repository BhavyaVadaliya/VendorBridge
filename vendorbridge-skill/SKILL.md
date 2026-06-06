---
name: vendorbridge
description: >
  Build screens, components, and features for the VendorBridge Procurement & Vendor Management ERP.
  Use this skill whenever the user asks to build, fix, update, redesign, or generate code for ANY
  part of the VendorBridge project — including login, dashboard, vendors, RFQs, quotations,
  quotation comparison, approvals, purchase orders, invoices, activity logs, or reports screens.
  Also trigger for: adding Supabase data connections, building the sidebar layout, implementing
  routing, generating invoice PDFs, or anything related to this hackathon project.
  Always use this skill before writing any VendorBridge code — do not rely on memory.
---

# VendorBridge ERP — Build Skill

Read `references/design-system.md` before writing any UI code.
Read `references/data-layer.md` before writing any Supabase or data-fetching code.
Read `references/screens.md` for the full spec of each screen.

---

## Project Overview

VendorBridge is a Procurement & Vendor Management ERP built with:
- **React + Vite** (frontend)
- **Tailwind CSS** (styling)
- **Supabase** (database, auth, real-time)
- **React Router v6** (navigation)
- **jsPDF + jspdf-autotable** (invoice PDF)
- **React Hook Form** (form validation)
- **Recharts** (analytics charts)

## Screens & Routes

| Screen | Route | File |
|--------|-------|------|
| Login | `/` | `pages/Login.jsx` |
| Register | `/register` | `pages/Register.jsx` |
| Dashboard | `/dashboard` | `pages/Dashboard.jsx` |
| Vendors | `/vendors` | `pages/Vendors.jsx` |
| RFQ Create | `/rfqs/create` | `pages/RFQCreate.jsx` |
| Quotations | `/quotations` | `pages/Quotations.jsx` |
| Compare | `/quotations/compare` | `pages/QuotationCompare.jsx` |
| Approvals | `/approvals` | `pages/Approvals.jsx` |
| Purchase Orders | `/purchase-orders` | `pages/PurchaseOrders.jsx` |
| Activity | `/activity` | `pages/ActivityLogs.jsx` |
| Reports | `/reports` | `pages/Reports.jsx` |

## User Roles

- `admin` — manage users and vendors, view analytics
- `officer` — create RFQs, compare quotations, generate POs and invoices
- `vendor` — submit quotations, view RFQ status
- `manager` — approve or reject procurement requests

---

## Build Rules

1. **Always wrap pages** in `<Layout>` which renders the sidebar + main content area
2. **Never hardcode data** — always fetch from Supabase (see `references/data-layer.md`)
3. **Always validate forms** with React Hook Form
4. **Status badges** must use the correct color: green=Active/Approved, amber=Pending, red=Rejected/Inactive, blue=Info
5. **Invoice PDF** must use jsPDF — see `references/data-layer.md` for the exact function
6. **Sidebar active state** must update based on current route using `useLocation()`
7. Every new page must be added to the router in `App.jsx`
8. Log every significant user action to the `activity_logs` table

---

## Quick Component Patterns

### Status Badge
```jsx
const statusColors = {
  Active: 'bg-green-100 text-green-800',
  Approved: 'bg-green-100 text-green-800',
  Pending: 'bg-amber-100 text-amber-800',
  Inactive: 'bg-gray-100 text-gray-600',
  Rejected: 'bg-red-100 text-red-800',
  Open: 'bg-blue-100 text-blue-800',
}

<span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
  {status}
</span>
```

### Supabase fetch pattern
```jsx
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  supabase.from('table_name').select('*')
    .then(({ data, error }) => {
      if (!error) setData(data)
      setLoading(false)
    })
}, [])
```

### Form with validation
```jsx
const { register, handleSubmit, formState: { errors } } = useForm()

const onSubmit = async (values) => {
  const { error } = await supabase.from('table').insert(values)
  if (error) toast.error(error.message)
  else navigate('/next-page')
}
```
