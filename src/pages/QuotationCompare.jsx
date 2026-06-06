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
        if (quotesData) setQuotations(quotesData)
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
      <div className="space-y-6 max-w-5xl mx-auto">
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
                    {displayVendors.map((vendor, idx) => (
                      <th
                        key={idx}
                        className={`border border-gray-300 p-4 font-semibold min-w-[180px] ${
                          vendor.isLowestPrice ? 'bg-[#5ee173] text-black' : 'bg-white text-gray-800'
                        }`}
                      >
                        {vendor.name} {vendor.isLowestPrice ? '(Lowest)' : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-4 text-left font-medium text-gray-700">Grand Total</td>
                    {displayVendors.map((vendor, idx) => (
                      <td key={idx} className={`border border-gray-300 p-4 text-gray-900 ${vendor.isLowestPrice ? 'bg-[#5ee173]' : ''}`}>
                        {vendor.grandTotal}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-4 text-left font-medium text-gray-700">GST %</td>
                    {displayVendors.map((vendor, idx) => (
                      <td key={idx} className={`border border-gray-300 p-4 text-gray-900 ${vendor.isLowestPrice ? 'bg-[#5ee173]' : ''}`}>
                        {vendor.gst}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-4 text-left font-medium text-gray-700">Delivery (days)</td>
                    {displayVendors.map((vendor, idx) => (
                      <td key={idx} className={`border border-gray-300 p-4 text-gray-900 ${vendor.isLowestPrice ? 'bg-[#5ee173]' : ''}`}>
                        {vendor.delivery}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-4 text-left font-medium text-gray-700">Vendor rating</td>
                    {displayVendors.map((vendor, idx) => (
                      <td key={idx} className={`border border-gray-300 p-4 text-gray-900 ${vendor.isLowestPrice ? 'bg-[#5ee173]' : ''}`}>
                        {vendor.rating}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-4 text-left font-medium text-gray-700">Payment terms</td>
                    {displayVendors.map((vendor, idx) => (
                      <td key={idx} className={`border border-gray-300 p-4 text-gray-900 ${vendor.isLowestPrice ? 'bg-[#5ee173]' : ''}`}>
                        {vendor.terms}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-4 bg-white"></td>
                    {displayVendors.map((vendor, idx) => (
                      <td key={idx} className={`border border-gray-300 p-4 ${vendor.isLowestPrice ? 'bg-[#5ee173]' : ''}`}>
                        <button
                          onClick={() => handleApprove(vendor)}
                          disabled={submitting}
                          className={`px-5 py-2 rounded-md border text-sm font-medium transition ${
                            vendor.isLowestPrice 
                              ? 'border-gray-900 text-gray-900 hover:bg-[#4bcc62]' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {vendor.isLowestPrice ? 'Select & Approve' : 'Select'}
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-[#ef4444] text-sm italic">
              Green = lowest price, selecting vendor initiates the approval workflow.
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
