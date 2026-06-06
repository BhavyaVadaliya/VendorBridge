import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function Quotations() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Exact mock data from Screen 6 excalidraw
  const [items, setItems] = useState([
    { name: 'Ergonomic chair', qty: 25, price: 3500, total: 87500, delivery: 7 },
    { name: 'Tech Desk LTD', qty: 10, price: 8200, total: 82000, delivery: 14 }
  ])
  const [gst, setGst] = useState('18')
  const [notes, setNotes] = useState('Payment terms: 30 days net...')
  
  const handlePriceChange = (index, val) => {
    const newItems = [...items]
    newItems[index].price = val
    newItems[index].total = val * newItems[index].qty
    setItems(newItems)
  }

  const handleDeliveryChange = (index, val) => {
    const newItems = [...items]
    newItems[index].delivery = val
    setItems(newItems)
  }

  const subtotal = items.reduce((acc, item) => acc + item.total, 0)
  const gstAmount = subtotal * (Number(gst) / 100)
  const grandTotal = subtotal + gstAmount

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-0">
        
        {/* Navigation Tabs for Quotations */}
        <div className="flex items-center gap-6 border-b border-gray-300 pb-2 mb-6">
          <button 
            className="text-[15px] font-medium text-green-600 border-b-2 border-green-600 pb-2 -mb-[9px]"
          >
            Submit Quotation
          </button>
          <button 
            className="text-[15px] font-medium text-gray-500 hover:text-gray-900 pb-2 -mb-[9px]"
            onClick={() => navigate('/quotations/compare')}
          >
            Compare Quotations
          </button>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-[28px] font-medium text-gray-900 mb-1">Submit Quotations</h1>
          <p className="text-gray-900 text-[15px]">
            RFQ: office furniture procurement q2 - deadline 15 june 2025
          </p>
        </div>

        {/* RFQ Summary Box */}
        <div className="border border-gray-400 rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-600 mb-1 font-medium">RFQ Summary</p>
          <p className="text-sm text-gray-900">
            Ergonomic chair * 25, standing desk * 10 - category furniture
          </p>
        </div>

        {/* Your Quotation Table */}
        <div className="mt-8">
          <p className="text-xs text-gray-600 mb-2 font-medium">Your Quotation</p>
          <div className="border border-gray-400 rounded-lg bg-white overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="p-3 border-r border-gray-400 font-medium text-gray-800">Item</th>
                  <th className="p-3 border-r border-gray-400 font-medium text-gray-800 w-24">Qty</th>
                  <th className="p-3 border-r border-gray-400 font-medium text-gray-800 w-32">Unit price</th>
                  <th className="p-3 border-r border-gray-400 font-medium text-gray-800 w-32">Total</th>
                  <th className="p-3 font-medium text-gray-800 w-32">Delivery (days)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-400 last:border-b-0">
                    <td className="p-3 border-r border-gray-400 text-gray-900">{item.name}</td>
                    <td className="p-3 border-r border-gray-400 text-gray-900">{item.qty}</td>
                    <td className="p-3 border-r border-gray-400">
                      <input 
                        type="number" 
                        value={item.price}
                        onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                        className="w-full focus:outline-none bg-transparent"
                      />
                    </td>
                    <td className="p-3 border-r border-gray-400 text-gray-900">
                      {item.total.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        value={item.delivery}
                        onChange={(e) => handleDeliveryChange(idx, Number(e.target.value))}
                        className="w-full focus:outline-none bg-transparent"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mt-8">
          
          {/* Left: Tax & Notes */}
          <div className="w-full md:w-1/2 space-y-6">
            <div>
              <p className="text-xs text-gray-600 mb-1 font-medium">Tax / GST %</p>
              <input 
                type="text" 
                value={gst + ' %'}
                onChange={(e) => setGst(e.target.value.replace(' %', ''))}
                className="border border-gray-400 rounded-md w-full max-w-[200px] p-2 text-sm text-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1 font-medium">Note / Terms</p>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="border border-gray-400 rounded-md w-full max-w-[300px] p-2 text-sm text-gray-900 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Right: Summary Box */}
          <div className="w-full md:w-[400px] border border-gray-400 rounded-lg p-5 bg-white">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-800">Subtotal</span>
                <span className="text-gray-900">{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-800">GST ({gst}%)</span>
                <span className="text-gray-900">{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-gray-300 my-2 pt-4 flex justify-between items-center text-sm">
                <span className="text-gray-800">Grand total</span>
                <span className="text-gray-900">{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-8">
          <button className="px-6 py-2 border border-gray-400 rounded-md text-sm text-gray-800 font-medium hover:bg-gray-50 transition">
            Submit Quotation
          </button>
          <button className="px-6 py-2 border border-gray-400 rounded-md text-sm text-gray-800 font-medium hover:bg-gray-50 transition">
            Save Draft
          </button>
        </div>

      </div>
    </Layout>
  )
}
