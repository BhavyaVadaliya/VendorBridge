import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import {
  FileText,
  Clock,
  IndianRupee,
  AlertCircle,
  Plus,
  UserPlus,
  Receipt,
  ArrowRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const statusColors = {
  Approved: 'bg-green-100 text-green-800',
  Pending: 'bg-amber-100 text-amber-800',
  Rejected: 'bg-red-100 text-red-800',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    activeRFQs: 0,
    pendingApprovals: 0,
    totalSpend: 0,
    invoicesPending: 0
  })
  const [recentPOs, setRecentPOs] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchDashboardData() {
    try {
      // 1. Fetch user profile info
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single()
        setProfile(data || { full_name: user.email.split('@')[0], role: 'Officer' })
      }

      // 2. Fetch stats
      const [rfqs, approvals, pos, allPos] = await Promise.all([
        supabase.from('rfqs').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
        supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('purchase_orders').select('grand_total').eq('status', 'Approved'),
        supabase.from('purchase_orders').select('*, quotations(*, vendors(*))').order('created_at', { ascending: false })
      ])

      const totalSpendAmount = pos.data?.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0) || 0

      // Map last 5 POs
      const top5POs = allPos.data?.slice(0, 5).map(po => ({
        id: po.id,
        po_number: po.po_number,
        vendor: po.quotations?.vendors?.name || 'N/A',
        amount: po.grand_total || po.quotations?.total_price || 0,
        status: po.status,
        date: new Date(po.created_at).toLocaleDateString('en-IN')
      })) || []

      setRecentPOs(top5POs)

      // Count invoices pending
      const invoicesCount = allPos.data?.filter(po => po.status === 'Pending').length || 0

      setStats({
        activeRFQs: rfqs.count || 0,
        pendingApprovals: approvals.count || 0,
        totalSpend: totalSpendAmount,
        invoicesPending: invoicesCount
      })

      // 3. Prepare Chart Data (group POs by month of last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const last6Months = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        last6Months.push({
          monthName: months[d.getMonth()],
          monthNum: d.getMonth(),
          year: d.getFullYear(),
          amount: 0
        })
      }

      if (pos.data) {
        pos.data.forEach(p => {
          const poDate = new Date(p.created_at)
          last6Months.forEach(m => {
            if (poDate.getMonth() === m.monthNum && poDate.getFullYear() === m.year) {
              m.amount += Number(p.grand_total) || 0
            }
          })
        })
      }

      setChartData(last6Months.map(m => ({
        name: m.monthName,
        Spend: m.amount
      })))

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Real-time updates subscription
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rfqs' }, fetchDashboardData)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Layout>
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            {profile && (
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, <span className="font-semibold text-gray-700 capitalize">{profile.full_name}</span> ({profile.role}) — Today's Overview
              </p>
            )}
          </div>
          <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            {currentDate}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Active RFQs */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active RFQs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeRFQs}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">Open for bidding</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pending Approvals</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingApprovals}</p>
                  <p className="text-xs text-amber-600 font-medium mt-1">Awaiting review</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              {/* Total Spend */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Spend</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ₹{stats.totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-blue-600 font-medium mt-1">Approved purchase orders</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </div>

              {/* Invoices Pending */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Invoices Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.invoicesPending}</p>
                  <p className="text-xs text-red-600 font-medium mt-1">Require actions</p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/rfqs/create')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>New RFQ</span>
                </button>
                <button
                  onClick={() => navigate('/vendors')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Vendor</span>
                </button>
                <button
                  onClick={() => navigate('/purchase-orders')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Invoices</span>
                </button>
              </div>
            </div>

            {/* Main Section: Chart + Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent PO Table */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">Recent Purchase Orders</h2>
                    <button
                      onClick={() => navigate('/purchase-orders')}
                      className="text-xs font-semibold text-green-600 hover:text-green-500 flex items-center gap-1"
                    >
                      <span>View All</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            PO Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Vendor
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500">
                            AMOUNT
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentPOs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                              No purchase orders found.
                            </td>
                          </tr>
                        ) : (
                          recentPOs.map(po => (
                            <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-gray-900 font-medium">{po.po_number}</td>
                              <td className="px-4 py-3 text-gray-700">{po.vendor}</td>
                              <td className="px-4 py-3 text-gray-900 font-semibold">
                                ₹{po.amount.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[po.status] || 'bg-gray-100 text-gray-600'}`}>
                                  {po.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500">{po.date}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Monthly Trend Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-4">Monthly Spend Trend</h2>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                        <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spend']} />
                        <Bar dataKey="Spend" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
