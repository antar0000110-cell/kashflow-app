import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { WalletTemplateConfig } from '../../types';

export const WalletTemplateEditorView: React.FC = () => {
  const { walletTemplate, updateWalletTemplate, setActiveSection } = useAppStore();

  const [formData, setFormData] = useState<WalletTemplateConfig>({
    ...walletTemplate,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [quickAmountInput, setQuickAmountInput] = useState(
    (walletTemplate.quickAmounts || [50, 100, 250, 500, 1000, 3000]).join(', ')
  );

  const handleChange = (field: keyof WalletTemplateConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQuickAmounts = quickAmountInput
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    const finalConfig: WalletTemplateConfig = {
      ...formData,
      quickAmounts: parsedQuickAmounts.length > 0 ? parsedQuickAmounts : [50, 100, 250, 500, 1000, 3000],
      lastUpdated: new Date().toISOString(),
    };

    updateWalletTemplate(finalConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToDefault = () => {
    const defaults: WalletTemplateConfig = {
      appName: 'UZX WALLET',
      brandTagline: 'Official TRC20 Fast Electronic Wallet Gateway',
      primaryColor: '#8B1E2D',
      accentColor: '#10B981',
      depositTitle: 'Fast USDT Deposit',
      withdrawTitle: 'Instant USDT Payout',
      depositAddress: 'TQjX9P2v7h78QvYvLpA69jTzM5wX84L3dK',
      depositNetwork: 'TRC20 Network',
      minDeposit: 10,
      maxDeposit: 10000,
      quickAmounts: [50, 100, 250, 500, 1000, 3000],
      supportUrl: 'https://t.me/UZX_Wallet_Support',
      announcementText: 'Official Mirror App — Fast TRC20 settlements active 24/7',
      showTransactionHistory: true,
      showQrCode: true,
      logoText: 'UZX',
      lastUpdated: new Date().toISOString(),
    };
    setFormData(defaults);
    setQuickAmountInput(defaults.quickAmounts.join(', '));
    updateWalletTemplate(defaults);
  };

  return (
    <div id="wallet-template-editor-view" className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">قالب المحفظة الحي (Live Wallet Template Editor)</h1>
          <p className="text-xs text-slate-500 mt-1">
            تحكم كامل في هوية وتصميم ونصوص واجهة تطبيق المحفظة — التغييرات تنعكس لحظياً على تطبيق الموبايل (APK Mirror)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="reset-template-btn"
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition"
          >
            استعادة الافتراضي
          </button>
          <button
            id="preview-mobile-wallet-btn"
            type="button"
            onClick={() => setActiveSection('mobile-apk-wallet')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded transition"
          >
            فتح تطبيق المحفظة الآن
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div id="save-success-banner" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-medium">
          تم حفظ القالب بنجاح وتم بث التحديثات لجميع مستخدمي تطبيق المحفظة لحظياً.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5 bg-white p-5 rounded-lg border border-slate-200">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase">1. البراند والهوية البصرية</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم التطبيق (App Name)</label>
              <input
                id="template-app-name-input"
                type="text"
                value={formData.appName}
                onChange={(e) => handleChange('appName', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
                placeholder="Management OS"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">شعار / رمز اللوجو (Logo Text)</label>
              <input
                id="template-logo-text-input"
                type="text"
                value={formData.logoText}
                onChange={(e) => handleChange('logoText', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 font-bold"
                placeholder="OS"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الوصف الفرعي (Brand Tagline)</label>
            <input
              id="template-tagline-input"
              type="text"
              value={formData.brandTagline}
              onChange={(e) => handleChange('brandTagline', e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
              placeholder="Decentralized USDT Payment & Settlement Gateway"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اللون الأساسي (Primary Color)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primaryColor || '#8B1E2D'}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  id="template-primary-color-input"
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded font-mono"
                  placeholder="#8B1E2D"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اللون الثانوي (Accent Color)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.accentColor || '#10B981'}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  id="template-accent-color-input"
                  type="text"
                  value={formData.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded font-mono"
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 pt-3 pb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase">2. إعدادات الإيداع والسحب</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان قسم الإيداع (Deposit Title)</label>
              <input
                id="template-deposit-title-input"
                type="text"
                value={formData.depositTitle}
                onChange={(e) => handleChange('depositTitle', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                placeholder="Fast USDT Deposit"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان قسم السحب (Withdrawal Title)</label>
              <input
                id="template-withdraw-title-input"
                type="text"
                value={formData.withdrawTitle}
                onChange={(e) => handleChange('withdrawTitle', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                placeholder="Instant USDT Payout"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">شبكة التحويل الافتراضية (Network)</label>
              <input
                id="template-network-input"
                type="text"
                value={formData.depositNetwork}
                onChange={(e) => handleChange('depositNetwork', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono"
                placeholder="TRC20 Network"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان محفظة الإيداع المباشر</label>
              <input
                id="template-address-input"
                type="text"
                value={formData.depositAddress}
                onChange={(e) => handleChange('depositAddress', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono text-[11px]"
                placeholder="TQjX9P2v7h78QvYvLpA69jTzM5wX84L3dK"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الحد الأدنى للإيداع (USDT)</label>
              <input
                id="template-min-deposit-input"
                type="number"
                value={formData.minDeposit}
                onChange={(e) => handleChange('minDeposit', Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الحد الأقصى للإيداع (USDT)</label>
              <input
                id="template-max-deposit-input"
                type="number"
                value={formData.maxDeposit}
                onChange={(e) => handleChange('maxDeposit', Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                min={10}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">أزرار المبالغ السريعة (Quick Amounts - مفصولة بفواصل)</label>
            <input
              id="template-quick-amounts-input"
              type="text"
              value={quickAmountInput}
              onChange={(e) => setQuickAmountInput(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono"
              placeholder="50, 100, 250, 500, 1000, 3000"
            />
          </div>

          <div className="border-b border-slate-100 pt-3 pb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase">3. الإشعارات وروابط الدعم</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">شريط الإعلانات أعلى المحفظة (Announcement)</label>
            <input
              id="template-announcement-input"
              type="text"
              value={formData.announcementText}
              onChange={(e) => handleChange('announcementText', e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
              placeholder="Official Mirror App — Fast settlements active 24/7"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">رابط الدعم الفني أو التليجرام (Support URL)</label>
            <input
              id="template-support-url-input"
              type="text"
              value={formData.supportUrl}
              onChange={(e) => handleChange('supportUrl', e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono"
              placeholder="https://t.me/ManagementOS_Support"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                id="template-show-history-toggle"
                type="checkbox"
                checked={formData.showTransactionHistory}
                onChange={(e) => handleChange('showTransactionHistory', e.target.checked)}
                className="rounded border-slate-300 text-slate-900"
              />
              عرض سجل المعاملات في الواجهة
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                id="template-show-qr-toggle"
                type="checkbox"
                checked={formData.showQrCode}
                onChange={(e) => handleChange('showQrCode', e.target.checked)}
                className="rounded border-slate-300 text-slate-900"
              />
              تفعيل مسح QR Code
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              id="save-wallet-template-submit"
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#8B1E2D] hover:bg-[#721824] rounded shadow transition"
            >
              حفظ وتطبيق التغييرات لحظياً
            </button>
          </div>
        </form>

        {/* Live Mirror Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase">معاينة لحظية (Live Mobile Mirror)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">REALTIME SYNC</span>
          </div>

          <div className="w-full max-w-[340px] mx-auto bg-slate-900 text-white rounded-2xl p-4 shadow-xl border-4 border-slate-800 space-y-4">
            {/* Phone Top Notch & Brand Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center font-black text-xs text-white"
                  style={{ backgroundColor: formData.primaryColor || '#8B1E2D' }}
                >
                  {formData.logoText || 'OS'}
                </div>
                <div>
                  <div className="text-xs font-bold tracking-tight">{formData.appName || 'Management OS'}</div>
                  <div className="text-[9px] text-slate-400 truncate max-w-[170px]">{formData.brandTagline}</div>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            </div>

            {/* Announcement Banner */}
            {formData.announcementText && (
              <div className="p-2 bg-slate-800 rounded text-[10px] text-slate-300 leading-tight border border-slate-700">
                {formData.announcementText}
              </div>
            )}

            {/* Balance Card Mockup */}
            <div
              className="p-3.5 rounded-xl text-white space-y-2 shadow"
              style={{ backgroundColor: formData.primaryColor || '#8B1E2D' }}
            >
              <div className="text-[10px] text-white/80">Available Liquidity Balance</div>
              <div className="text-xl font-bold font-mono">14,250.00 USDT</div>
              <div className="text-[9px] text-white/70 flex justify-between">
                <span>Network: {formData.depositNetwork || 'TRC20'}</span>
                <span>Active 24/7</span>
              </div>
            </div>

            {/* Quick Actions Mockup */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-800 rounded-lg text-center border border-slate-700">
                <div className="text-xs font-bold text-emerald-400">{formData.depositTitle || 'Deposit'}</div>
                <div className="text-[9px] text-slate-400">Min: {formData.minDeposit} USDT</div>
              </div>
              <div className="p-2.5 bg-slate-800 rounded-lg text-center border border-slate-700">
                <div className="text-xs font-bold text-amber-400">{formData.withdrawTitle || 'Withdraw'}</div>
                <div className="text-[9px] text-slate-400">Instant Settlement</div>
              </div>
            </div>

            {/* Quick Amounts Chips */}
            <div>
              <div className="text-[10px] text-slate-400 mb-1.5 font-medium">Quick Amount Presets:</div>
              <div className="flex flex-wrap gap-1.5">
                {quickAmountInput.split(',').map((amt, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-slate-300 border border-slate-700"
                  >
                    +{amt.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Support & Security Footer */}
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[9px] text-slate-500">
              <span>Encrypted Settlement Node</span>
              <span className="text-slate-400 underline">Support Link</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
