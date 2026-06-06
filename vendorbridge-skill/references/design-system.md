# VendorBridge Design System

## Visual Identity

| Token | Value | Usage |
|-------|-------|-------|
| Primary accent | `#22c55e` (green-500) | CTAs, active nav, success states |
| Sidebar bg | `#0f1117` | Left sidebar background |
| Sidebar text | `#9ca3af` | Inactive nav links |
| Sidebar active text | `#ffffff` | Active nav link text |
| Page bg | `#f8f9fa` | Main content background |
| Card bg | `#ffffff` | All cards and tables |
| Border | `#e5e7eb` | Card borders, table lines |
| Text primary | `#111827` | Headings, important text |
| Text secondary | `#6b7280` | Subtexts, labels |
| Danger | `#ef4444` | Reject, error, delete |
| Warning | `#f59e0b` | Pending, warning states |
| Info | `#3b82f6` | Neutral info, blue accents |

## Layout Structure

Every authenticated page must use this structure:
```jsx
// src/components/Layout.jsx
export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

## Sidebar Specification

```jsx
// src/components/Sidebar.jsx
const navItems = [
  { label: 'Dashboard',       path: '/dashboard',           icon: '⊞' },
  { label: 'Vendors',         path: '/vendors',             icon: '🏢' },
  { label: 'RFQs',            path: '/rfqs/create',         icon: '📄' },
  { label: 'Quotations',      path: '/quotations',          icon: '💬' },
  { label: 'Approvals',       path: '/approvals',           icon: '✅' },
  { label: 'Purchase Orders', path: '/purchase-orders',     icon: '🛒' },
  { label: 'Invoices',        path: '/purchase-orders',     icon: '🧾' },
  { label: 'Reports',         path: '/reports',             icon: '📊' },
  { label: 'Activity',        path: '/activity',            icon: '🕐' },
]
```

Sidebar must:
- Be `w-56` (224px) fixed height, dark bg `#0f1117`
- Show "VendorBridge" logo at top in white bold text
- Highlight active route with `bg-green-600 text-white rounded-md`
- Show user name + role at the very bottom
- Use `useLocation()` to determine active route

## Typography Scale

```css
/* Page heading */
.page-heading { font-size: 1.5rem; font-weight: 700; color: #111827; }

/* Section heading */
.section-heading { font-size: 1rem; font-weight: 600; color: #374151; }

/* Table header */
.table-header { font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }

/* Body */
.body-text { font-size: 0.875rem; color: #374151; }

/* Muted */
.muted-text { font-size: 0.75rem; color: #9ca3af; }
```

## Standard Components

### Page Header
```jsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
  </div>
  <div className="flex gap-2">{/* action buttons */}</div>
</div>
```

### Primary Button
```jsx
<button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
  Label
</button>
```

### Outline Button
```jsx
<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
  Label
</button>
```

### Card
```jsx
<div className="bg-white rounded-xl border border-gray-200 p-5">
  {children}
</div>
```

### KPI Metric Card (Dashboard)
```jsx
<div className="bg-white rounded-xl border border-gray-200 p-5">
  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
  <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
  <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
</div>
```

### Table
```jsx
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <table className="w-full text-sm">
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-gray-700">Value</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Form Input
```jsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
  <input
    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 
               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 
               focus:border-transparent transition"
    placeholder={placeholder}
    {...register(name, { required: true })}
  />
  {errors[name] && <p className="text-red-500 text-xs mt-1">This field is required</p>}
</div>
```

## DO NOT

- Do NOT use purple, pink, or gradient backgrounds
- Do NOT use card shadows heavier than `shadow-sm`
- Do NOT use fonts other than the system/Tailwind default (Inter via CDN is acceptable)
- Do NOT put red/green/amber as background colors on full sections — only on badges/buttons
- Do NOT build without the sidebar (except Login and Register pages)
- Do NOT use inline styles — always use Tailwind classes
