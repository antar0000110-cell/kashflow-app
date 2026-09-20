import React from 'react';
import {
  LayoutDashboard,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Menu,
  Briefcase,
  Key,
  Receipt,
  Users
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { AdminSidebar } from '../components/sidebar/AdminSidebar';
import { OrderDetailsModal } from '../components/common/OrderDetailsModal';
import { useAppStore } from '../store/useAppStore';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const {
    inspectingTransaction,
    setInspectingTransaction,
    activePortal,
    activeSection,
    setActiveSection,
    pendingDeposits,
    pendingWithdrawals,
    toggleMobileDrawer,
  } = useAppStore();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans antialiased text-xs selection:bg-[#8B1E2D]/20">
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar (handles desktop persistent + mobile responsive drawer) */}
        <AdminSidebar />

        {/* Main Workspace Area */}
        <main className={`flex-1 overflow-y-auto min-w-0 bg-[#F8FAFC] ${activePortal === 'admin' ? 'pb-16 md:pb-0' : 'pb-20 md:pb-0'}`}>
          {children}
        </main>
      </div>

      {/* Mobile Sticky Quick-Action Bottom Bar (ONLY visible in Admin mode on mobile screens < 768px) */}
      {activePortal === 'admin' && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-[#0F172A] border-t border-[#1E293B] shadow-2xl px-2 flex items-center justify-around">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeSection === 'dashboard' ? 'text-[#8B1E2D] font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeSection === 'dashboard' ? 'text-[#8B1E2D]' : ''}`} />
            <span className="text-[10px] mt-0.5">Overview</span>
          </button>

          <button
            onClick={() => setActiveSection('pending-deposits')}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors cursor-pointer ${
              activeSection === 'pending-deposits' ? 'text-[#8B1E2D] font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Clock className={`w-4 h-4 ${activeSection === 'pending-deposits' ? 'text-emerald-400' : ''}`} />
              {pendingDeposits.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 bg-[#8B1E2D] text-white rounded-full text-[9px] font-mono font-bold leading-tight">
                  {pendingDeposits.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Deposits</span>
          </button>

          <button
            onClick={() => setActiveSection('pending-withdrawals')}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors cursor-pointer ${
              activeSection === 'pending-withdrawals' ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <ArrowUpRight className={`w-4 h-4 ${activeSection === 'pending-withdrawals' ? 'text-amber-400' : ''}`} />
              {pendingWithdrawals.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 bg-amber-600 text-white rounded-full text-[9px] font-mono font-bold leading-tight">
                  {pendingWithdrawals.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Payouts</span>
          </button>

          <button
            onClick={() => setActiveSection('agent-management')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeSection === 'agent-management' ? 'text-[#8B1E2D] font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className={`w-4 h-4 ${activeSection === 'agent-management' ? 'text-rose-400' : ''}`} />
            <span className="text-[10px] mt-0.5">Agents</span>
          </button>

          <button
            onClick={toggleMobileDrawer}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Menu</span>
          </button>
        </nav>
      )}

      {/* Global Order Details Inspector Modal */}
      {inspectingTransaction && (
        <OrderDetailsModal
          transaction={inspectingTransaction}
          onClose={() => setInspectingTransaction(null)}
        />
      )}
    </div>
  );
};
