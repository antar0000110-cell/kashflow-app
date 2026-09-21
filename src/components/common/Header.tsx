import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Menu,
  Shield,
  Smartphone,
  Briefcase,
  Bot,
  Activity,
  Layers,
  Power,
  Volume2,
  VolumeX,
  Clock,
  Radio,
  Send,
  BellRing,
  LogOut
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getCairoCurrentTimeString } from '../../utils/cairoTime';
import { OrderDispatchModal } from '../operations/OrderDispatchModal';
import { getNativePermission } from '../../services/notificationService';
import { NotificationPermissionModal } from '../notifications/NotificationPermissionModal';

export const Header: React.FC = () => {
  const {
    authRole,
    currentUser,
    logout,
    activePortal,
    setActivePortal,
    setActiveSection,
    toggleMobileDrawer,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    globalTrafficActive,
    setGlobalTraffic,
    pendingDeposits,
    pendingWithdrawals,
    soundEnabled,
    toggleSound,
    playTestSound,
    trigger90sPulse,
    lastPulseTime,
    setInspectingTransaction,
    isProductionMode,
    setProductionMode,
    resetSystemData,
  } = useAppStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [cairoTime, setCairoTime] = useState(getCairoCurrentTimeString());
  const [pulseCountdown, setPulseCountdown] = useState(90);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>('default');

  useEffect(() => {
    setPushPermission(getNativePermission());
  }, [isPermissionModalOpen]);

  // Live Cairo Real-Time Clock ticker
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCairoTime(getCairoCurrentTimeString());
      const elapsedSec = Math.floor((Date.now() - lastPulseTime) / 1000);
      const remaining = Math.max(0, 90 - (elapsedSec % 90));
      setPulseCountdown(remaining);
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [lastPulseTime]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalPending = pendingDeposits.length + pendingWithdrawals.length;

  return (
    <header className="bg-[#1E293B] text-white border-b border-[#334155] sticky top-0 z-40 shadow-sm">
      {/* Primary Top Bar */}
      <div className="px-3 sm:px-4 md:px-6 h-14 flex items-center justify-between gap-2">
        {/* Brand & Drawer Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {authRole === 'admin' && (
            <button
              onClick={toggleMobileDrawer}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#334155] focus:outline-none min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer transition-colors"
              title="Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => {
              if (authRole === 'admin') {
                setActivePortal('admin');
                setActiveSection('dashboard');
              }
            }}
            className={`flex items-center gap-2 sm:gap-2.5 select-none ${authRole === 'admin' ? 'cursor-pointer group' : 'cursor-default'}`}
          >
            {authRole === 'agent' || authRole === 'admin' ? (
              <>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-700 to-sky-500 border border-sky-400/40 flex items-center justify-center font-black text-xs text-white shadow-md shrink-0">
                  OS
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-extrabold tracking-wider text-xs sm:text-sm text-white flex items-center gap-1.5">
                    Management OS <span className="px-1.5 py-0.2 text-[9px] font-bold bg-sky-950 text-sky-300 border border-sky-700 rounded">{authRole === 'admin' ? 'ADMIN' : 'AGENT'}</span>
                  </span>
                  <span className="text-[9px] text-sky-300/80 font-mono tracking-tight hidden sm:block">
                    {authRole === 'admin' ? 'GLOBAL REAL-TIME MANAGEMENT SYSTEM' : 'AUTHORIZED AGENT TERMINAL'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <img
                  src="/uzx-logo.png"
                  alt="UZX Wallet Logo"
                  className="w-8 h-8 rounded-lg object-contain shadow-xs shrink-0 bg-white/10 p-0.5"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col text-left">
                  <span className="font-extrabold tracking-widest text-xs sm:text-sm text-white flex items-center gap-1">
                    UZX <span className="text-emerald-400 font-bold">WALLET</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono tracking-tight hidden sm:block">
                    OFFICIAL TRC20 ELECTRONIC WALLET
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Status Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick Dispatch Order Button (Admin Only) */}
          {authRole === 'admin' && (
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#8B1E2D] hover:bg-[#721825] text-white text-xs font-semibold rounded shadow-2xs transition-colors"
              title="Open standardized customer order dispatch form"
            >
              <Send className="w-3.5 h-3.5 text-rose-200" />
              <span>Dispatch Order</span>
            </button>
          )}

          {/* Cairo Real-Time Clock */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-gray-300 bg-[#0F172A] px-2.5 py-1 rounded border border-[#334155]">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[10px] text-gray-400 font-sans">Cairo:</span>
            <span className="font-mono text-[11px] text-white font-semibold">{cairoTime}</span>
          </div>

          {/* 90-Second Alert Timer & Audio Trigger Button */}
          <div className="flex items-center gap-1 bg-[#0F172A] px-2 py-0.5 rounded border border-[#334155]">
            <button
              onClick={trigger90sPulse}
              className="flex items-center gap-1.5 text-[11px] text-gray-300 hover:text-white px-1.5 py-0.5 rounded hover:bg-[#1E293B] transition-colors"
              title="Trigger 90-second operational sync pulse & audio chime"
            >
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span className="font-mono text-rose-400 font-semibold">{pulseCountdown}s</span>
            </button>

            <div className="w-[1px] h-3 bg-slate-700 mx-0.5" />

            <button
              onClick={toggleSound}
              className={`p-1 rounded transition-colors ${
                soundEnabled ? 'text-rose-400 hover:text-rose-300' : 'text-gray-500 hover:text-gray-300'
              }`}
              title={soundEnabled ? 'Sound Alerts: Enabled (Click to Mute)' : 'Sound Alerts: Muted (Click to Enable)'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={playTestSound}
              className="hidden sm:block text-[10px] text-gray-400 hover:text-white px-1 font-mono underline"
              title="Test audio chime"
            >
              Test
            </button>
          </div>

          {/* Global Traffic Switch (Admin Only) */}
          {authRole === 'admin' && (
            <div className="hidden sm:flex items-center gap-2 bg-[#0F172A] px-2.5 py-1 rounded border border-[#334155] text-xs">
              <span className="text-gray-400 text-[11px]">Traffic:</span>
              <button
                onClick={() => setGlobalTraffic(!globalTrafficActive)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                  globalTrafficActive
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                <Power className="w-2.5 h-2.5" />
                {globalTrafficActive ? 'LIVE' : 'PAUSED'}
              </button>
            </div>
          )}

          {/* Push Notifications Permission Status Trigger */}
          {pushPermission !== 'granted' ? (
            <button
              onClick={() => setIsPermissionModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all animate-pulse cursor-pointer"
              title="Click to enable instant deposit & cash-out push notifications"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Enable Push</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPermissionModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors cursor-pointer"
              title="Push notifications active and cached - click to test"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Push Active</span>
            </button>
          )}

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-[#334155] relative focus:outline-none"
              title="Notifications and Real-Time Events"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#8B1E2D] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white text-[#1E293B] rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="bg-[#1E293B] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-[#334155]">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold">Activity & Notifications</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-slate-300 hover:text-white underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Push Notification Banner Inside Dropdown */}
                <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${pushPermission === 'granted' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
                    <span className="text-[11px] font-semibold text-slate-700">
                      {pushPermission === 'granted' ? 'System Push Active' : 'Browser Push Inactive'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      setIsPermissionModalOpen(true);
                    }}
                    className="text-[11px] text-[#8B1E2D] font-bold hover:underline"
                  >
                    {pushPermission === 'granted' ? 'Settings & Test' : 'Enable Now'}
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          if (authRole === 'admin' && notif.targetSection) {
                            setActivePortal('admin');
                            setActiveSection(notif.targetSection as any);
                          } else if (authRole === 'agent') {
                            setActivePortal('agent');
                          }
                          setIsNotifOpen(false);
                        }}
                        className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                          !notif.isRead ? 'bg-rose-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                          {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                          {notif.type === 'danger' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                          {notif.type === 'info' && <Activity className="w-4 h-4 text-[#8B1E2D] shrink-0 mt-0.5" />}
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 flex items-center justify-between">
                              <span>{notif.title}</span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-gray-600 mt-0.5 text-[11px] leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#334155]">
            <div className="w-7 h-7 rounded-full bg-[#8B1E2D] text-white flex items-center justify-center font-bold text-xs shadow-inner uppercase">
              {currentUser?.username ? currentUser.username.substring(0, 2) : 'US'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
                {currentUser?.username || 'Authenticated User'}
              </span>
              <span className="text-[10px] text-rose-400 font-mono capitalize">
                {authRole === 'admin' ? 'Master Admin' : `Agent (${currentUser?.agentId || 'Portal'})`}
              </span>
            </div>

            <button
              onClick={logout}
              className="ml-1 p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-rose-900/50 transition-colors flex items-center gap-1 cursor-pointer"
              title="Sign Out to Login Page"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span className="hidden md:inline text-xs font-bold text-rose-300">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manual Trigger for Notification Permission & Diagnostics */}
      {isPermissionModalOpen && (
        <NotificationPermissionModal
          forceOpen={true}
          onClose={() => {
            setIsPermissionModalOpen(false);
            setPushPermission(getNativePermission());
          }}
        />
      )}
    </header>
  );
};
