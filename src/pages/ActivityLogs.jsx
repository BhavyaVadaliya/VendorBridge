import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { Clock, Info, ShieldCheck, AlertTriangle, CheckCircle, Download, X } from 'lucide-react'

const activityColors = {
  RFQ: 'bg-green-500',
  Quotation: 'bg-blue-500',
  Approval: 'bg-amber-500',
  Invoice: 'bg-purple-500',
  Vendor: 'bg-teal-500'
}

export default function ActivityLogs() {
  const { profile } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [showBanner, setShowBanner] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [pendingComparisons, setPendingComparisons] = useState([])

  async function loadNotificationsAndComparisons() {
    if (!profile?.company_id) return
    try {
      const [rfqsRes, posRes] = await Promise.all([
        supabase.from('rfqs')
          .select('id, title, deadline, quotations(id)')
          .eq('status', 'Open')
          .eq('company_id', profile.company_id),
        supabase.from('purchase_orders')
          .select('id, po_number, status')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false })
      ])

      const list = []
      
      // RFQ deadlines
      if (rfqsRes.data) {
        rfqsRes.data.forEach(rfq => {
          const dl = new Date(rfq.deadline)
          const diffDays = Math.ceil((dl.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          if (diffDays > 0 && diffDays <= 7) {
            list.push({
              id: `rfq-${rfq.id}`,
              title: 'RFQ deadline approaching',
              text: `"${rfq.title}" will close for submissions in ${diffDays} day(s).`,
              type: 'warning'
            })
          }
        })

        // Pending comparisons (RFQs with status 'Open' and having submitted quotes)
        const withQuotes = rfqsRes.data.filter(r => r.quotations && r.quotations.length > 0)
        setPendingComparisons(withQuotes)
      }

      // Pending POs or approved POs
      if (posRes.data) {
        posRes.data.forEach(po => {
          if (po.status === 'Pending') {
            list.push({
              id: `po-${po.id}`,
              title: 'PO approval pending',
              text: `Purchase Order ${po.po_number} requires manager approval.`,
              type: 'info'
            })
          } else if (po.status === 'Approved') {
            list.push({
              id: `po-approved-${po.id}`,
              title: 'Invoice generated',
              text: `Tax Invoice for ${po.po_number} is available for download.`,
              type: 'success'
            })
          }
        })
      }

      setNotifications(list.slice(0, 5))
    } catch (e) {
      console.error(e)
    }
  }

  async function loadLogs() {
    setLoading(true)
    if (!profile?.company_id) return
    
    loadNotificationsAndComparisons()

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, profiles(full_name)')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      const mappedLogs = data.map(log => {
        let type = 'System'
        const lowerAction = log.action.toLowerCase()
        if (lowerAction.includes('rfq')) type = 'RFQ'
        else if (lowerAction.includes('quotation')) type = 'Quotation'
        else if (lowerAction.includes('po') || lowerAction.includes('approv')) type = 'Approval'
        else if (lowerAction.includes('invoice')) type = 'Invoice'
        else if (lowerAction.includes('vendor')) type = 'Vendor'

        return {
          id: log.id,
          action: log.action,
          created_at: log.created_at,
          type: type,
          user: log.profiles?.full_name || 'System'
        }
      })
      setActivities(mappedLogs)
    } else {
      setActivities([])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.company_id) {
      loadLogs()
    }
  }, [profile?.company_id])

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(activities, null, 2)
    )}`
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', jsonString)
    downloadAnchor.setAttribute('download', 'audit_trail_logs.json')
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const tabs = ['All', 'RFQs', 'Quotations', 'Approvals', 'Invoices', 'Vendors']

  const filteredActivities = activities.filter(act => {
    if (activeTab === 'All') return true
    if (activeTab === 'RFQs') return act.type === 'RFQ'
    if (activeTab === 'Quotations') return act.type === 'Quotation'
    if (activeTab === 'Approvals') return act.type === 'Approval'
    if (activeTab === 'Invoices') return act.type === 'Invoice'
    if (activeTab === 'Vendors') return act.type === 'Vendor'
    return true
  })

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity &amp; Logs</h1>
            <p className="text-sm text-gray-500 mt-1">Audit trail of all actions and user logs across the ERP</p>
          </div>

          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-950 bg-white"
            />
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm bg-white"
            >
              <Download className="w-4 h-4" />
              <span>Export Logs</span>
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="border-b border-gray-250 flex gap-6">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold relative transition ${
                activeTab === tab ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-green-500 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Dismissible Info Banner */}
        {showBanner && pendingComparisons.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 text-blue-800 text-sm font-medium">
              <Info className="w-5 h-5 shrink-0 text-blue-600" />
              <span>
                You have quotations ready for comparison on RFQ(s): {pendingComparisons.map(c => `"${c.title}"`).join(', ')}.
              </span>
              <a href="/quotations/compare" className="font-bold underline hover:text-blue-900 ml-1">
                Compare Now &rarr;
              </a>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-blue-500 hover:text-blue-700 p-0.5 rounded hover:bg-blue-100 transition"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        )}

        {/* Double Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed Column */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white border border-gray-200 rounded-xl">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 shadow-sm">
                No activity logs found for this filter tab.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map(log => (
                  <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${activityColors[log.type] || 'bg-gray-400'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-950 leading-normal">{log.action}</p>
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-400 mt-1">
                          <span className="font-semibold text-gray-500">{log.user}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(log.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-gray-200 text-gray-500 bg-gray-50 shrink-0">
                      {log.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Side Column */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 px-1">
              Recent Notifications
            </h2>

            {notifications.length === 0 ? (
              <div className="bg-green-50/50 border border-green-200 rounded-xl p-4 shadow-sm flex gap-3 text-green-950">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold">System is up to date</p>
                  <p className="text-xs text-green-600 mt-1">No warnings or tasks require action at this moment.</p>
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const isWarning = notif.type === 'warning'
                const isSuccess = notif.type === 'success'

                return (
                  <div
                    key={notif.id}
                    className={`border rounded-xl p-4 shadow-sm flex gap-3 ${
                      isWarning
                        ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                        : isSuccess
                        ? 'bg-green-50/50 border-green-200 text-green-900'
                        : 'bg-blue-50/50 border-blue-200 text-blue-900'
                    }`}
                  >
                    {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
                    {isSuccess && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                    {!isWarning && !isSuccess && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
                    <div>
                      <p className="text-sm font-bold">{notif.title}</p>
                      <p className={`text-xs mt-1 ${
                        isWarning ? 'text-amber-600' : isSuccess ? 'text-green-600' : 'text-blue-600'
                      }`}>{notif.text}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
