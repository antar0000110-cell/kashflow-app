import urllib.request, json

data = json.dumps({"username": "admin", "password": "admin123"}).encode()
req = urllib.request.Request("http://localhost:3000/api/auth/login", data=data, headers={"Content-Type": "application/json"})
try:
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read().decode())
    print("LOGIN OK:")
    print(json.dumps(result, indent=2))
    token = result.get("token")
    if token:
        req2 = urllib.request.Request("http://localhost:3000/api/auth/me", headers={"Authorization": "Bearer " + token})
        resp2 = urllib.request.urlopen(req2)
        print("SESSION:", json.dumps(json.loads(resp2.read().decode()), indent=2))
        req3 = urllib.request.Request("http://localhost:3000/api/sync", headers={"Authorization": "Bearer " + token})
        resp3 = urllib.request.urlopen(req3)
        sync_data = json.loads(resp3.read().decode())
        print("SYNC KEYS:", list(sync_data.keys()))
        for k,v in sync_data.items():
            if isinstance(v, list):
                print(f"  {k}: {len(v)} items")
            else:
                print(f"  {k}: {v}")
except urllib.error.HTTPError as e:
    print(f"ERROR {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"EXCEPTION: {e}")
