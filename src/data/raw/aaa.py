import json
import os
import uuid
from pathlib import Path

# Define input and output directories
INPUT_FILES = [
    r"C:\Users\HP\Documents\insurance\src\data\raw\CIC.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\Fidelity.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\First-Assurance.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\GA.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\Heritage.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\ICEA-Lion.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\Jubilee.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\Liberty.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\Madison.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\Mayfair.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\Old-Mutual-Kenya.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\Sanlam.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\AAR.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\APA.json",
    r"C:\Users\HP\Documents\insurance\src\data\raw\Britam.json"
]
OUTPUT_DIR = r"C:\Users\HP\Documents\insurance\src\data\processed"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_chunk_id(prefix):
    """Generate a unique chunk ID using UUID."""
    return f"{prefix}_{uuid.uuid4()}"

def process_company_data(file_path):
    """Process a single company JSON file and create chunks."""
    try:
        # Read JSON file
        with open(file_path, 'r', encoding='utf-8') as f:
            company_data = json.load(f)
        
        company_name = company_data.get('company_name', 'Unknown')
        company_id = company_data.get('company_id', 'unknown')
        chunks = []

        # Create company chunk
        company_metadata = {k: v for k, v in company_data.items() if k not in ['branches', 'products']}
        company_chunk = {
            'chunk_id': generate_chunk_id(f"{company_id}_company"),
            'metadata': company_metadata,
            'text': json.dumps(company_metadata, ensure_ascii=False)
        }
        chunks.append(company_chunk)

        # Create branches chunk
        branches_metadata = {'branches': company_data.get('branches', [])}
        branches_chunk = {
            'chunk_id': generate_chunk_id(f"{company_id}_branches"),
            'metadata': branches_metadata,
            'text': json.dumps(branches_metadata, ensure_ascii=False)
        }
        chunks.append(branches_chunk)

        # Create product chunks
        for product in company_data.get('products', []):
            product_metadata = {'company_name': company_name, **product}
            product_chunk = {
                'chunk_id': generate_chunk_id(f"{company_id}_{product.get('product_id', 'unknown')}"),
                'metadata': product_metadata,
                'text': json.dumps(product_metadata, ensure_ascii=False)
            }
            chunks.append(product_chunk)

        # Save chunks to a new JSON file
        output_file = os.path.join(OUTPUT_DIR, f"{company_id}_chunks.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(chunks, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully processed {file_path} into {output_file}")
        return chunks

    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return []

def main():
    """Process all company JSON files."""
    for file_path in INPUT_FILES:
        if os.path.exists(file_path):
            process_company_data(file_path)
        else:
            print(f"File not found: {file_path}")

if __name__ == "__main__":
    main()