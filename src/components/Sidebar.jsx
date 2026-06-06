import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard,
  Building2,
  FileText,
  MessageSquare,
  CheckSquare,
  ShoppingCart,
  Receipt,
  BarChart3,
  Clock,
  LogOut,
  User,
  Shield
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',       path: '/dashboard',           icon: LayoutDashboard },
  { label: 'Vendors',         path: '/vendors',             icon: Building2 },
  { label: 'RFQs',            path: '/rfqs/create',         icon: FileText },
  { label: 'Quotations',      path: '/quotations',          icon: MessageSquare },
  { label: 'Approvals',       path: '/approvals',           icon: CheckSquare },
  { label: 'Purchase Orders', path: '/purchase-orders',     icon: ShoppingCart },
  { label: 'Invoices',        path: '/purchase-orders',     icon: Receipt }, // Maps to same file as POs per spec
  { label: 'Reports',         path: '/reports',             icon: BarChart3 },
  { label: 'Activity',        path: '/activity',            icon: Clock },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single()
        
        if (!error && data) {
          setProfile(data)
        } else {
          setProfile({ full_name: user.email.split('@')[0], role: 'Officer' })
        }
      }
    }
    getProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <aside className="w-56 bg-[#0f1117] text-gray-400 flex flex-col h-screen shrink-0 border-r border-gray-800">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <span className="text-white font-bold text-xl tracking-tight">VendorBridge</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
        {profile?.role === 'admin' && (
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/admin'
                ? 'bg-green-600 text-white'
                : 'hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Admin Panel</span>
          </Link>
        )}
      </nav>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-gray-800 space-y-3 bg-[#0d0e13]">
        {profile && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-950/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
