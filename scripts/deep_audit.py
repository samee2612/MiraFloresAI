import json

with open("packet.json") as f:
    pkg = json.load(f)

print("=== CHECKING RETURN LINES IN V3 ===")
v3 = pkg["return_versions"][2]
lines_by_form = {}
for line in v3["lines"]:
    f = line["form"]
    lines_by_form.setdefault(f, []).append(line)

print("Forms in v3:", list(lines_by_form.keys()))

# Check Schedule C
sch_c_lines = {l["key"]: l for l in lines_by_form.get("SchC", [])}
print("\n--- Schedule C Lines ---")
for k in sorted(sch_c_lines.keys()):
    l = sch_c_lines[k]
    print(f"  {k} ({l['label']}): {l['value']} | Rule: {l.get('rule')} | Note: {l.get('note')}")

# Check SchCA540NR (California split)
print("\n--- California Wages ---")
for l in lines_by_form.get("SchCA540NR", []):
    if "wage" in l["label"].lower() or "1a" in l["key"].lower():
        print(f"  {l['key']} ({l['label']}): {l['value']} | Inputs: {l.get('inputs')} | Note: {l.get('note')}")

# Check Capital Gains / Form 7203 (S corp)
print("\n--- Form 7203 (S-Corp Basis) ---")
for l in lines_by_form.get("F7203", []):
    print(f"  {l['key']} ({l['label']}): {l['value']} | Inputs: {l.get('inputs')} | Note: {l.get('note')}")

# Check Form 8582 (Passive Losses)
print("\n--- Form 8582 Lines ---")
for l in lines_by_form.get("F8582", []):
    print(f"  {l['key']} ({l['label']}): {l['value']}")

# Check Charitable deductions
print("\n--- Charitable Deductions (SchA) ---")
for l in lines_by_form.get("SchA", []):
    if "gift" in l["label"].lower() or "charit" in l["label"].lower() or "11" in l["key"] or "12" in l["key"]:
        print(f"  {l['key']} ({l['label']}): {l['value']} | Note: {l.get('note')}")

# Check Payments
print("\n--- Payments on 1040 ---")
for l in lines_by_form.get("F1040", []):
    if "payment" in l["label"].lower() or "withheld" in l["label"].lower() or "25" in l["key"] or "26" in l["key"] or "32" in l["key"] or "33" in l["key"]:
        print(f"  {l['key']} ({l['label']}): {l['value']} | Note: {l.get('note')}")

