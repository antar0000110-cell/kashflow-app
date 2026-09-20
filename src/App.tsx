import React, { useEffect, useState } from 'react';
import { useNativeApp } from './hooks/useNativeApp';
import { useAppStore } from './store/useAppStore';
import { LoginView } from './components/auth/LoginView';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { PendingDepositsView } from './components/operations/PendingDepositsView';
import { DepositRequestsView } from './components/operations/DepositRequestsView';
import { PendingWithdrawalsView } from './components/operations/PendingWithdrawalsView';
import { ListOfBanksView } from './components/operations/ListOfBanksView';
import { PaymentQueriesView } from './components/operations/PaymentQueriesView';
import { AgentManagementView } from './components/agent/AgentManagementView';
import { AgentPortalView } from './components/agent/AgentPortalView';
import { WalletPoolView } from './components/wallet/WalletPoolView';
import { MobileApkWalletView } from './components/wallet/MobileApkWalletView';
import { BotEngineView } from './components/bot/BotEngineView';
import { FinancialReportsView } from './components/reports/FinancialReportsView';
import { DomainSettingsView } from './components/settings/DomainSettingsView';
import { NotificationPermissionModal } from './components/notifications/NotificationPermissionModal';
import { socketService } from './services/socketService';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  Key, 
  DollarSign, 
  Smartphone, 
  History, 
  Layers,
  ArrowRightLeft
} from 'lucide-react';

export function App({ hasValidSession = false }: { hasValidSession?: boolean }) {
  // Initialize Capacitor-specific native behaviors
  useNativeApp();

  const {
    authRole,
    activePortal,
    activeSection,
    botConfig,
    globalTrafficActive,
    triggerBotOrder,
    runAutoExpiryCheck,
  } = useAppStore();

  // Two-way synchronization of mobile active tabs via CustomEvents
  const [currentAgentTab, setCurrentAgentTab] = useState<'inbound_deposits' | 'inbound_withdrawals' | 'history' | 'wallets' | 'payouts'>('inbound_deposits');
  const [currentWalletTab, setCurrentWalletTab] = useState<'home' | 'deposit' | 'withdraw' | 'transfer' | 'history'>('home');

  useEffect(() => {
    const handleAgentTab = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail) setCurrentAgentTab(ce.detail);
    };
    const handleWalletTab = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail) setCurrentWalletTab(ce.detail);
    };
    window.addEventListener('agent-tab-changed', handleAgentTab);
    window.addEventListener('wallet-tab-changed', handleWalletTab);
    return () => {
      window.removeEventListener('agent-tab-changed', handleAgentTab);
      window.removeEventListener('wallet-tab-changed', handleWalletTab);
    };
  }, []);

  // Connect socket upon valid persistent session mounting
  useEffect(() => {
    if (hasValidSession && authRole !== 'guest') {
      const storedRole = localStorage.getItem('uzx_auth_role');
      let userId = 'admin';
      if (storedRole === 'agent') {
        const storedProfileStr = localStorage.getItem('uzx_user_profile');
        try {
          const profile = storedProfileStr ? JSON.parse(storedProfileStr) : null;
          userId = profile?.agentId || 'AGT-01';
        } catch {
          userId = 'AGT-01';
        }
      }
      socketService.connect(userId);
    }
    return () => {
      socketService.disconnect();
    };
  }, [hasValidSession, authRole]);

  // Background simulation runner for bot traffic and SLA timeouts - strictly gated behind authenticated session
  useEffect(() => {
    if (!hasValidSession || authRole === 'guest') return;

    // Check SLA / auto-pause rules every 10 seconds
    const expiryInterval = setInterval(() => {
      runAutoExpiryCheck();
    }, 10000);

    return () => clearInterval(expiryInterval);
  }, [hasValidSession, authRole, runAutoExpiryCheck]);

  useEffect(() => {
    if (!hasValidSession || authRole === 'guest') return;

    const isRunning = botConfig.isEnabled || globalTrafficActive;
    if (!isRunning) return;

    const botTimer = setInterval(() => {
      triggerBotOrder();
    }, (botConfig.intervalSeconds || 90) * 1000);

    return () => clearInterval(botTimer);
  }, [hasValidSession, authRole, botConfig.isEnabled, globalTrafficActive, botConfig.intervalSeconds, triggerBotOrder]);

  // Unauthenticated Gateway
  if (authRole === 'guest') {
    return <LoginView />;
  }

  const renderContent = () => {
    // If logged in as Agent:
    if (authRole === 'agent' || activePortal === 'agent') {
      return <AgentPortalView />;
    }

    if (activePortal === 'wallet-apk') {
      return <MobileApkWalletView />;
    }

    // Default Admin Portal view routing:
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'pending-deposits':
        return <PendingDepositsView />;
      case 'deposit-requests':
        return <DepositRequestsView />;
      case 'pending-withdrawals':
      case 'withdrawal-requests':
        return <PendingWithdrawalsView />;
      case 'banks':
      case 'bank-accounts':
        return <ListOfBanksView />;
      case 'payment-queries':
        return <PaymentQueriesView isAgentMode={false} />;
      case 'payment-queries-agent':
        return <PaymentQueriesView isAgentMode={true} />;
      case 'agent-management':
      case 'subagents':
      case 'deposit-requests-to-admin':
        return <AgentManagementView />;
      case 'agent-portal':
        return <AgentPortalView />;
      case 'wallet-pool':
      case 'user-wallets':
        return <WalletPoolView />;
      case 'mobile-wallet-apk':
      case 'mobile-apk-wallet':
        return <MobileApkWalletView />;
      case 'bot-engine':
        return <BotEngineView />;
      case 'financial-reports':
      case 'agent-payouts':
      case 'deposit-reports':
      case 'withdrawal-reports':
        return <FinancialReportsView />;
      case 'domain-settings':
        return <DomainSettingsView />;
      case 'transactions':
      case 'transaction-reports':
        return <DepositRequestsView />;
      default:
        return <Dashboard />;
    }
  };

  const renderMobileBottomNavBar = () => {
    // Only render on mobile layout (< 768px) and when logged in
    if (activePortal === 'agent') {
      return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-[#0F172A] border-t border-[#1E293B] shadow-2xl px-2 flex items-center justify-around">
          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              window.dispatchEvent(new CustomEvent('change-agent-tab', { detail: 'inbound_deposits' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentAgentTab === 'inbound_deposits' ? 'text-[#8B1E2D] font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className={`w-4 h-4 ${currentAgentTab === 'inbound_deposits' ? 'text-[#8B1E2D]' : 'text-slate-400'}`} />
            <span className="text-[9px] mt-0.5">Deposits</span>
          </button>

          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              window.dispatchEvent(new CustomEvent('change-agent-tab', { detail: 'inbound_withdrawals' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentAgentTab === 'inbound_withdrawals' ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className={`w-4 h-4 ${currentAgentTab === 'inbound_withdrawals' ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="text-[9px] mt-0.5">Payouts</span>
          </button>

          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              window.dispatchEvent(new CustomEvent('change-agent-tab', { detail: 'history' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentAgentTab === 'history' ? 'text-slate-200 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className={`w-4 h-4 ${currentAgentTab === 'history' ? 'text-slate-200' : 'text-slate-400'}`} />
            <span className="text-[9px] mt-0.5">History</span>
          </button>

          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              window.dispatchEvent(new CustomEvent('change-agent-tab', { detail: 'wallets' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentAgentTab === 'wallets' ? 'text-[#8B1E2D] font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className={`w-4 h-4 ${currentAgentTab === 'wallets' ? 'text-purple-400' : 'text-slate-400'}`} />
            <span className="text-[9px] mt-0.5">Wallets</span>
          </button>

          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              window.dispatchEvent(new CustomEvent('change-agent-tab', { detail: 'payouts' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentAgentTab === 'payouts' ? 'text-emerald-500 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className={`w-4 h-4 ${currentAgentTab === 'payouts' ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="text-[9px] mt-0.5">Earnings</span>
          </button>

          {authRole === 'admin' && (
            <button
              onClick={() => {
                Haptics.impact({ style: ImpactStyle.Light });
                useAppStore.getState().setActivePortal('admin');
                useAppStore.getState().setActiveSection('dashboard');
              }}
              className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-white transition-colors cursor-pointer border-l border-slate-800"
            >
              <Layers className="w-4 h-4 text-rose-400" />
              <span className="text-[9px] mt-0.5 text-rose-300">Admin OS</span>
            </button>
          )}
        </nav>
      );
    }

    if (activePortal === 'wallet-apk') {
      return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-[#0F172A] border-t border-[#1E293B] shadow-2xl px-2 flex items-center justify-around">
          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              window.dispatchEvent(new CustomEvent('change-wallet-tab', { detail: 'home' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentWalletTab === 'home' ? 'text-[#8B1E2D] font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className={`w-4 h-4 ${currentWalletTab === 'home' ? 'text-[#8B1E2D]' : 'text-slate-400'}`} />
            <span className="text-[9px] mt-0.5">Home</span>
          </button>

          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              window.dispatchEvent(new CustomEvent('change-wallet-tab', { detail: 'deposit' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentWalletTab === 'deposit' ? 'text-emerald-500 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className={`w-4 h-4 ${currentWalletTab === 'deposit' ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="text-[9px] mt-0.5">Deposit</span>
          </button>

          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              window.dispatchEvent(new CustomEvent('change-wallet-tab', { detail: 'withdraw' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentWalletTab === 'withdraw' ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className={`w-4 h-4 ${currentWalletTab === 'withdraw' ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="text-[9px] mt-0.5">Withdraw</span>
          </button>

          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              window.dispatchEvent(new CustomEvent('change-wallet-tab', { detail: 'transfer' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentWalletTab === 'transfer' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className={`w-4 h-4 ${currentWalletTab === 'transfer' ? 'text-blue-500' : 'text-slate-400'}`} />
            <span className="text-[9px] mt-0.5">Transfer</span>
          </button>

          <button
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              window.dispatchEvent(new CustomEvent('change-wallet-tab', { detail: 'history' }));
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              currentWalletTab === 'history' ? 'text-slate-200 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className={`w-4 h-4 ${currentWalletTab === 'history' ? 'text-slate-200' : 'text-slate-400'}`} />
            <span className="text-[9px] mt-0.5">History</span>
          </button>

          {authRole === 'admin' && (
            <button
              onClick={() => {
                Haptics.impact({ style: ImpactStyle.Light });
                useAppStore.getState().setActivePortal('admin');
                useAppStore.getState().setActiveSection('dashboard');
              }}
              className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-white transition-colors cursor-pointer border-l border-slate-800"
            >
              <Layers className="w-4 h-4 text-rose-400" />
              <span className="text-[9px] mt-0.5 text-rose-300">Admin OS</span>
            </button>
          )}
        </nav>
      );
    }

    return null;
  };

  return (
    <>
      <AdminLayout>
        {renderContent()}
      </AdminLayout>
      {renderMobileBottomNavBar()}
      <NotificationPermissionModal />
    </>
  );
}

export default App;
