'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface VendorStats {
  totalOrders: number
  pendingOrders: number
  shippedOrders: number
  deliveredOrders: number
  totalEarnings: number
  pendingPayout: number
}

interface VendorOrder {
  id: string
  vendorOrderId: string
  status: string
  itemCount: number
  itemTotal: string
  earnings: string
  createdAt: string
  order: {
    orderNumber: string
    address: {
      fullName: string
      phone: string
      line1: string
      city: string
      state: string
    }
  }
}

export default function VendorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [activeTab, setActiveTab] = useState('orders')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/vendor/dashboard')
    } else if (status === 'authenticated') {
      fetchDashboard()
    }
  }, [status])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/vendor/dashboard')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await fetch('/api/vendor/dashboard', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateOrderStatus', orderId, status: newStatus }),
    })
    fetchDashboard()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
          <p className="mt-2 opacity-80">Manage your store and orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-pink-600">{stats?.totalOrders || 0}</div>
            <div className="text-gray-500">Total Orders</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingOrders || 0}</div>
            <div className="text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">₹{stats?.totalEarnings?.toFixed(2) || '0.00'}</div>
            <div className="text-gray-500">Total Earnings</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">₹{stats?.pendingPayout?.toFixed(2) || '0.00'}</div>
            <div className="text-gray-500">Pending Payout</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b px-6 py-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-4 font-medium ${activeTab === 'orders' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500'}`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-4 font-medium ${activeTab === 'products' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500'}`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`pb-4 font-medium ${activeTab === 'payouts' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500'}`}
              >
                Payouts
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'orders' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Order ID</th>
                      <th className="text-left py-3">Customer</th>
                      <th className="text-left py-3">Items</th>
                      <th className="text-left py-3">Total</th>
                      <th className="text-left py-3">Earnings</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-left py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="py-3">{order.vendorOrderId}</td>
                        <td className="py-3">
                          <div>{order.order.address.fullName}</div>
                          <div className="text-sm text-gray-500">{order.order.address.phone}</div>
                        </td>
                        <td className="py-3">{order.itemCount}</td>
                        <td className="py-3">₹{order.itemTotal}</td>
                        <td className="py-3">₹{order.earnings}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                              className="text-pink-600 hover:underline text-sm"
                            >
                              Confirm
                            </button>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                              className="text-pink-600 hover:underline text-sm"
                            >
                              Ship
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">No orders yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Add products from your inventory</p>
                <a href="/admin/products" className="text-pink-600 hover:underline">Go to Products</a>
              </div>
            )}

            {activeTab === 'payouts' && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Payout history will appear here</p>
                {stats && stats.pendingPayout > 0 && (
                  <button className="bg-pink-600 text-white px-4 py-2 rounded-lg">
                    Request Payout
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}