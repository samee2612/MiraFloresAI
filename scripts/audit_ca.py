import json

with open("packet.json") as f:
    pkg = json.load(f)

v3 = pkg["return_versions"][2]
for l in v3["lines"]:
    if l["form"] in ["F540NR", "ScheduleS", "FTB5805"]:
        print(f"{l['key']} ({l['label']}): {l['value']} | note: {l.get('note')}")

print("\n--- CA Estimated Payments ---")
for l in v3["lines"]:
    if "72" in l["key"] or "estimate" in l["label"].lower():
        print(f"{l['key']} ({l['label']}): {l['value']} | note: {l.get('note')}")

