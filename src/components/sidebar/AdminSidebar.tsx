import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  ArrowDownToLine,
  Clock,
  ArrowUpFromLine,
  FileQuestion,
  Users,
  Wallet as WalletIcon,
  Receipt,
  CreditCard,
  Layers,
  Coins,
  FileText,
  TrendingUp,
  Share2,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Bot,
  Key,
  Smartphone,
  Briefcase,
  ChevronLeft,
  DollarSign,
  AlertCircle,
  HelpCircle,
  ArrowRightLeft,
  ShieldAlert,
  Send,
  UserCheck,
  FileSpreadsheet,
  Globe,
  X,
  Shield
} from 'lucide-react';
import { useAppStore, AppSection } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';

interface MenuItem {
  id: AppSection;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeColor?: string;
}

interface MenuSection {
  title: string;
  icon: React.ReactNode;
  defaultOpen: boolean;
  items: MenuItem[];
}

export const AdminSidebar: React.FC = () => {
  const {
    authRole,
    activeSection,
    setActiveSection,
    activePortal,
    setActivePortal,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
    pendingDeposits,
    pendingWithdrawals,
    agentDepositRequests,
    agents,
    selectedAgentId,
    wallets,
    isProductionMode,
  } = useAppStore();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'OPERATIONS & TRANSFERS': true,
    'AGENT MANAGEMENT': true,
    'USER DIRECTORY': true,
    'PAYMENTS & GATEWAYS': false,
    'FINANCIAL REPORTS': false,
    'SYSTEM ENGINE': false,
  });

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen, setMobileDrawerOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  // Strict role separation: Agents NEVER see or interact with the Admin Sidebar
  if (authRole === 'agent') {
    return null;
  }

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const pendingAgentDepCount = agentDepositRequests.filter((r) => r.status === 'Pending').length;

  // Selected agent for agent portal
  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const agentPendingDeposits = pendingDeposits.filter(
    (tx) => tx.subagentId === currentAgent?.id || tx.subagentName?.includes(currentAgent?.name || '')
  );
  const agentAssignedWallets = wallets.filter(
    (w) => w.agentId === currentAgent?.id || w.assignedAgentId === currentAgent?.id
  );

  // Admin menu configuration
  const adminSections: MenuSection[] = [
    {
      title: 'OPERATIONS & TRANSFERS',
      icon: <DollarSign className="w-3.5 h-3.5 text-rose-400" />,
      defaultOpen: true,
      items: [
        {
          id: 'dashboard',
          label: 'Operations Overview',
          icon: <LayoutDashboard className="w-3.5 h-3.5 text-rose-400" />,
        },
        {
          id: 'banks',
          label: 'Master Bank Accounts',
          icon: <Building2 className="w-3.5 h-3.5" />,
        },
        {
          id: 'pending-deposits',
          label: 'Pending Deposits Queue',
          icon: <Clock className="w-3.5 h-3.5 text-emerald-400" />,
          badge: pendingDeposits.length,
          badgeColor: 'bg-[#8B1E2D]',
        },
        {
          id: 'deposit-requests',
          label: 'Deposit Requests History',
          icon: <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />,
        },
        {
          id: 'pending-withdrawals',
          label: 'Pending Payouts Queue',
          icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
          badge: pendingWithdrawals.length,
          badgeColor: 'bg-amber-600',
        },
        {
          id: 'withdrawal-requests',
          label: 'Withdrawal Requests History',
          icon: <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-400" />,
        },
        {
          id: 'payment-queries',
          label: 'Payment Queries & Claims',
          icon: <FileQuestion className="w-3.5 h-3.5 text-sky-400" />,
        },
      ],
    },
    {
      title: 'AGENT MANAGEMENT',
      icon: <Briefcase className="w-3.5 h-3.5 text-rose-400" />,
      defaultOpen: true,
      items: [
        {
          id: 'agent-management',
          label: 'Subagent Accounts & Quotas',
          icon: <Users className="w-3.5 h-3.5" />,
          badge: pendingAgentDepCount > 0 ? `${pendingAgentDepCount} New` : undefined,
          badgeColor: 'bg-[#8B1E2D]',
        },
        {
          id: 'wallet-pool',
          label: '6,000 Wallets & OTP Pool',
          icon: <Key className="w-3.5 h-3.5 text-purple-400" />,
        },
        {
          id: 'agent-portal',
          label: 'Agent Operational Terminal',
          icon: <Briefcase className="w-3.5 h-3.5 text-amber-400" />,
        },
        {
          id: 'mobile-wallet-apk',
          label: 'Agent Wallet APK & Share Link',
          icon: <Smartphone className="w-3.5 h-3.5 text-rose-300" />,
        },
      ],
    },
    {
      title: 'USER DIRECTORY',
      icon: <Users className="w-3.5 h-3.5 text-slate-400" />,
      defaultOpen: true,
      items: [
        {
          id: 'users',
          label: 'Users List',
          icon: <Users className="w-3.5 h-3.5" />,
        },
        {
          id: 'user-wallets',
          label: 'User Wallets Directory',
          icon: <WalletIcon className="w-3.5 h-3.5" />,
        },
        {
          id: 'transactions',
          label: 'Universal Transaction Ledger',
          icon: <Receipt className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      title: 'PAYMENTS & GATEWAYS',
      icon: <CreditCard className="w-3.5 h-3.5 text-slate-400" />,
      defaultOpen: false,
      items: [
        {
          id: 'payment-providers',
          label: 'Payment Providers',
          icon: <Layers className="w-3.5 h-3.5" />,
        },
        {
          id: 'currencies',
          label: 'Currencies & Rates',
          icon: <Coins className="w-3.5 h-3.5" />,
        },
        {
          id: 'bank-accounts',
          label: 'Partner Banking Accounts',
          icon: <Building2 className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      title: 'FINANCIAL REPORTS',
      icon: <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />,
      defaultOpen: true,
      items: [
        {
          id: 'financial-reports',
          label: 'Agent Profit Excel Reports',
          icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />,
        },
        {
          id: 'agent-audit',
          label: 'Real-Time Commission Audit',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />,
        },
        {
          id: 'agent-payouts',
          label: 'Agent Payouts & Balance Top-up',
          icon: <DollarSign className="w-3.5 h-3.5 text-amber-400" />,
        },
        {
          id: 'deposit-reports',
          label: 'Deposit Analytics',
          icon: <TrendingUp className="w-3.5 h-3.5" />,
        },
        {
          id: 'referrals',
          label: 'Referral Commissions',
          icon: <Share2 className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      title: 'SYSTEM ENGINE',
      icon: <Bot className="w-3.5 h-3.5 text-rose-400" />,
      defaultOpen: false,
      items: [
        {
          id: 'bot-engine',
          label: '6k Traffic Engine & Dynamic Ratios',
          icon: <Bot className="w-3.5 h-3.5" />,
        },
        {
          id: 'domain-settings',
          label: 'Domains & Server Deployment',
          icon: <Globe className="w-3.5 h-3.5 text-blue-400" />,
        },
        {
          id: 'admin-users',
          label: 'System Administrators',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
        },
        {
          id: 'settings',
          label: 'Platform Settings',
          icon: <Settings className="w-3.5 h-3.5" />,
        },
      ],
    },
  ];

  const handleNavClick = (sectionId: AppSection) => {
    setActiveSection(sectionId);
    if (isMobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  };

  // Agent navigation items (Used for both Desktop Agent sidebar and Mobile Drawer Agent mode)
  const renderAgentNavContent = (isCollapsed: boolean, isMobile: boolean) => (
    <div className="flex flex-col h-full">
      {/* Agent Profile & Header Card */}
      <div className="p-3.5 border-b border-[#1E293B] bg-[#1E293B]/40">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Agent Terminal</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div>
              <div className="text-xs font-bold text-white truncate">
                {currentAgent?.name || 'Agent Workspace'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Balance: <strong className="text-emerald-400">{formatCurrency(currentAgent?.currentBalance || 0, 'EGP')}</strong>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                ID: {currentAgent?.id} • @{currentAgent?.username}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Briefcase className="w-5 h-5 text-amber-400" />
          </div>
        )}
      </div>

      {/* Agent Dedicated Navigation Items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 select-none">
        <button
          onClick={() => handleNavClick('agent-portal')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSection === 'agent-portal'
              ? 'bg-[#8B1E2D] text-white shadow-2xs font-semibold'
              : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            {!isCollapsed && <span>Inbound Orders Queue</span>}
          </div>
          {!isCollapsed && agentPendingDeposits.length > 0 && (
            <span className="px-1.5 py-0.5 bg-[#8B1E2D] border border-rose-500 text-white rounded-full text-[10px] font-mono font-bold">
              {agentPendingDeposits.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleNavClick('deposit-requests')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSection === 'deposit-requests'
              ? 'bg-[#8B1E2D] text-white shadow-2xs font-semibold'
              : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            {!isCollapsed && <span>Processed Deposits History</span>}
          </div>
        </button>

        <button
          onClick={() => handleNavClick('withdrawal-requests')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSection === 'withdrawal-requests'
              ? 'bg-[#8B1E2D] text-white shadow-2xs font-semibold'
              : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ArrowUpFromLine className="w-4 h-4 text-rose-400" />
            {!isCollapsed && <span>Processed Withdrawals History</span>}
          </div>
        </button>

        <button
          onClick={() => handleNavClick('wallet-pool')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSection === 'wallet-pool'
              ? 'bg-[#8B1E2D] text-white shadow-2xs font-semibold'
              : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-purple-400" />
            {!isCollapsed && <span>Assigned SIMs & Live OTPs</span>}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] font-mono text-slate-400">
              {agentAssignedWallets.length} SIMs
            </span>
          )}
        </button>

        <button
          onClick={() => handleNavClick('payment-queries-agent')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSection === 'payment-queries-agent' || activeSection === 'payment-queries'
              ? 'bg-[#8B1E2D] text-white shadow-2xs font-semibold'
              : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            {!isCollapsed && <span>Raise Complaint / Inquiry</span>}
          </div>
          {!isCollapsed && (
            <span className="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded text-[10px]">
              Support
            </span>
          )}
        </button>
      </div>

      {/* Footer: Switch back to Admin (Only if logged in as Admin) */}
      {authRole === 'admin' && (
        <div className="p-3 border-t border-[#1E293B] bg-[#1E293B]/20">
          <button
            onClick={() => {
              setActivePortal('admin');
              setActiveSection('dashboard');
              if (isMobile) setMobileDrawerOpen(false);
            }}
            className="w-full py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 shadow-2xs cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#8B1E2D]" />
            {!isCollapsed && <span>Switch to Admin Mode</span>}
          </button>
        </div>
      )}
    </div>
  );

  // Admin navigation items (Used for both Desktop Admin sidebar and Mobile Drawer Admin mode)
  const renderAdminNavContent = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full">
      {/* Sidebar Top Collapse Toggle */}
      <div className="h-11 px-3 flex items-center justify-between border-b border-[#1E293B] bg-[#1E293B]/20">
        {!isCollapsed && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Navigation Console
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors ml-auto cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-200 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Admin Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3 select-none no-scrollbar">
        {adminSections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            {!isCollapsed && (
              <button
                onClick={() => toggleSection(sec.title)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  {sec.icon}
                  <span>{sec.title}</span>
                </div>
                {openSections[sec.title] ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            )}

            {(openSections[sec.title] || isCollapsed) && (
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#8B1E2D] text-white shadow-2xs font-semibold'
                          : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={isActive ? 'text-white' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] rounded-full text-white font-mono font-bold shrink-0 ml-1.5 ${
                            item.badgeColor || 'bg-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP PERSISTENT SIDEBAR (Hidden on mobile phones, shown on md and larger screens) */}
      <aside
        className={`hidden md:flex bg-[#0F172A] text-slate-200 border-r border-[#1E293B] flex-col shrink-0 transition-all duration-300 z-30 h-full ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {activePortal === 'agent'
          ? renderAgentNavContent(isSidebarCollapsed, false)
          : renderAdminNavContent(isSidebarCollapsed)}
      </aside>

      {/* 2. MOBILE SLIDE-OVER DRAWER (Rendered when hamburger menu is toggled on mobile) */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay with smooth fade */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Slide-out Drawer Panel */}
          <div className="relative w-72 sm:w-80 max-w-[85vw] bg-[#0F172A] text-slate-200 shadow-2xl flex flex-col h-full border-r border-[#1E293B] z-10 transform transition-transform duration-300 ease-out">
            {/* Drawer Top Header with Brand & Close Button */}
            <div className="h-14 px-4 bg-[#1E293B]/80 border-b border-[#334155] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#8B1E2D] flex items-center justify-center font-bold text-white shadow-xs">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold tracking-wider text-xs text-white">
                    KASH<span className="text-rose-400">FLOW</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {activePortal === 'agent' ? 'AGENT TERMINAL' : 'ADMIN CONSOLE'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Menu for Mobile */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {activePortal === 'agent'
                ? renderAgentNavContent(false, true)
                : renderAdminNavContent(false)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
