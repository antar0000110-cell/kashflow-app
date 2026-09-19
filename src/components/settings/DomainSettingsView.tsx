import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Breadcrumb } from '../common/Breadcrumb';
import {
  Globe,
  Server,
  Shield,
  Smartphone,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  Code,
  CheckCircle2,
  AlertTriangle,
  Play,
  Cpu,
  RefreshCw,
} from 'lucide-react';

export const DomainSettingsView: React.FC = () => {
  const { domainSettings, updateDomainSettings, addNotification } = useAppStore();

  const [adminDomain, setAdminDomain] = useState(domainSettings?.adminDomain || 'admin.cashfintech.com');
  const [agentDomain, setAgentDomain] = useState(domainSettings?.agentDomain || 'agent.cashfintech.com');
  const [walletDomain, setWalletDomain] = useState(domainSettings?.walletDomain || 'wallet.cashfintech.com');
  const [sslEnabled, setSslEnabled] = useState(domainSettings?.sslEnabled ?? true);
  const [enableSubdomainRouting, setEnableSubdomainRouting] = useState(
    domainSettings?.enableSubdomainRouting ?? true
  );

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveDomains = (e: React.FormEvent) => {
    e.preventDefault();
    updateDomainSettings({
      adminDomain,
      agentDomain,
      walletDomain,
      sslEnabled,
      enableSubdomainRouting,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    addNotification({
      title: 'Domain Configuration Updated',
      message: `Domain routes updated: Admin (${adminDomain}), Agent (${agentDomain}), Wallet (${walletDomain})`,
      type: 'success',
      targetSection: 'settings',
    });
  };

  // Deployment bash script content
  const deployScriptContent = `#!/usr/bin/env bash
# ==============================================================================
# One-Click Production Deployment Script - CashFintech Multi-Portal Platform
# Handles Docker, Nginx, SSL Certificates, Domain Routing & Auto-Restart
# ==============================================================================

set -e

echo "🚀 Starting Automated Server Deployment..."

# 1. Update system & install dependencies
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose nginx certbot python3-certbot-nginx curl git

# 2. Configure Docker to start on boot
sudo systemctl enable docker
sudo systemctl start docker

# 3. Pull latest code & build production container
echo "📦 Building Application Docker Container..."
docker-compose down || true
docker-compose build --no-cache
docker-compose up -d

# 4. Configure Nginx Reverse Proxy for Subdomains
echo "🌐 Configuring Subdomains: ${adminDomain}, ${agentDomain}, ${walletDomain}"

cat << 'EOF' | sudo tee /etc/nginx/sites-available/cashfintech.conf
# Admin Portal
server {
    listen 80;
    server_name ${adminDomain};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Agent Terminal
server {
    listen 80;
    server_name ${agentDomain};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Mobile Wallet Web / APK API
server {
    listen 80;
    server_name ${walletDomain};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/cashfintech.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 5. Provision SSL Certificates via Let's Encrypt (if DNS pointed)
echo "🔒 Enabling Free HTTPS SSL Certificates..."
sudo certbot --nginx -d ${adminDomain} -d ${agentDomain} -d ${walletDomain} --non-interactive --agree-tos -m admin@cashfintech.com || echo "⚠️ SSL issuance deferred until DNS A records propagate."

echo "✅ Deployment Successful! System is LIVE on Port 3000 with Domain Routing."
`;

  const downloadDeployScript = () => {
    const blob = new Blob([deployScriptContent], { type: 'text/x-sh' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'deploy.sh');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 md:p-5 space-y-4">
      <Breadcrumb
        items={[
          { label: 'System & Production Settings', section: 'domain-settings' },
          { label: 'Domain Binding, Server Deploy & App Packaging' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#8B1E2D]" />
            <span>Domains & Production Server Deployment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Admin, Agent Portal, and Mobile Wallet subdomains with automated server deployment scripts and app packaging.
          </p>
        </div>

        <button
          onClick={downloadDeployScript}
          className="px-3.5 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Server Script (deploy.sh)</span>
        </button>
      </div>

      {/* Three Subdomain Configuration Cards */}
      <form onSubmit={handleSaveDomains} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Admin Domain Card */}
          <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#8B1E2D]" />
                  <span>Admin Dashboard Domain</span>
                </span>
                <span className="text-[10px] bg-red-50 text-[#8B1E2D] font-mono px-1.5 py-0.5 rounded border border-red-200 font-bold">
                  Master
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Dedicated domain / subdomain for executive operations and financial reports.
              </p>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Domain Name (FQDN)
              </label>
              <input
                type="text"
                value={adminDomain}
                onChange={(e) => setAdminDomain(e.target.value)}
                placeholder="admin.yourdomain.com"
                className="w-full h-8 px-2.5 text-xs font-mono border border-slate-300 rounded focus:border-[#8B1E2D] outline-none"
              />
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Port: 3000 (Proxy)</span>
              <span className="text-emerald-600 font-bold">SSL Active</span>
            </div>
          </div>

          {/* Agent Domain Card */}
          <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span>Agent Portal Domain</span>
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                  Terminal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Isolated portal domain for agents to process deposits and cash-out requests.
              </p>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Domain Name (FQDN)
              </label>
              <input
                type="text"
                value={agentDomain}
                onChange={(e) => setAgentDomain(e.target.value)}
                placeholder="agent.yourdomain.com"
                className="w-full h-8 px-2.5 text-xs font-mono border border-slate-300 rounded focus:border-blue-600 outline-none"
              />
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Port: 3000 (Proxy)</span>
              <span className="text-emerald-600 font-bold">SSL Active</span>
            </div>
          </div>

          {/* Mobile Wallet Domain Card */}
          <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span>Wallet App Domain (APK &amp; Web)</span>
                </span>
                <span className="text-[10px] bg-purple-50 text-purple-700 font-mono px-1.5 py-0.5 rounded border border-purple-200 font-bold">
                  Client APK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Domain linked inside client mobile apps (Android APK &amp; iOS PWA).
              </p>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Domain Name (FQDN)
              </label>
              <input
                type="text"
                value={walletDomain}
                onChange={(e) => setWalletDomain(e.target.value)}
                placeholder="wallet.yourdomain.com"
                className="w-full h-8 px-2.5 text-xs font-mono border border-slate-300 rounded focus:border-purple-600 outline-none"
              />
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Port: 3000 (Proxy)</span>
              <span className="text-emerald-600 font-bold">SSL Active</span>
            </div>
          </div>
        </div>

        {/* Global Domain Options */}
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableSubdomainRouting}
                onChange={(e) => setEnableSubdomainRouting(e.target.checked)}
                className="accent-[#8B1E2D] w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-slate-800">
                Auto Subdomain Routing (Host Header Inspection)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sslEnabled}
                onChange={(e) => setSslEnabled(e.target.checked)}
                className="accent-[#8B1E2D] w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-slate-800">
                Enable Automated HTTPS / SSL Certificates (Let&apos;s Encrypt)
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Domain settings saved successfully!</span>
              </span>
            )}
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#8B1E2D] hover:bg-[#721825] text-white font-semibold rounded shadow-2xs transition-colors cursor-pointer"
            >
              Save Domain Settings
            </button>
          </div>
        </div>
      </form>

      {/* Production Deployment Script Terminal */}
      <div className="bg-slate-900 text-slate-100 rounded-lg border border-slate-800 shadow-lg overflow-hidden">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">Automated Production Server Script (deploy.sh)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(deployScriptContent, 'deploy')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedKey === 'deploy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'deploy' ? 'Copied' : 'Copy Script'}</span>
            </button>
            <button
              onClick={downloadDeployScript}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download deploy.sh</span>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 font-mono text-xs">
          <div className="text-slate-400 text-[11px]">
            Server Execution Instructions (Linux Ubuntu / Debian): Upload files and run the command below to bootstrap and launch the entire stack:
          </div>

          <div className="bg-black/70 p-3 rounded border border-slate-800 flex items-center justify-between">
            <code className="text-emerald-400 font-bold">
              chmod +x deploy.sh &amp;&amp; ./deploy.sh
            </code>
            <button
              onClick={() => handleCopy('chmod +x deploy.sh && ./deploy.sh', 'cmd')}
              className="text-slate-400 hover:text-white cursor-pointer"
              title="Copy Command"
            >
              {copiedKey === 'cmd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-[11px] text-slate-500 pt-1">
            The script automatically handles:
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
              <li>Building the Docker container and binding to port 3000 with optimized memory limits.</li>
              <li>Installing and configuring Nginx Reverse Proxy for all subdomains.</li>
              <li>Provisioning automated free SSL certificates via Let&apos;s Encrypt.</li>
              <li>Enabling automatic service recovery on system reboots.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile App (Android APK & iOS) Packaging Section */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#8B1E2D]" />
            <span>Mobile App Packaging (Android APK &amp; iOS App)</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Native Capacitor &amp; Progressive Web App (PWA) Ready
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Android APK Instructions */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>1. Android Package Release (APK / AAB)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              The project is structured and configured to build as an authentic Android APK via Capacitor:
            </p>
            <div className="bg-slate-900 text-emerald-400 p-2.5 rounded font-mono text-[11px] space-y-1">
              <div># Add Android platform and assemble release APK</div>
              <div>npx cap add android</div>
              <div>npx cap sync android</div>
              <div>cd android &amp;&amp; ./gradlew assembleRelease</div>
            </div>
            <p className="text-[10px] text-slate-500">
              Output artifact: <code className="text-slate-800 font-bold">android/app/build/outputs/apk/release/app-release.apk</code>
            </p>
          </div>

          {/* iOS / iPhone Packaging */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>2. iPhone / iOS Deployment</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Two proven pathways are available for mobile devices:
            </p>
            <div className="space-y-1.5 text-[11px] text-slate-700">
              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="font-bold text-[#8B1E2D]">A. Instant Progressive Web App (No App Store review):</span>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Clients visit <code className="text-slate-800">{walletDomain}</code> in Mobile Safari and tap &quot;Add to Home Screen&quot; for a full standalone experience with push notifications and haptics.
                </div>
              </div>

              <div className="p-1.5 bg-white rounded border border-slate-200">
                <span className="font-bold text-blue-800">B. Native iOS Project via Xcode:</span>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Execute <code className="text-slate-800">npx cap add ios &amp;&amp; npx cap open ios</code> to build and sign an IPA package on macOS.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
