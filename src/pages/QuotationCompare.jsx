import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function QuotationCompare() {
  const navigate = useNavigate()
  const [rfqs, setRfqs] = useState([])
  const [selectedRfq, setSelectedRfq] = useState(null)
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState(null)

  // Exact mock data matching the Excalidraw Screen 7 mockup
  const MOCK_VENDORS = [
    {
      id: '1',
      name: 'Infra Supplies',
      isLowestPrice: true,
      grandTotal: '185000',
      gst: '18',
      delivery: '10',
      rating: '4.5/5',
      terms: '30 days'
    },
    {
      id: '2',
      name: 'TechCore LTD',
      isLowestPrice: false,
      grandTotal: '200010',
      gst: '18',
      delivery: '14',
      rating: '4.2/5',
      terms: '30 days'
    },
    {
      id: '3',
      name: 'Office Wood Co.',
      isLowestPrice: false,
      grandTotal: '214500',
      gst: '18',
      delivery: '7',
      rating: '3.8/5',
      terms: '15 days'
    }
  ]

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data: rfqsData } = await supabase.from('rfqs').select('*')
      if (rfqsData && rfqsData.length > 0) {
        setRfqs(rfqsData)
        setSelectedRfq(rfqsData[0])
        const { data: quotesData } = await supabase
          .from('quotations')
          .select('*, vendors(*)')
          .eq('rfq_id', rfqsData[0].id)
        if (quotesData) {
          setQuotations(quotesData)
          if (quotesData.length > 0) {
            let minPrice = Infinity
            let lowestId = quotesData[0].id
            quotesData.forEach(q => {
              const price = Number(q.total_price)
              if (price < minPrice) {
                minPrice = price
                lowestId = q.id
              }
            })
            setSelectedVendorId(lowestId)
          } else {
            setSelectedVendorId('1')
          }
        } else {
          setSelectedVendorId('1')
        }
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Map real DB data if available, otherwise use exact Excalidraw mock
  let displayVendors = MOCK_VENDORS
  if (quotations.length > 0) {
    // Find lowest price
    let minPrice = Infinity
    quotations.forEach(q => {
      const price = Number(q.total_price)
      if (price < minPrice) minPrice = price
    })

    displayVendors = quotations.map(q => {
      const isLowestPrice = Number(q.total_price) === minPrice
      return {
        id: q.id,
        vendorId: q.vendors?.id,
        name: q.vendors?.name || 'Unknown Vendor',
        isLowestPrice: isLowestPrice,
        grandTotal: q.total_price,
        gst: '18',
        delivery: q.delivery_days?.toString() || '0',
        rating: q.vendors?.rating ? `${q.vendors.rating}/5` : '4.0/5',
        terms: q.payment_terms || '30 days'
      }
    })
  }

  const selectedVendor = displayVendors.find(v => v.id === selectedVendorId)

  const handleApprove = async (vendorData) => {
    if (!selectedRfq) return
    setSubmitting(true)
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const { data: { user } } = await supabase.auth.getUser()

    // If it's real data from DB, we insert the PO
    if (quotations.length > 0) {
      const payload = {
        po_number: poNumber,
        status: 'Pending',
        grand_total: Number(vendorData.grandTotal),
        quotation_id: vendorData.id,
        approved_by: user?.id
      }
      const { error } = await supabase.from('purchase_orders').insert(payload).select().single()
      if (error) {
        alert(error.message)
      } else {
        await supabase.from('activity_logs').insert({
          action: `Quotation approved for ${selectedRfq.title}. PO ${poNumber} generated for ${vendorData.name}.`,
          entity_type: 'purchase_order',
          user_id: user?.id
        })
        navigate('/approvals')
      }
    } else {
      // Mock flow
      await supabase.from('activity_logs').insert({
        action: `Quotation approved for mock RFQ. PO ${poNumber} generated for ${vendorData.name}.`,
        entity_type: 'purchase_order',
        user_id: user?.id
      })
      navigate('/approvals')
    }
    setSubmitting(false)
  }

  const rfqTitle = selectedRfq?.title || 'office furniture procurement q2'
  const quotationCount = quotations.length > 0 ? quotations.length : 3

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-0">
        
        {/* Navigation Tabs for Quotations */}
        <div className="flex items-center gap-6 border-b border-gray-300 pb-2 mb-6">
          <button 
            className="text-[15px] font-medium text-gray-500 hover:text-gray-900 pb-2 -mb-[9px]"
            onClick={() => navigate('/quotations')}
          >
            Submit Quotation
          </button>
          <button 
            className="text-[15px] font-medium text-green-600 border-b-2 border-green-600 pb-2 -mb-[9px]"
          >
            Compare Quotations
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-[28px] font-medium text-gray-900 mb-1">Quotation Comparison</h1>
          <p className="text-gray-600 text-[15px]">
            RFQ: {rfqTitle} - {quotationCount} quotations received
          </p>
        </div>

        {loading ? (
           <div className="flex items-center justify-center py-20">
             <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : (
          <div className="bg-white p-6 shadow-sm border border-gray-300 rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-4 font-semibold text-gray-800 text-left bg-white min-w-[150px]">
                      Criteria
                    </th>
                    {displayVendors.map((vendor, idx) => {
                      const isSelected = selectedVendorId === vendor.id
                      return (
                        <th
                          key={idx}
                          className={`border border-gray-300 p-4 font-semibold min-w-[180px] ${
                            isSelected ? 'bg-[#5ee173] text-black' : 'bg-white text-gray-800'
                          }`}
                        >
                          {vendor.name} {vendor.isLowestPrice ? '(Lowest)' : ''}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-4 text-left font-medium text-gray-700">Grand Total</td>
                    {displayVendors.map((vendor, idx) => {
                      const isSelected = selectedVendorId === vendor.id
                      return (
                        <td key={idx} className={`border border-gray-300 p-4 text-gray-900 ${isSelected ? 'bg-[#5ee173]' : ''}`}>
                          {vendor.grandTotal}
                        </td>
                      )
                    })}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-4 text-left font-medium text-gray-700">GST %</td>
                    {displayVendors.map((vendor, idx) => {
                      const isSelected = selectedVendorId === vendor.id
                      return (
                        <td key={idx} className={`border border-gray-300 p-4 text-gray-900 ${isSelected ? 'bg-[#5ee173]' : ''}`}>
                          {vendor.gst}
                        </td>
                      )
                    })}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-4 text-left font-medium text-gray-700">Delivery (days)</td>
                    {displayVendors.map((vendor, idx) => {
                      const isSelected = selectedVendorId === vendor.id
                      return (
                        <td key={idx} className={`border border-gray-300 p-4 text-gray-900 ${isSelected ? 'bg-[#5ee173]' : ''}`}>
                          {vendor.delivery}
                        </td>
                      )
                    })}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-4 text-left font-medium text-gray-700">Vendor rating</td>
                    {displayVendors.map((vendor, idx) => {
                      const isSelected = selectedVendorId === vendor.id
                      return (
                        <td key={idx} className={`border border-gray-300 p-4 text-gray-900 ${isSelected ? 'bg-[#5ee173]' : ''}`}>
                          {vendor.rating}
                        </td>
                      )
                    })}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-4 text-left font-medium text-gray-700">Payment terms</td>
                    {displayVendors.map((vendor, idx) => {
                      const isSelected = selectedVendorId === vendor.id
                      return (
                        <td key={idx} className={`border border-gray-300 p-4 text-gray-900 ${isSelected ? 'bg-[#5ee173]' : ''}`}>
                          {vendor.terms}
                        </td>
                      )
                    })}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-4 text-left font-medium text-gray-700 bg-white">Selection</td>
                    {displayVendors.map((vendor, idx) => {
                      const isSelected = selectedVendorId === vendor.id
                      return (
                        <td 
                          key={idx} 
                          onClick={() => setSelectedVendorId(vendor.id)}
                          className={`border border-gray-300 p-4 cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#5ee173]' : 'hover:bg-gray-50 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="radio"
                              name="vendor-selection"
                              checked={isSelected}
                              onChange={() => setSelectedVendorId(vendor.id)}
                              className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
                            />
                            <span className={`text-xs font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                              {isSelected ? 'Selected' : 'Select'}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Common Approve Button */}
            {selectedVendor && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Selected supplier: <span className="font-semibold text-gray-900">{selectedVendor.name}</span>
                  <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 font-mono text-xs">₹{Number(selectedVendor.grandTotal).toLocaleString('en-IN')}</span>
                </div>
                <button
                  onClick={() => handleApprove(selectedVendor)}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Approving...</span>
                    </>
                  ) : (
                    <span>Approve Selected Quotation</span>
                  )}
                </button>
              </div>
            )}

            <div className="mt-4 text-[#ef4444] text-sm italic">
              Green = lowest price, selecting vendor initiates the approval workflow.
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
