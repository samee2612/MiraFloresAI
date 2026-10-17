import json

with open("packet.json") as f:
    pkg = json.load(f)

v3 = pkg["return_versions"][2]
lines = {l["key"]: l for l in v3["lines"]}

print("Sch1.17 (SE Health Insurance):", lines.get("Sch1.17"))
print("SchA.1 (Medical expenses):", lines.get("SchA.1"))
print("F8949.H.C6 (Crypto transfer in basis 0):", lines.get("F8949.H.C6"))
print("Did M18 get included in v3?", "F8949.D.M18" in lines or "F8949.A.M18" in lines or "F8949.B.M18" in lines or any("M18" in k for k in lines.keys()))

# Check IRA basis / 8606
for k, l in lines.items():
    if k.startswith("F8606"):
        print(f"  {k} ({l['label']}): {l['value']} | note={l.get('note')}")

