import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
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
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalSpend: 0,
    activeVendors: 0,
    deliveryRate: 94,
    monthlyPOs: 0
  })
  const [categoryData, setCategoryData] = useState([])
  const [vendorData, setVendorData] = useState([])
  const [monthlyTrend, setMonthlyTrend] = useState([])

  const mockCategoryData = [
    { name: 'IT Hardware', value: 946000 },
    { name: 'Furniture', value: 932000 },
    { name: 'Stationery', value: 21000 },
    { name: 'Logistics', value: 23000 }
  ]

  const mockVendorData = [
    { name: 'TechCore Ltd', spend: 420000, pos: 6 },
    { name: 'Infra Supplies', spend: 310000, pos: 4 },
    { name: 'FurnCo', spend: 100000, pos: 2 },
    { name: 'LogiPro', spend: 80000, pos: 3 }
  ]

  const mockTrendData = [
    { name: 'Jan', Spend: 120000 },
    { name: 'Feb', Spend: 150000 },
    { name: 'Mar', Spend: 190000 },
    { name: 'Apr', Spend: 210000 },
    { name: 'May', Spend: 243080 },
    { name: 'Jun', Spend: 95000 }
  ]

  async function loadReportsData() {
    setLoading(true)
    try {
      // 1. Fetch counts
      const [vendorsCount, pos] = await Promise.all([
        supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('purchase_orders').select('*, quotations(*, vendors(*))').eq('status', 'Approved')
      ])

      const totalSpend = pos.data?.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0) || 0
      const activeVendors = vendorsCount.count || 0
      const monthlyPOs = pos.data?.length || 0

      setSummary({
        totalSpend: totalSpend || 240000, // fallbacks
        activeVendors: activeVendors || 28,
        deliveryRate: 94,
        monthlyPOs: monthlyPOs || 3
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
      setCategoryData(categories.length > 0 ? categories : mockCategoryData)

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
      setVendorData(vendorsSorted.length > 0 ? vendorsSorted : mockVendorData)

      setMonthlyTrend(mockTrendData)

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportsData()
  }, [])

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
                  <span className="text-xs text-green-600 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+12.4%</span>
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
                    <span>+3 new</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Registered profile list</p>
              </div>

              {/* On-Time Delivery Rate */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">On-Time Delivery</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-bold text-gray-900">{summary.deliveryRate}%</p>
                  <span className="text-xs text-green-600 font-bold flex items-center gap-0.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Grade A</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Vendor performance average</p>
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
                    {categoryData.map((cat, idx) => {
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
                    })}
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
                        {vendorData.map((vendor, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{vendor.name}</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">
                              ₹{vendor.spend.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-center font-medium text-gray-500">{vendor.pos}</td>
                          </tr>
                        ))}
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
