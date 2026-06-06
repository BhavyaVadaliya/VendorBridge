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

  // High fidelity mock logs if DB is empty
  const mockLogs = [
    { id: '1', action: 'RFQ Office Furniture Q2 created and sent to 3 vendors', created_at: new Date('2025-05-10T09:30:00').toISOString(), type: 'RFQ', user: 'John Doe' },
    { id: '2', action: 'Quotation received from Infra Supplies — ₹95,400', created_at: new Date('2025-05-15T14:15:00').toISOString(), type: 'Quotation', user: 'System' },
    { id: '3', action: 'Quotation received from TechCore Ltd — ₹96,760', created_at: new Date('2025-05-16T11:00:00').toISOString(), type: 'Quotation', user: 'System' },
    { id: '4', action: 'PO #PO-2025-7098 pending approval by Manager', created_at: new Date('2025-05-22T16:45:00').toISOString(), type: 'Approval', user: 'John Doe' },
    { id: '5', action: 'Purchase Order PO-2025-7098 approved by Sarah Manager', created_at: new Date('2025-05-23T10:00:00').toISOString(), type: 'Approval', user: 'Sarah Johnson' },
    { id: '6', action: 'Invoice INV-2025-0234 generated and sent to vendor email', created_at: new Date('2025-05-24T15:00:00').toISOString(), type: 'Invoice', user: 'System' },
    { id: '7', action: 'Vendor registered: FurnCo (GST: 24DDDDD3333D4W8)', created_at: new Date('2025-05-20T12:00:00').toISOString(), type: 'Vendor', user: 'Admin' }
  ]

  async function loadLogs() {
    setLoading(true)
    if (!profile?.company_id) return
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, profiles(full_name)')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      const mappedLogs = data.map(log => {
        let type = 'System'
        if (log.action.toLowerCase().includes('rfq')) type = 'RFQ'
        else if (log.action.toLowerCase().includes('quotation')) type = 'Quotation'
        else if (log.action.toLowerCase().includes('po') || log.action.toLowerCase().includes('approved') || log.action.toLowerCase().includes('approved')) type = 'Approval'
        else if (log.action.toLowerCase().includes('invoice')) type = 'Invoice'
        else if (log.action.toLowerCase().includes('vendor')) type = 'Vendor'

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
      setActivities(mockLogs)
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
        {showBanner && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 text-blue-800 text-sm font-medium">
              <Info className="w-5 h-5 shrink-0 text-blue-600" />
              <span>3 quotations received for RFQ: Office Furniture Procurement Q2. Ready for comparison.</span>
              <a href="/quotations/compare" className="font-bold underline hover:text-blue-900 ml-1">
                View Now &rarr;
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

            {/* Warning Card */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 shadow-sm flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900">RFQ deadline approaching</p>
                <p className="text-xs text-amber-600 mt-1">Office Furniture Q2 will close for submissions in 2 days.</p>
              </div>
            </div>

            {/* Success Card */}
            <div className="bg-green-50/50 border border-green-200 rounded-xl p-4 shadow-sm flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-900">Invoice sent successfully</p>
                <p className="text-xs text-green-600 mt-1">Invoice INV-2025-0234 has been acknowledged by vendor.</p>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 shadow-sm flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-900">New vendor registered</p>
                <p className="text-xs text-blue-600 mt-1">TechParts supplier has applied for registration review.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
