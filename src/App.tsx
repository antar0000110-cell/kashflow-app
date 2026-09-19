import React, { useEffect } from 'react';
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

export function App() {
  const {
    authRole,
    activePortal,
    activeSection,
    botConfig,
    globalTrafficActive,
    triggerBotOrder,
    runAutoExpiryCheck,
  } = useAppStore();

  // Background simulation runner for bot traffic and SLA timeouts
  useEffect(() => {
    // Check SLA / auto-pause rules every 10 seconds
    const expiryInterval = setInterval(() => {
      runAutoExpiryCheck();
    }, 10000);

    return () => clearInterval(expiryInterval);
  }, [runAutoExpiryCheck]);

  useEffect(() => {
    const isRunning = botConfig.isEnabled || globalTrafficActive;
    if (!isRunning) return;

    const botTimer = setInterval(() => {
      triggerBotOrder();
    }, (botConfig.intervalSeconds || 90) * 1000);

    return () => clearInterval(botTimer);
  }, [botConfig.isEnabled, globalTrafficActive, botConfig.intervalSeconds, triggerBotOrder]);

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

  return (
    <>
      <AdminLayout>
        {renderContent()}
      </AdminLayout>
      <NotificationPermissionModal />
    </>
  );
}

export default App;
