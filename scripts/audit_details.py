import json

with open("packet.json") as f:
    pkg = json.load(f)

print("=== QUESTIONNAIRE ===")
for q in pkg["client"].get("questionnaire", []):
    print(f"[{q['id']}] {q['question']} -> {q['answer']}")

print("\n=== IRS TRANSCRIPT SNAPSHOT 1 (2026-03-12) ===")
t1 = pkg["tax_agency_records"]["irs_account_transcript_2025"][0]
for tx in t1["transactions"]:
    print(f"  {tx['date']} | code {tx['code']} | {tx['description']} | {tx['amount']}")

print("\n=== IRS TRANSCRIPT SNAPSHOT 2 (2026-08-03) ===")
t2 = pkg["tax_agency_records"]["irs_account_transcript_2025"][1]
for tx in t2["transactions"]:
    print(f"  {tx['date']} | code {tx['code']} | {tx['description']} | {tx['amount']}")

print("\n=== CAPITAL GAIN LOTS (8949) IN V3 ===")
v3 = pkg["return_versions"][2]
lots = [l for l in v3["lines"] if l["form"] == "F8949"]
print(f"Total F8949 lines in v3: {len(lots)}")
# check crypto C6
for l in lots:
    if "C6" in l["key"] or "BTC" in l.get("label", ""):
        print(f"  {l['key']}: {l['label']} | proceeds={l.get('inputs')} | note={l.get('note')}")

print("\n=== MERIDIAN LOTS (M18 fractional share) ===")
for l in lots:
    if "M18" in l["key"] or "Ironwood" in l.get("label", ""):
        print(f"  {l['key']}: {l['label']} | val={l.get('value')}")

