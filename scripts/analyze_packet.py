import json

with open("packet.json") as f:
    pkg = json.load(f)

print("=== DIAGNOSTICS IN V1, V2, V3 ===")
for rv in pkg["return_versions"]:
    print(f"--- Version {rv['version']} ---")
    for d in rv.get("diagnostics", []):
        print(f"  [{d['severity']}] {d['code']}: {d['message']}")

print("\n=== ENGINE RULES ===")
for r_id, desc in pkg["engine_reference"]["rules"].items():
    print(f"{r_id}: {desc}")

print("\n=== TIMELINE (All events) ===")
for tl in pkg["timeline"]:
    print(f"{tl['id']} | {tl['at']} | {tl['event']} | actor={tl['actor']} | {tl['detail']}")

