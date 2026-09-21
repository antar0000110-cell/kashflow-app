import React, { useState } from 'react';
import { Plus, Edit2, Check, X, Building2, Search, Power } from 'lucide-react';
import { Breadcrumb } from '../common/Breadcrumb';
import { PaginationBar } from '../common/PaginationBar';
import { useAppStore } from '../../store/useAppStore';
import { BankAccount } from '../../types';

export const ListOfBanksView: React.FC = () => {
  const { banks, addBank, updateBank, toggleBankActive } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);

  // Form state
  const [formBankName, setFormBankName] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formAccountHolder, setFormAccountHolder] = useState('');
  const [formProvider, setFormProvider] = useState('TRC20 Network');
  const [formIsActive, setFormIsActive] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const filteredBanks = banks.filter((b) =>
    b.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id.includes(searchTerm) ||
    b.accountNumber.includes(searchTerm)
  );

  const handleOpenAdd = () => {
    setEditingBank(null);
    setFormBankName('');
    setFormAccountNumber('');
    setFormAccountHolder('');
    setFormProvider('TRC20 Network');
    setFormIsActive(true);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (b: BankAccount) => {
    setEditingBank(b);
    setFormBankName(b.bankName);
    setFormAccountNumber(b.accountNumber);
    setFormAccountHolder(b.accountHolder);
    setFormProvider(b.provider);
    setFormIsActive(b.isActive);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBankName.trim()) return;

    if (editingBank) {
      updateBank(editingBank.id, {
        bankName: formBankName,
        accountNumber: formAccountNumber,
        accountHolder: formAccountHolder,
        provider: formProvider,
        isActive: formIsActive,
      });
    } else {
      addBank({
        bankName: formBankName,
        accountNumber: formAccountNumber,
        accountHolder: formAccountHolder,
        provider: formProvider,
        isActive: formIsActive,
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="p-3 md:p-5 space-y-4">
      <Breadcrumb items={[{ label: 'Bank Transfers', section: 'banks' }, { label: 'Master Bank Accounts' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#8B1E2D]" />
            <span>Master Bank Accounts & Gateways</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure central receiving accounts, telecom gateway numbers, and active traffic state.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bank Account</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search bank name, account number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-7 pl-8 pr-2 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-[#8B1E2D]"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Gateways: <span className="font-bold text-slate-900">{banks.length}</span> (Active:{' '}
          <span className="font-bold text-emerald-600">{banks.filter((b) => b.isActive).length}</span>)
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 select-none">
                <th className="py-2.5 px-3 font-semibold text-[11px]">ID</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Bank / Gateway Name</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Account / Phone Number</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Account Holder</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Provider Type</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-[11px]">Date Created</th>
                <th className="py-2.5 px-3 font-semibold text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBanks.map((bank) => (
                <tr key={bank.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-mono font-semibold text-slate-700">{bank.id}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{bank.bankName}</td>
                  <td className="py-2 px-3 font-mono text-slate-700 select-all">{bank.accountNumber}</td>
                  <td className="py-2 px-3 text-slate-700">{bank.accountHolder}</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 border border-slate-200">
                      {bank.provider}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => toggleBankActive(bank.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        bank.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                      title="Click to toggle gateway active state"
                    >
                      <Power className="w-2.5 h-2.5" />
                      <span>{bank.isActive ? 'Active' : 'Disabled'}</span>
                    </button>
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{bank.createdAt}</td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => handleOpenEdit(bank)}
                      className="p-1 rounded text-slate-600 hover:text-white hover:bg-[#8B1E2D] transition-colors"
                      title="Edit Bank Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50/50">
          <PaginationBar
            totalItems={filteredBanks.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {editingBank ? 'Edit Bank Gateway' : 'Add New Bank Gateway'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bank / Gateway Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRC20 Gateway 9253"
                  value={formBankName}
                  onChange={(e) => setFormBankName(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:ring-1 focus:ring-[#8B1E2D]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Account / Wallet ID</label>
                <input
                  type="text"
                  required
                  placeholder="Wallet ID (e.g. T...)"
                  value={formAccountNumber}
                  onChange={(e) => setFormAccountNumber(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:ring-1 focus:ring-[#8B1E2D]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  placeholder="Central Ops"
                  value={formAccountHolder}
                  onChange={(e) => setFormAccountHolder(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:ring-1 focus:ring-[#8B1E2D]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Provider Type</label>
                <select
                  value={formProvider}
                  onChange={(e) => setFormProvider(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-300 rounded bg-white text-slate-800"
                >
                  <option value="TRC20 Network">TRC20 Network</option>
                  <option value="TRON Direct">TRON Direct</option>
                  <option value="USDT Hot Wallet">USDT Hot Wallet</option>
                  <option value="Central Liquidity Node">Central Liquidity Node</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bankActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-[#8B1E2D] focus:ring-[#8B1E2D]"
                />
                <label htmlFor="bankActive" className="text-slate-700 font-medium">
                  Active for automatic deposit dispatch
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded text-xs font-semibold shadow-2xs"
                >
                  Save Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
