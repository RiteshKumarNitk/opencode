'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const availablePermissions = [
  { group: 'Products', permissions: ['products.view', 'products.create', 'products.update', 'products.delete'] },
  { group: 'Orders', permissions: ['orders.view', 'orders.update', 'orders.delete'] },
  { group: 'Customers', permissions: ['customers.view', 'customers.update'] },
  { group: 'Coupons', permissions: ['coupons.manage'] },
  { group: 'Categories', permissions: ['categories.manage'] },
  { group: 'Reviews', permissions: ['reviews.manage'] },
  { group: 'Settings', permissions: ['settings.manage'] },
  { group: 'Reports', permissions: ['reports.view', 'reports.export'] },
];

export default function RolesPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[], isDefault: false });
  const [activeTab, setActiveTab] = useState('roles');
  const queryClient = useQueryClient();

  const { data: roles, isLoading: loadingRoles } = useQuery({ queryKey: ['admin-roles'], queryFn: () => fetch('/api/admin/roles').then(r => r.json()).then(data => Array.isArray(data) ? data : []) });
  const { data: admins } = useQuery({ queryKey: ['admin-users'], queryFn: () => fetch('/api/admin/roles?type=admins').then(r => r.json()).then(data => Array.isArray(data) ? data : []) });

  const createMutation = useMutation({
    mutationFn: () => fetch('/api/admin/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-roles'] }); setShowModal(false); setForm({ name: '', description: '', permissions: [], isDefault: false }); },
  });

  const togglePermission = (perm: string) => {
    setForm(f => ({ ...f, permissions: f.permissions.includes(perm) ? f.permissions.filter(p => p !== perm) : [...f.permissions, perm] }));
  };

  if (loadingRoles) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Roles</h1>
          <p className="text-gray-500 text-sm">Manage admin permissions and roles</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Create Role</button>
      </div>

      <div className="flex gap-2 mb-6">
        {['roles', 'admins'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab === 'roles' ? 'Roles' : 'Admin Users'}
          </button>
        ))}
      </div>

      {activeTab === 'roles' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(roles || []).map((role: any) => (
            <div key={role.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">{role.name}</h3>
                {role.isDefault && <span className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-600 rounded">Default</span>}
              </div>
              <p className="text-sm text-gray-500 mb-3">{role.description || 'No description'}</p>
              <div className="text-sm text-gray-500 mb-3">{role._count?.admins || 0} admins</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {role.permissions?.slice(0, 5).map((p: string) => (
                  <span key={p} className="px-2 py-0.5 text-xs bg-gray-100 rounded">{p}</span>
                ))}
                {role.permissions?.length > 5 && <span className="px-2 py-0.5 text-xs bg-gray-100 rounded">+{role.permissions.length - 5} more</span>}
              </div>
              {role.isDefault ? (
                <button disabled className="w-full px-3 py-1.5 text-sm text-gray-400 border border-gray-200 rounded-lg cursor-not-allowed">Cannot Delete</button>
              ) : (
                <button className="w-full px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Delete Role</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Admin</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {(admins || []).length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No admins found</td></tr>
              ) : (
                (admins || []).map((admin: any) => (
                  <tr key={admin.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{admin.user.firstName} {admin.user.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{admin.user.email}</td>
                    <td className="px-4 py-3">{admin.role.name}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(admin.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Role</h2>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
                <label className="text-sm text-gray-700">Set as default role</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {availablePermissions.map(group => (
                    <div key={group.group}>
                      <p className="text-xs font-medium text-gray-500 mb-2">{group.group}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.permissions.map(perm => (
                          <label key={perm} className="flex items-center gap-1 text-sm">
                            <input type="checkbox" checked={form.permissions.includes(perm)} onChange={() => togglePermission(perm)} className="rounded" />
                            <span>{perm.split('.')[1]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}