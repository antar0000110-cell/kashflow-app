const http = require("http");
const data = JSON.stringify({username:"admin",password:"admin123"});
const req = http.request({hostname:"localhost",port:3000,method:"POST",path:"/api/auth/login",headers:{"Content-Type":"application/json","Content-Length":data.length}}, res => {
  let body = "";
  res.on("data", c => body += c);
  res.on("end", () => {
    console.log("LOGIN:", body);
    try {
      const parsed = JSON.parse(body);
      if (parsed.token) {
        const req2 = http.request({hostname:"localhost",port:3000,method:"GET",path:"/api/auth/me",headers:{"Authorization":"Bearer "+parsed.token}}, res2 => {
          let b2 = "";
          res2.on("data", c => b2 += c);
          res2.on("end", () => {
            console.log("ME:", b2);
            const req3 = http.request({hostname:"localhost",port:3000,method:"GET",path:"/api/sync",headers:{"Authorization":"Bearer "+parsed.token}}, res3 => {
              let b3 = "";
              res3.on("data", c => b3 += c);
              res3.on("end", () => {
                const sync = JSON.parse(b3);
                console.log("SYNC:", JSON.stringify(Object.keys(sync)));
                for (const [k,v] of Object.entries(sync)) {
                  console.log("  " + k + ":", Array.isArray(v) ? v.length + " items" : v);
                }
              });
            });
            req3.end();
          });
        });
        req2.end();
      }
    } catch(e) { console.log("ERR:", e.message); }
  });
});
req.write(data);
req.end();
