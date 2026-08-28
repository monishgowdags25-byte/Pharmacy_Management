import React, { useState, useEffect } from 'react';
import expenseService from '../services/expenseService';
import { useToast } from '../context/ToastContext';
import { 
  Plus, Edit, Trash2, Loader2, DollarSign, 
  Calendar, Clock, FileText, Search, Settings 
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import DemoDataButton from '../components/DemoDataButton';

const Expenses = () => {
  const { showToast } = useToast();

  // Data State
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Filters State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Form Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({
    title: '', description: '', amount: '0', category: 'Rent', date: new Date().toISOString().slice(0, 10)
  });

  // Delete Confirm State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await expenseService.getExpenses({
        search,
        category: categoryFilter,
        startDate,
        endDate,
        page,
        limit: 10
      });

      if (response?.success) {
        setExpenses(response.data.expenses);
        setPagination(response.data.pagination);

        // Compute total expenses locally
        const sum = response.data.expenses.reduce((acc, curr) => acc + curr.amount, 0);
        setTotalExpenses(sum);
      }
    } catch (err) {
      showToast('Failed to load expenses ledger logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, categoryFilter, startDate, endDate, page]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormValues({
      title: '', description: '', amount: '0', category: 'Rent', date: new Date().toISOString().slice(0, 10)
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (expense) => {
    setIsEditing(true);
    setEditingId(expense._id);
    setFormValues({
      title: expense.title,
      description: expense.description || '',
      amount: String(expense.amount),
      category: expense.category,
      date: new Date(expense.date).toISOString().slice(0, 10)
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValues.title || Number(formValues.amount) <= 0) {
      showToast('Enter a valid expense title and amount.', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      if (isEditing) {
        const res = await expenseService.updateExpense(editingId, formValues);
        if (res?.success) {
          showToast('Expense voucher updated successfully!', 'success');
          setFormOpen(false);
          fetchExpenses();
        }
      } else {
        const res = await expenseService.createExpense(formValues);
        if (res?.success) {
          showToast('Expense logged successfully!', 'success');
          setFormOpen(false);
          fetchExpenses();
        }
      }
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const res = await expenseService.deleteExpense(deleteId);
      if (res?.success) {
        showToast('Expense record deleted successfully.', 'success');
        setDeleteOpen(false);
        fetchExpenses();
      }
    } catch (err) {
      showToast('Deletion failed', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: 'Voucher Slip #',
      accessor: 'expenseNumber',
      render: (row) => <span className="font-extrabold text-slate-800 font-mono tracking-tight">{row.expenseNumber}</span>
    },
    {
      header: 'Voucher Title',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-700 block leading-none">{row.title}</span>
          <span className="text-[10px] text-slate-400 mt-1 block leading-none">{row.description || ''}</span>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider">
          {row.category}
        </span>
      )
    },
    {
      header: 'Total Cost',
      accessor: 'amount',
      render: (row) => <span className="font-extrabold text-slate-700">${row.amount.toFixed(2)}</span>
    },
    {
      header: 'Voucher Date',
      accessor: 'date',
      render: (row) => <span className="text-slate-400 font-medium text-xs">{new Date(row.date).toLocaleDateString()}</span>
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(row._id)}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Expenses ledger logs</h1>
          <p className="text-sm text-slate-500">Monitor operational pharmacy outlays, category costs, and financial flows.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <DemoDataButton 
            type="expenses" 
            onSuccess={fetchExpenses} 
          />
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-95"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Expenses Cost</h4>
            <p className="text-2xl font-extrabold text-rose-500">${totalExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl border border-rose-100/30">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Voucher Logs</h4>
            <p className="text-2xl font-extrabold text-blue-500">{pagination?.totalCount || expenses.length}</p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl border border-blue-100/30">
            <FileText className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Date filter deck */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Start Date Range</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">End Date Range</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
          />
        </div>
        <button
          onClick={() => { setStartDate(''); setEndDate(''); setCategoryFilter(''); setSearch(''); setPage(1); }}
          className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold transition focus:outline-none"
        >
          Clear Date Range Filters
        </button>
      </div>

      {/* SearchFilter */}
      <SearchFilter
        searchPlaceholder="Find voucher by title name or slip code..."
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        filters={[
          {
            value: categoryFilter,
            options: [
              { label: 'All Operational Categories', value: '' },
              { label: 'Rent', value: 'Rent' },
              { label: 'Electricity', value: 'Electricity' },
              { label: 'Salary', value: 'Salary' },
              { label: 'Maintenance', value: 'Maintenance' },
              { label: 'Transportation', value: 'Transportation' },
              { label: 'Utilities', value: 'Utilities' },
              { label: 'Other costs category', value: 'Other' }
            ],
            onChange: (val) => { setCategoryFilter(val); setPage(1); }
          }
        ]}
        onClear={() => {
          setSearch('');
          setCategoryFilter('');
          setPage(1);
        }}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Log Expense Form Modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={isEditing ? "Edit Expense Voucher" : "Log Operational Cost Expense"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Expense Title</label>
            <input
              type="text"
              placeholder="e.g. Utility Bills electricity"
              value={formValues.title}
              onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Expense Category</label>
              <select
                value={formValues.category}
                onChange={(e) => setFormValues({ ...formValues, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                required
              >
                <option value="Rent">Rent</option>
                <option value="Electricity">Electricity</option>
                <option value="Salary">Salary</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Transportation">Transportation</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Expense Date</label>
              <input
                type="date"
                value={formValues.date}
                onChange={(e) => setFormValues({ ...formValues, date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Expense Amount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formValues.amount}
                onChange={(e) => setFormValues({ ...formValues, amount: e.target.value })}
                className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Expense description</label>
            <textarea
              placeholder="Operational details memo notes..."
              value={formValues.description}
              onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              rows="2"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 focus:outline-none"
          >
            {formLoading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <span>{isEditing ? "Save Changes" : "Log Operational Cost"}</span>
            )}
          </button>

        </form>
      </Modal>

      {/* Delete Confirmation Drawer */}
      <ConfirmationDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense Voucher Slip"
        message="Are you sure you want to delete this expense voucher record? This action will permanently remove it from financial ledgers and reports."
        loading={deleteLoading}
      />

    </div>
  );
};

export default Expenses;
