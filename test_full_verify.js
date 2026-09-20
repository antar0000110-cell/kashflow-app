const http = require("http");
const https = require("https");

function request(options, data) {
  return new Promise((resolve, reject) => {
    const mod = options.port === 443 ? https : http;
    const req = mod.request(options, res => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  const base = { hostname: "localhost", port: 3000 };
  
  // 1. Health check
  const health = await request({ ...base, method: "GET", path: "/health" });
  console.log("1. HEALTH:", health.data.status, "| uptime:", Math.round(health.data.uptime) + "s");
  
  // 2. Login
  const loginData = JSON.stringify({ username: "admin", password: "admin123" });
  const login = await request({ ...base, method: "POST", path: "/api/auth/login", headers: { "Content-Type": "application/json", "Content-Length": loginData.length } }, loginData);
  console.log("2. LOGIN:", login.status, "| success:", login.data.success, "| user:", login.data.user?.username, "| role:", login.data.user?.role);
  const token = login.data.token;
  if (!token) { console.log("FATAL: No token"); return; }
  
  // 3. Session check
  const me = await request({ ...base, method: "GET", path: "/api/auth/me", headers: { "Authorization": "Bearer " + token } });
  console.log("3. SESSION:", me.status, "| authenticated:", me.data.authenticated, "| user:", me.data.user?.username);
  
  // 4. Token refresh
  const refresh = await request({ ...base, method: "POST", path: "/api/auth/refresh", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token } });
  console.log("4. REFRESH:", refresh.status, "| success:", refresh.data.success, "| new_token:", refresh.data.token ? "YES (length:" + refresh.data.token.length + ")" : "NO");
  
  // 5. Use new token
  if (refresh.data.token) {
    const me2 = await request({ ...base, method: "GET", path: "/api/auth/me", headers: { "Authorization": "Bearer " + refresh.data.token } });
    console.log("5. NEW_TOKEN_ME:", me2.status, "| authenticated:", me2.data.authenticated, "| user:", me2.data.user?.username);
  }
  
  // 6. Sync data
  const sync = await request({ ...base, method: "GET", path: "/api/sync", headers: { "Authorization": "Bearer " + (refresh.data.token || token) } });
  console.log("6. SYNC:", sync.status, "| agents:", sync.data.data?.agents?.length, "| wallets:", sync.data.data?.wallets?.length, "| txns:", sync.data.data?.transactions?.length);
  
  // 7. Reject expired/invalid token
  const bad = await request({ ...base, method: "POST", path: "/api/auth/refresh", headers: { "Content-Type": "application/json", "Authorization": "Bearer fake_invalid_token" } });
  console.log("7. BAD_TOKEN:", bad.status, "| expected 401:", bad.status === 401 ? "PASS" : "FAIL");
  
  // 8. HTTPS health
  const httpsHealth = await request({ hostname: "uzx.agency", port: 443, method: "GET", path: "/health", headers: { "Host": "uzx.agency" } });
  console.log("8. HTTPS_HEALTH:", httpsHealth.status, "| status:", httpsHealth.data?.status);
  
  console.log("\n=== ALL CHECKS COMPLETE ===");
}

run().catch(e => console.error("ERROR:", e));
