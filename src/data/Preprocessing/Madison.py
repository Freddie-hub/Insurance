import json
import os
import uuid
from pathlib import Path
from typing import Dict, List, Any
import logging

# Set up logging
logging.basicConfig(
    filename='preprocessing.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_json_file(file_path: str) -> Dict[str, Any]:
    """Load and validate JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logger.info(f"Successfully loaded {file_path}")
        return data
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error in {file_path}: {e}")
        raise
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        raise

def validate_json_structure(data: Dict[str, Any]) -> None:
    """Validate the JSON structure."""
    required_keys = [
        'company_id', 'company_name', 'company_type', 'license_info',
        'headquarters', 'branches', 'digital_presence', 'reputation',
        'products', 'last_compiled'
    ]
    for key in required_keys:
        if key not in data:
            logger.error(f"Missing required key: {key}")
            raise KeyError(f"Missing required key: {key}")
    
    # Validate nested structures
    if not isinstance(data['branches'], list):
        logger.error("Branches must be a list")
        raise ValueError("Branches must be a list")
    if not isinstance(data['products'], list):
        logger.error("Products must be a list")
        raise ValueError("Products must be a list")
    
    # Validate product fields for Madison
    product_keys = [
        'product_id', 'product_name', 'category', 'target_market',
        'eligibility', 'geographic_coverage', 'premium', 'coverage',
        'last_updated', 'sources'
    ]
    for product in data['products']:
        for key in product_keys:
            if key not in product:
                logger.warning(f"Product {product.get('product_id', 'unknown')} missing key: {key}")

def flatten_dict(d: Dict[str, Any], parent_key: str = '', sep: str = '_') -> Dict[str, Any]:
    """Flatten a nested dictionary."""
    items = []
    for key, value in d.items():
        new_key = f"{parent_key}{sep}{key}" if parent_key else key
        if isinstance(value, dict):
            items.extend(flatten_dict(value, new_key, sep).items())
        elif isinstance(value, list) and key not in ['branches', 'products', 'rate_table', 'sample_examples', 'benefits', 'exclusions', 'add_ons', 'required_documents', 'hospitals', 'assistance_partners', 'partners', 'sources', 'customer_reviews']:
            items.append((new_key, ', '.join(str(v) for v in value if isinstance(v, str))))
        else:
            items.append((new_key, value))
    return dict(items)

def normalize_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize and flatten company data."""
    normalized = {'company_metadata': {}, 'branches': [], 'products': []}
    
    # Flatten company metadata
    company_data = {k: v for k, v in data.items() if k not in ['branches', 'products']}
    normalized['company_metadata'] = flatten_dict(company_data)
    
    # Normalize branches
    for i, branch in enumerate(data['branches'], 1):
        branch_data = flatten_dict(branch)
        branch_data['company_id'] = data['company_id']
        branch_data['branch_id'] = f"{data['company_id']}_branch_{i:03d}"
        normalized['branches'].append(branch_data)
    
    # Normalize products
    for product in data['products']:
        product_data = flatten_dict(product)
        product_data['company_id'] = data['company_id']
        normalized['products'].append(product_data)
    
    logger.info(f"Normalized data: {len(normalized['branches'])} branches, {len(normalized['products'])} products")
    return normalized

def create_text_from_chunk(chunk_data: Dict[str, Any], chunk_type: str) -> str:
    """Convert chunk data into natural language text."""
    try:
        if chunk_type == 'company_metadata':
            text = (
                f"{chunk_data['company_name']} is a {chunk_data['company_type']} company "
                f"licensed by {chunk_data['license_info_regulator']} under reference "
                f"{chunk_data['license_info_license_reference']}. "
                f"Headquarters: {chunk_data['headquarters']}. "
                f"Website: {chunk_data['digital_presence_website']}. "
                f"Customer rating: {chunk_data['reputation_customer_rating']}, "
                f"Claims settlement ratio: {chunk_data['reputation_claims_settlement_ratio']}."
            )
        elif chunk_type == 'branch':
            text = (
                f"Branch {chunk_data['branch_name']} (ID: {chunk_data['branch_id']}) of "
                f"{chunk_data['company_id']} is located at {chunk_data['address']}. "
                f"Contact phones: {chunk_data.get('phone', 'N/A')}. "
                f"Email: {chunk_data.get('email', 'N/A')}."
            )
        elif chunk_type == 'product_metadata':
            text = (
                f"{chunk_data['product_name']} (ID: {chunk_data['product_id']}) is a "
                f"{chunk_data['category']} product by {chunk_data['company_id']} "
                f"for {chunk_data['target_market']}. "
                f"Geographic coverage: {chunk_data['geographic_coverage']}."
            )
        elif chunk_type == 'premium':
            text = (
                f"Premium for {chunk_data['product_name']} "
                f"(ID: {chunk_data['product_id']}): "
                f"Currency: {chunk_data.get('premium_currency', 'N/A')}, "
                f"Payment frequency: {chunk_data.get('premium_payment_frequency', 'N/A')}. "
                f"Sample examples: {chunk_data.get('premium_sample_examples', 'N/A')}. "
                f"Notes: {chunk_data.get('premium_rate_table_notes', 'N/A')}."
            )
        elif chunk_type == 'coverage':
            text = (
                f"Coverage for {chunk_data['product_name']} "
                f"(ID: {chunk_data['product_id']}): "
                f"Benefits: {chunk_data.get('coverage_benefits', 'N/A')}. "
                f"Duration: {chunk_data.get('coverage_duration', 'N/A')}."
            )
        elif chunk_type == 'exclusions':
            text = (
                f"Exclusions for {chunk_data['product_name']} "
                f"(ID: {chunk_data['product_id']}): "
                f"{chunk_data.get('exclusions', 'N/A')}."
            )
        elif chunk_type == 'add_ons':
            text = (
                f"Add-ons for {chunk_data['product_name']} "
                f"(ID: {chunk_data['product_id']}): "
                f"{chunk_data.get('add_ons', 'N/A')}."
            )
        elif chunk_type == 'claims_process':
            text = (
                f"Claims process for {chunk_data['product_name']} "
                f"(ID: {chunk_data['product_id']}): "
                f"Required documents: {chunk_data.get('claims_process_required_documents', 'N/A')}. "
                f"Average turnaround: {chunk_data.get('claims_process_average_turnaround_days', 'N/A')} days. "
                f"Digital claims supported: {chunk_data.get('claims_process_digital_claims_supported', 'N/A')}. "
                f"Notes: {chunk_data.get('claims_process_notes', 'N/A')}."
            )
        elif chunk_type == 'provider_network':
            text = (
                f"Provider network for {chunk_data['product_name']} "
                f"(ID: {chunk_data['product_id']}): "
                f"Partners: {chunk_data.get('provider_network_hospitals', chunk_data.get('provider_network_partners', chunk_data.get('provider_network_assistance_partners', 'N/A')))}. "
                f"Note: {chunk_data.get('provider_network_note', 'N/A')}."
            )
        elif chunk_type == 'renewal_terms':
            text = (
                f"Renewal terms for {chunk_data['product_name']} "
                f"(ID: {chunk_data['product_id']}): "
                f"Auto-renewal: {chunk_data.get('renewal_terms_auto_renewal', 'N/A')}. "
                f"Grace period: {chunk_data.get('renewal_terms_grace_period_days', 'N/A')} days."
            )
        else:
            text = str(chunk_data)
        return text.strip()
    except KeyError as e:
        logger.error(f"KeyError in create_text_from_chunk for {chunk_type}: {e}")
        return f"Error generating text for {chunk_type}: Missing key {e}"

def chunk_data(normalized_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Chunk normalized data into embeddable units."""
    chunks = []
    
    # Company metadata chunk
    chunk_id = str(uuid.uuid4())
    chunks.append({
        'chunk_id': chunk_id,
        'company_id': normalized_data['company_metadata']['company_id'],
        'product_id': None,
        'chunk_type': 'company_metadata',
        'raw_data': normalized_data['company_metadata'],
        'text': create_text_from_chunk(normalized_data['company_metadata'], 'company_metadata')
    })
    
    # Branch chunks
    for branch in normalized_data['branches']:
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': branch['company_id'],
            'product_id': None,
            'chunk_type': 'branch',
            'raw_data': branch,
            'text': create_text_from_chunk(branch, 'branch')
        })
    
    # Product chunks
    for product in normalized_data['products']:
        product_id = product['product_id']
        product_name = product['product_name']
        
        # Product metadata chunk
        metadata_fields = [
            'product_id', 'product_name', 'category', 'target_market',
            'eligibility_age_min', 'eligibility_age_max', 'eligibility_notes',
            'eligibility_vehicle_type', 'eligibility_property_type', 'eligibility_group_min_size',
            'eligibility_min_investment', 'eligibility_distance_min', 'geographic_coverage',
            'last_updated', 'distribution_channels', 'customer_reviews'
        ]
        metadata = {k: product.get(k, 'N/A') for k in metadata_fields if product.get(k) is not None}
        metadata['company_id'] = product['company_id']
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': product['company_id'],
            'product_id': product_id,
            'chunk_type': 'product_metadata',
            'raw_data': metadata,
            'text': create_text_from_chunk(metadata, 'product_metadata')
        })
        
        # Premium chunk
        if 'premium' in product:
            premium = product['premium']
            premium['company_id'] = product['company_id']
            premium['product_id'] = product_id
            premium['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'chunk_type': 'premium',
                'raw_data': premium,
                'text': create_text_from_chunk(premium, 'premium')
            })
        
        # Coverage chunk
        if 'coverage' in product:
            coverage = product['coverage']
            coverage['company_id'] = product['company_id']
            coverage['product_id'] = product_id
            coverage['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'chunk_type': 'coverage',
                'raw_data': coverage,
                'text': create_text_from_chunk(coverage, 'coverage')
            })
        
        # Exclusions chunk
        if 'exclusions' in product and product['exclusions'] is not None:
            exclusions = {'exclusions': product['exclusions']}
            exclusions['company_id'] = product['company_id']
            exclusions['product_id'] = product_id
            exclusions['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'chunk_type': 'exclusions',
                'raw_data': exclusions,
                'text': create_text_from_chunk(exclusions, 'exclusions')
            })
        
        # Add-ons chunk
        if 'add_ons' in product and product['add_ons'] is not None:
            add_ons = {'add_ons': product['add_ons']}
            add_ons['company_id'] = product['company_id']
            add_ons['product_id'] = product_id
            add_ons['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'chunk_type': 'add_ons',
                'raw_data': add_ons,
                'text': create_text_from_chunk(add_ons, 'add_ons')
            })
        
        # Claims process chunk
        if 'claims_process' in product and product['claims_process'] is not None:
            claims_process = product['claims_process']
            claims_process['company_id'] = product['company_id']
            claims_process['product_id'] = product_id
            claims_process['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'chunk_type': 'claims_process',
                'raw_data': claims_process,
                'text': create_text_from_chunk(claims_process, 'claims_process')
            })
        
        # Provider network chunk
        if 'provider_network' in product and product['provider_network'] is not None:
            provider_network = product['provider_network']
            provider_network['company_id'] = product['company_id']
            provider_network['product_id'] = product_id
            provider_network['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'chunk_type': 'provider_network',
                'raw_data': provider_network,
                'text': create_text_from_chunk(provider_network, 'provider_network')
            })
        
        # Renewal terms chunk
        if 'renewal_terms' in product and product['renewal_terms'] is not None:
            renewal_terms = product['renewal_terms']
            renewal_terms['company_id'] = product['company_id']
            renewal_terms['product_id'] = product_id
            renewal_terms['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'chunk_type': 'renewal_terms',
                'raw_data': renewal_terms,
                'text': create_text_from_chunk(renewal_terms, 'renewal_terms')
            })
    
    logger.info(f"Created {len(chunks)} chunks")
    return chunks

def validate_chunks(chunks: List[Dict[str, Any]], original_data: Dict[str, Any]) -> None:
    """Validate that all data is captured in chunks."""
    expected_branch_count = len(original_data['branches'])
    expected_product_count = len(original_data['products'])
    
    branch_chunks = len([c for c in chunks if c['chunk_type'] == 'branch'])
    product_chunks = len([c for c in chunks if c['chunk_type'] == 'product_metadata'])
    
    if branch_chunks != expected_branch_count:
        logger.warning(f"Branch count mismatch: expected {expected_branch_count}, got {branch_chunks}")
    if product_chunks != expected_product_count:
        logger.warning(f"Product count mismatch: expected {expected_product_count}, got {product_chunks}")

def save_chunks(chunks: List[Dict[str, Any]], output_path: str) -> None:
    """Save chunks to a JSON file."""
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(chunks, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved chunks to {output_path}")
    except Exception as e:
        logger.error(f"Error saving chunks to {output_path}: {e}")
        raise

def main():
    """Main preprocessing function for Madison.json."""
    input_path = Path('src/data/raw/Madison.json')
    output_path = Path('src/data/preprocessed/madison_preprocessed.json')
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Step 1: Load and validate JSON
    data = load_json_file(input_path)
    validate_json_structure(data)
    
    # Step 2: Normalize data
    normalized_data = normalize_data(data)
    
    # Step 3: Chunk data
    chunks = chunk_data(normalized_data)
    
    # Step 4: Validate chunks
    validate_chunks(chunks, data)
    
    # Step 5: Save preprocessed chunks
    save_chunks(chunks, output_path)

if __name__ == '__main__':
    main()