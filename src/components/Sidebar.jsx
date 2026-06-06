import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard,
  Building2,
  FileText,
  MessageSquare,
  CheckSquare,
  Receipt,
  BarChart3,
  Clock,
  LogOut,
  User,
  Shield,
  Settings
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',  path: '/dashboard',       icon: LayoutDashboard, match: '/dashboard' },
  { label: 'Vendors',    path: '/vendors',          icon: Building2,       match: '/vendors' },
  { label: 'RFQs',       path: '/rfqs/create',      icon: FileText,        match: '/rfqs' },
  { label: 'Quotations', path: '/quotations',       icon: MessageSquare,   match: '/quotations' },
  { label: 'Approvals',  path: '/approvals',        icon: CheckSquare,     match: '/approvals' },
  { label: 'Invoices',   path: '/purchase-orders',  icon: Receipt,         match: '/purchase-orders' },
  { label: 'Reports',    path: '/reports',          icon: BarChart3,       match: '/reports' },
  { label: 'Activity',   path: '/activity',         icon: Clock,           match: '/activity' },
  { label: 'Settings',   path: '/settings',         icon: Settings,        match: '/settings' },
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
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!error && data) {
          setProfile({ ...data, email: user.email })
        } else {
          setProfile({ full_name: user.email.split('@')[0], role: 'Officer', email: user.email, permissions: null })
        }
      }
    }
    getProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // Filter Nav Items based on Granular Permissions
  const filteredNavItems = navItems.filter(item => {
    if (profile?.role === 'admin') return true; // Admins always see everything
    if (item.label === 'Settings') return false; // Non-admins never see Settings
    
    // If permissions array exists, check it
    if (profile?.permissions && Array.isArray(profile.permissions)) {
      return profile.permissions.includes(item.label)
    }
    
    // Fallback if permissions column doesn't exist yet or is null
    return true;
  })

  return (
    <aside className="w-56 bg-[#0f1117] text-gray-400 flex flex-col h-screen shrink-0 border-r border-gray-800">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <span className="text-white font-bold text-xl tracking-tight">VendorBridge</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item, index) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.match)
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
