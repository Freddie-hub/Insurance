import os
import json

# Folder containing your JSON files
DATA_DIR = r"C:\Users\HP\Documents\insurance\src\data\preprocessed"

# Output file
OUTPUT_FILE = os.path.join(DATA_DIR, "all_companies_preprocessed.json")

# Collect all preprocessed JSON files
files = [f for f in os.listdir(DATA_DIR) if f.endswith("_preprocessed.json")]

combined_data = []

for file in files:
    file_path = os.path.join(DATA_DIR, file)
    with open(file_path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
            if isinstance(data, list):
                combined_data.extend(data)
            else:
                print(f"⚠️ Skipping {file} (not a list)")
        except json.JSONDecodeError:
            print(f"Failed to parse {file}")

# Write merged data
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(combined_data, f, indent=2, ensure_ascii=False)

print(f"Combined {len(files)} files into {OUTPUT_FILE}")
print(f"Total chunks: {len(combined_data)}")

