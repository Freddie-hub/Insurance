import json
import os
from pathlib import Path

# Define input and output directories
INPUT_DIR = r"C:\Users\HP\Documents\insurance\src\data\processed"
OUTPUT_FILE = r"C:\Users\HP\Documents\insurance\src\data\processed\all_product_chunks.json"

def combine_product_chunks():
    """Combine all product chunks from processed company JSON files into a single JSON file and count them."""
    try:
        all_product_chunks = []
        total_product_chunks = 0

        # Ensure input directory exists
        if not os.path.exists(INPUT_DIR):
            print(f"Input directory {INPUT_DIR} does not exist.")
            return

        # Iterate through all JSON files in the input directory
        for filename in os.listdir(INPUT_DIR):
            if filename.endswith("_chunks.json"):
                file_path = os.path.join(INPUT_DIR, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        chunks = json.load(f)
                    
                    # Filter for product chunks (those containing 'company_name' in metadata)
                    product_chunks = [
                        chunk for chunk in chunks 
                        if 'metadata' in chunk and 'company_name' in chunk['metadata']
                    ]
                    all_product_chunks.extend(product_chunks)
                    total_product_chunks += len(product_chunks)
                    
                    print(f"Processed {file_path}: Added {len(product_chunks)} product chunks")

                except Exception as e:
                    print(f"Error reading {file_path}: {str(e)}")

        # Save all product chunks to a single JSON file
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_product_chunks, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully combined {total_product_chunks} product chunks into {OUTPUT_FILE}")

    except Exception as e:
        print(f"Error combining product chunks: {str(e)}")

if __name__ == "__main__":
    combine_product_chunks()