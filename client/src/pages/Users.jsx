import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users as UsersIcon, Plus, Edit, Trash2, 
  X, Check, ShieldAlert, Loader2 
} from 'lucide-react';

const Users = () => {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [editMode, setEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CASHIER');
  const [status, setStatus] = useState('Active');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      if (response?.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch users list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditMode(false);
    setSelectedUserId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('CASHIER');
    setStatus('Active');
    setModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditMode(true);
    setSelectedUserId(user._id);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // leave blank unless changing
    setRole(user.role);
    setStatus(user.status);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || (!editMode && !password)) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      if (editMode) {
        const payload = { name, email, role, status };
        if (password) payload.password = password; // Only send if updating password
        
        const response = await api.put(`/users/${selectedUserId}`, payload);
        if (response?.success) {
          showToast('Staff user updated successfully!', 'success');
          setModalOpen(false);
          fetchUsers();
        }
      } else {
        const response = await api.post('/users', { name, email, password, role, status });
        if (response?.success) {
          showToast('Staff user created successfully!', 'success');
          setModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err) {
      showToast(err.message || 'Operation failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?._id) {
      showToast('You cannot delete your own logged-in admin account.', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this staff user?')) {
      return;
    }

    try {
      const response = await api.delete(`/users/${userId}`);
      if (response?.success) {
        showToast('Staff user deleted successfully.', 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Administration</h1>
          <p className="text-sm text-slate-500">Manage user accounts, roles, access permissions and statuses.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-95"
        >
          <Plus className="h-4.5 w-4.5 stroke-[3]" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Users Grid/Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/50">
          <UsersIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No staff members configured in database.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-5">Name</th>
                  <th className="p-5">Email Address</th>
                  <th className="p-5">Role Tier</th>
                  <th className="p-5">Access Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-5 font-bold text-slate-800">{u.name}</td>
                    <td className="p-5 text-slate-500">{u.email}</td>
                    <td className="p-5">
                      <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded text-[10px] uppercase tracking-wider">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center space-x-1 font-bold text-xs ${
                        u.status === 'Active' ? 'text-emerald-600' : 'text-rose-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          u.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}></span>
                        <span>{u.status}</span>
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="inline-flex p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        disabled={u._id === currentUser?._id}
                        className={`inline-flex p-2 border rounded-xl transition ${
                          u._id === currentUser?._id 
                            ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                            : 'bg-rose-50 border-rose-100 hover:bg-rose-100 text-rose-500 hover:text-rose-600'
                        }`}
                        title={u._id === currentUser?._id ? 'Cannot delete yourself' : 'Delete User'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/50 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editMode ? 'Edit Staff Account' : 'Create Staff Account'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  placeholder="name@pharmacare.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Password</label>
                  {editMode && (
                    <span className="text-[10px] text-slate-400 font-medium">Leave blank to keep current</span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder={editMode ? '••••••••' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                  required={!editMode}
                />
              </div>

              {/* Role enum */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Role Tier</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="PHARMACIST">PHARMACIST</option>
                  <option value="INVENTORY_MANAGER">INVENTORY MANAGER</option>
                  <option value="CASHIER">CASHIER</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Access Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive (Deactivated)</option>
                </select>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-[0.98] disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span>{editMode ? 'Save Changes' : 'Register Account'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
