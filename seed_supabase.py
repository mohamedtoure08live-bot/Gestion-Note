import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://omdcwdwdcgjsxldycima.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tZGN3ZHdkY2dqc3hsZHljaW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzkxMDEsImV4cCI6MjA5NDM1NTEwMX0.InNTIU-8pIV5fRooxN2Ve0M8XZhm56vRGgc4624RXSQ"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

def post_batch(table, records):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(records).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Table {table}: Success ({response.status})")
            return True
    except urllib.error.HTTPError as e:
        print(f"Table {table}: HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return False
    except Exception as e:
        print(f"Table {table}: Error {e}")
        return False

# 1. Load baremes
with open("data/default_baremes.json", "r", encoding="utf-8") as f:
    baremes = json.load(f)

print(f"Total baremes to upload: {len(baremes)}")

# 2. Extract disciplines
disciplines_map = {}
for b in baremes:
    d_name = b.get("discipline")
    if not d_name:
        continue
    d_id = d_name.lower().replace(" ", "_").replace("/", "_")
    if d_id not in disciplines_map:
        disciplines_map[d_id] = {
            "id": d_id,
            "nom": d_name,
            "engins": set()
        }
    if b.get("engin"):
        disciplines_map[d_id]["engins"].add(b["engin"])

disc_records = []
for d in disciplines_map.values():
    disc_records.append({
        "id": d["id"],
        "nom": d["nom"],
        "engins": list(d["engins"])
    })

post_batch("disciplines", disc_records)

# 3. Post baremes in chunks of 25
chunk_size = 25
for i in range(0, len(baremes), chunk_size):
    chunk = baremes[i:i + chunk_size]
    records = []
    for b in chunk:
        records.append({
            "id": b["id"],
            "discipline": b["discipline"],
            "engin": b.get("engin"),
            "classe": b["classe"],
            "genre": b["genre"],
            "type": b.get("type", "distance"),
            "grille": b.get("grille", [])
        })
    print(f"Posting baremes {i+1} to {min(i+chunk_size, len(baremes))}...")
    post_batch("baremes", records)

print("Finished seeding Supabase!")
