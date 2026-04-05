'use client'

import { useEffect, useState } from 'react'

interface Vendor {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  status: string
  commissionRate: string
  totalEarnings: string
  rating: string
  _count: { products: number; orders: number }
  createdAt: string
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchVendors()
  }, [filter])

  const fetchVendors = async () => {
    const url = filter !== 'all' ? `?status=${filter}` : ''
    const res = await fetch(`/api/admin/vendors${url}`)
    const data = await res.json()
    setVendors(data)
    setLoading(false)
  }

  const updateVendor = async (id: string, action: string, rate?: number) => {
    await fetch('/api/admin/vendors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, ...(rate && { rate }) }),
    })
    fetchVendors()
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="all">All Vendors</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Store</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Products</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Earnings</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Commission</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td className="px-6 py-4">
                  <div className="font-medium">{vendor.name}</div>
                  <div className="text-sm text-gray-500">@{vendor.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">{vendor.email}</div>
                  <div className="text-sm text-gray-500">{vendor.phone || '-'}</div>
                </td>
                <td className="px-6 py-4">{vendor._count.products}</td>
                <td className="px-6 py-4">₹{vendor.totalEarnings}</td>
                <td className="px-6 py-4">{vendor.commissionRate}%</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    vendor.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    vendor.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    vendor.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100'
                  }`}>
                    {vendor.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {vendor.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateVendor(vendor.id, 'approve')}
                          className="text-green-600 hover:underline text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateVendor(vendor.id, 'reject')}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {vendor.status === 'APPROVED' && (
                      <button
                        onClick={() => updateVendor(vendor.id, 'suspend')}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Suspend
                      </button>
                    )}
                    {vendor.status === 'SUSPENDED' && (
                      <button
                        onClick={() => updateVendor(vendor.id, 'approve')}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No vendors found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}