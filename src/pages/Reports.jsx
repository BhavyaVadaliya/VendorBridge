import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { Download, TrendingUp, Users, Calendar, Award } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

export default function Reports() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalSpend: 0,
    activeVendors: 0,
    newVendors: 0,
    spendPercent: 0,
    deliveryRate: 0,
    monthlyPOs: 0
  })
  const [categoryData, setCategoryData] = useState([])
  const [vendorData, setVendorData] = useState([])
  const [monthlyTrend, setMonthlyTrend] = useState([])



  async function loadReportsData() {
    setLoading(true)
    try {
      if (!profile?.company_id) return

      // 1. Fetch counts
      const [vendorsRes, pos] = await Promise.all([
        supabase.from('vendors').select('*').eq('status', 'Active').eq('company_id', profile.company_id),
        supabase.from('purchase_orders').select('*, quotations(*, vendors(*))').eq('status', 'Approved').eq('company_id', profile.company_id)
      ])

      const totalSpend = pos.data?.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0) || 0
      const activeVendors = vendorsRes.data?.length || 0
      const monthlyPOs = pos.data?.length || 0

      // Calculate new vendors in last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const newVendorsCount = vendorsRes.data?.filter(v => new Date(v.created_at) >= thirtyDaysAgo).length || 0

      // Calculate spend percent change vs last month
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

      let thisMonthSpend = 0
      let lastMonthSpend = 0

      if (pos.data) {
        pos.data.forEach(p => {
          const poDate = new Date(p.created_at)
          if (poDate.getMonth() === thisMonth && poDate.getFullYear() === thisYear) {
            thisMonthSpend += Number(p.grand_total) || 0
          } else if (poDate.getMonth() === lastMonth && poDate.getFullYear() === lastMonthYear) {
            lastMonthSpend += Number(p.grand_total) || 0
          }
        })
      }

      let spendPercent = 0
      if (lastMonthSpend > 0) {
        spendPercent = ((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100
      } else if (thisMonthSpend > 0) {
        spendPercent = 100
      }

      // Calculate avg proposed delivery days
      let totalDeliveryDays = 0
      let posWithDeliveryDays = 0
      if (pos.data) {
        pos.data.forEach(p => {
          const proposedDays = p.quotations?.delivery_days
          if (proposedDays) {
            totalDeliveryDays += proposedDays
            posWithDeliveryDays += 1
          }
        })
      }
      const avgDeliveryDays = posWithDeliveryDays > 0 ? Math.round(totalDeliveryDays / posWithDeliveryDays) : 0

      setSummary({
        totalSpend: totalSpend,
        activeVendors: activeVendors,
        newVendors: newVendorsCount,
        spendPercent: spendPercent,
        deliveryRate: avgDeliveryDays,
        monthlyPOs: monthlyPOs
      })

      // Aggregate category spend
      const categoryMap = {}
      pos.data?.forEach(p => {
        const cat = p.quotations?.vendors?.category || 'General'
        categoryMap[cat] = (categoryMap[cat] || 0) + (Number(p.grand_total) || 0)
      })

      const categories = Object.keys(categoryMap).map(k => ({
        name: k,
        value: categoryMap[k]
      }))
      setCategoryData(categories)

      // Aggregate vendor spend
      const vendorMap = {}
      pos.data?.forEach(p => {
        const vName = p.quotations?.vendors?.name || 'Unknown'
        if (!vendorMap[vName]) {
          vendorMap[vName] = { name: vName, spend: 0, pos: 0 }
        }
        vendorMap[vName].spend += Number(p.grand_total) || 0
        vendorMap[vName].pos += 1
      })

      const vendorsSorted = Object.values(vendorMap).sort((a, b) => b.spend - a.spend)
      setVendorData(vendorsSorted)

      // 3. Prepare Monthly Trend Chart Data (group POs by month of last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const last6Months = []
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

      setMonthlyTrend(last6Months.map(m => ({
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
    if (profile?.company_id) {
      loadReportsData()
    }
  }, [profile?.company_id])

  const handleExport = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify({ summary, categoryData, vendorData, monthlyTrend }, null, 2)
    )}`
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', 'reports_analytics_data.json')
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports &amp; Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Procurement Insights &mdash; May 2025</p>
          </div>

          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-950 bg-white">
              <option value="May 2025">May 2025</option>
              <option value="April 2025">April 2025</option>
              <option value="Q1 2025">Q1 2025</option>
            </select>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm bg-white"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* KPI Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Spend */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Spend</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{summary.totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${summary.spendPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`w-3.5 h-3.5 ${summary.spendPercent >= 0 ? '' : 'rotate-180'}`} />
                    <span>{summary.spendPercent >= 0 ? '+' : ''}{summary.spendPercent.toFixed(1)}%</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">vs last month</p>
              </div>

              {/* Active Vendors */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Vendors</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-bold text-gray-900">{summary.activeVendors}</p>
                  <span className="text-xs text-green-600 font-bold flex items-center gap-0.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>+{summary.newVendors} new</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Registered profile list</p>
              </div>

              {/* Avg Delivery Time */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Avg. Delivery</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {summary.deliveryRate > 0 ? `${summary.deliveryRate} Days` : 'N/A'}
                  </p>
                  {summary.deliveryRate > 0 && (
                    <span className="text-xs text-green-600 font-bold flex items-center gap-0.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>{summary.deliveryRate <= 15 ? 'Fast' : 'Standard'}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Vendor proposed delivery</p>
              </div>

              {/* Monthly POs */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Monthly POs</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-bold text-gray-900">{summary.monthlyPOs}</p>
                  <span className="text-xs text-gray-500 font-bold flex items-center gap-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Active POs</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Authorized purchase orders</p>
              </div>
            </div>

            {/* Split Charts & Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spend by Category */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Spend by Category</h2>
                  <div className="space-y-4 py-2">
                    {categoryData.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-xs font-semibold">No spend recorded yet.</div>
                    ) : (
                      categoryData.map((cat, idx) => {
                        const maxVal = Math.max(...categoryData.map(c => c.value))
                        const percentage = maxVal > 0 ? (cat.value / maxVal) * 100 : 0
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-gray-800">{cat.name}</span>
                              <span className="font-bold text-gray-900">₹{cat.value.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden">
                              <div
                                className="bg-green-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Top Vendors by Spend */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Top Vendors by Spend</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Vendor</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wider">SPEND (₹)</th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider">POs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {vendorData.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-xs font-semibold">
                              No vendor spend transactions found.
                            </td>
                          </tr>
                        ) : (
                          vendorData.map((vendor, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 font-semibold text-gray-900">{vendor.name}</td>
                              <td className="px-4 py-3 text-right font-bold text-green-600">
                                ₹{vendor.spend.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-center font-medium text-gray-500">{vendor.pos}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Full Width Monthly trend bar chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:col-span-2 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Monthly Procurement Trend</h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spend']} />
                      <Bar dataKey="Spend">
                        {monthlyTrend.map((entry, index) => {
                          const isMay = entry.name === 'May'
                          return <Cell key={`cell-${index}`} fill={isMay ? '#16a34a' : '#22c55e'} />
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
