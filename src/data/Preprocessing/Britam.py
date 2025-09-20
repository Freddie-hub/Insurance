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
    
    # Validate product fields
    product_keys = [
        'product_id', 'product_name', 'category', 'target_market',
        'eligibility', 'geographic_coverage', 'premium', 'coverage',
        'exclusions', 'claims_process', 'renewal_terms', 'distribution_channels'
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
        elif isinstance(value, list) and key not in ['branches', 'products']:
            # Concatenate lists into strings for non-entity lists
            items.append((new_key, ', '.join(str(v) for v in value)))
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
                f"{chunk_data['company_name']} is a {chunk_data['company_type']} insurance company "
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
                f"Contact phones: {chunk_data['phone']}."
            )
        elif chunk_type == 'product_metadata':
            text = (
                f"{chunk_data['product_name']} (ID: {chunk_data['product_id']}) is a "
                f"{chunk_data['category']} insurance product by {chunk_data['company_id']} "
                f"for {chunk_data['target_market']}. "
                f"Eligibility: min age {chunk_data['eligibility_age_min']}, "
                f"max age {chunk_data['eligibility_age_max']}. "
                f"Geographic coverage: {chunk_data['geographic_coverage']}."
            )
        elif chunk_type == 'premium':
            text = (
                f"Premium for {chunk_data['product_name']} (ID: {chunk_data.get('product_id', 'N/A')}): "
                f"Currency: {chunk_data['premium_currency']}, "
                f"Payment frequency: {chunk_data['premium_payment_frequency']}. "
                f"Sample rates: {chunk_data['premium_sample_examples']}. "
                f"Notes: {chunk_data['premium_rate_table_notes']}."
            )
        elif chunk_type == 'coverage':
            text = (
                f"Coverage for {chunk_data['product_name']} (ID: {chunk_data.get('product_id', 'N/A')}): "
                f"Benefits: {chunk_data['coverage_benefits']}. "
                f"Duration: {chunk_data['coverage_duration']}."
            )
        elif chunk_type == 'exclusions':
            text = (
                f"Exclusions for {chunk_data['product_name']} (ID: {chunk_data.get('product_id', 'N/A')}): "
                f"{chunk_data['exclusions']}."
            )
        elif chunk_type == 'add_ons':
            text = (
                f"Add-ons for {chunk_data['product_name']} (ID: {chunk_data.get('product_id', 'N/A')}): "
                f"{chunk_data['add_ons']}."
            )
        elif chunk_type == 'claims_process':
            text = (
                f"Claims process for {chunk_data['product_name']} (ID: {chunk_data.get('product_id', 'N/A')}): "
                f"Required documents: {chunk_data['claims_process_required_documents']}. "
                f"Average turnaround: {chunk_data['claims_process_average_turnaround_days']} days. "
                f"Digital claims supported: {chunk_data['claims_process_digital_claims_supported']}."
            )
        elif chunk_type == 'renewal_terms':
            text = (
                f"Renewal terms for {chunk_data['product_name']} (ID: {chunk_data.get('product_id', 'N/A')}): "
                f"Auto-renewal: {chunk_data['renewal_terms_auto_renewal']}, "
                f"Grace period: {chunk_data['renewal_terms_grace_period_days']} days."
            )
        elif chunk_type == 'provider_network':
            text = (
                f"Provider network for {chunk_data['product_name']} (ID: {chunk_data.get('product_id', 'N/A')}): "
                f"Hospitals: {chunk_data.get('provider_network_hospitals', 'N/A')}. "
                f"Notes: {chunk_data.get('provider_network_note', 'N/A')}."
            )
        elif chunk_type == 'customer_reviews':
            text = (
                f"Customer reviews for {chunk_data['product_name']} (ID: {chunk_data.get('product_id', 'N/A')}): "
                f"{chunk_data['customer_reviews']}."
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
            'geographic_coverage', 'last_updated', 'distribution_channels',
            'sources'
        ]
        metadata = {k: product.get(k, 'N/A') for k in metadata_fields}
        metadata['company_id'] = product['company_id']
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': product['company_id'],
            'product_id': product_id,
            'chunk_type': 'product_metadata',
            'raw_data': metadata,
            'text': create_text_from_chunk({**metadata, 'product_name': product_name}, 'product_metadata')
        })
        
        # Premium chunk
        premium_fields = [
            'premium_currency', 'premium_payment_frequency', 'premium_rate_table',
            'premium_rate_table_notes', 'premium_sample_examples'
        ]
        premium = {k: product.get(k, 'N/A') for k in premium_fields}
        premium['company_id'] = product['company_id']
        premium['product_id'] = product_id  # Added to fix KeyError
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': product['company_id'],
            'product_id': product_id,
            'chunk_type': 'premium',
            'raw_data': premium,
            'text': create_text_from_chunk({**premium, 'product_name': product_name}, 'premium')
        })
        
        # Coverage chunk
        coverage_fields = ['coverage_benefits', 'coverage_duration']
        if 'coverage_sum_assured_min_without_medical' in product:
            coverage_fields.extend([
                'coverage_sum_assured_min_without_medical',
                'coverage_sum_assured_max_without_medical',
                'coverage_sum_assured_min_with_medical',
                'coverage_sum_assured_max_with_medical'
            ])
        coverage = {k: product.get(k, 'N/A') for k in coverage_fields}
        coverage['company_id'] = product['company_id']
        coverage['product_id'] = product_id  # Added for consistency
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': product['company_id'],
            'product_id': product_id,
            'chunk_type': 'coverage',
            'raw_data': coverage,
            'text': create_text_from_chunk({**coverage, 'product_name': product_name}, 'coverage')
        })
        
        # Exclusions chunk
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': product['company_id'],
            'product_id': product_id,
            'chunk_type': 'exclusions',
            'raw_data': {'exclusions': product.get('exclusions', 'N/A')},
            'text': create_text_from_chunk(
                {'exclusions': product.get('exclusions', 'N/A'), 'product_name': product_name, 'product_id': product_id},
                'exclusions'
            )
        })
        
        # Add-ons chunk
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': product['company_id'],
            'product_id': product_id,
            'chunk_type': 'add_ons',
            'raw_data': {'add_ons': product.get('add_ons', 'N/A')},
            'text': create_text_from_chunk(
                {'add_ons': product.get('add_ons', 'N/A'), 'product_name': product_name, 'product_id': product_id},
                'add_ons'
            )
        })
        
        # Claims process chunk
        claims_fields = [
            'claims_process_required_documents', 'claims_process_average_turnaround_days',
            'claims_process_digital_claims_supported', 'claims_process_notes'
        ]
        claims = {k: product.get(k, 'N/A') for k in claims_fields}
        claims['company_id'] = product['company_id']
        claims['product_id'] = product_id  # Added for consistency
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': product['company_id'],
            'product_id': product_id,
            'chunk_type': 'claims_process',
            'raw_data': claims,
            'text': create_text_from_chunk({**claims, 'product_name': product_name}, 'claims_process')
        })
        
        # Renewal terms chunk
        renewal_fields = ['renewal_terms_auto_renewal', 'renewal_terms_grace_period_days']
        renewal = {k: product.get(k, 'N/A') for k in renewal_fields}
        renewal['company_id'] = product['company_id']
        renewal['product_id'] = product_id  # Added for consistency
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': product['company_id'],
            'product_id': product_id,
            'chunk_type': 'renewal_terms',
            'raw_data': renewal,
            'text': create_text_from_chunk({**renewal, 'product_name': product_name}, 'renewal_terms')
        })
        
        # Provider network chunk (if not null)
        if product.get('provider_network') and product['provider_network'].get('hospitals'):
            provider = {
                'provider_network_hospitals': product['provider_network'].get('hospitals', 'N/A'),
                'provider_network_note': product['provider_network'].get('note', 'N/A'),
                'company_id': product['company_id'],
                'product_id': product_id  # Added for consistency
            }
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'chunk_type': 'provider_network',
                'raw_data': provider,
                'text': create_text_from_chunk({**provider, 'product_name': product_name}, 'provider_network')
            })
        
        # Customer reviews chunk
        if product.get('customer_reviews'):
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'chunk_type': 'customer_reviews',
                'raw_data': {'customer_reviews': product.get('customer_reviews', 'N/A')},
                'text': create_text_from_chunk(
                    {'customer_reviews': product.get('customer_reviews', 'N/A'), 'product_name': product_name, 'product_id': product_id},
                    'customer_reviews'
                )
            })
    
    logger.info(f"Created {len(chunks)} chunks")
    return chunks

def validate_chunks(chunks: List[Dict[str, Any]], original_data: Dict[str, Any]) -> None:
    """Validate that all data is captured in chunks."""
    expected_branch_count = len(original_data['branches'])
    expected_product_count = len(original_data['products'])
    
    branch_chunks = len([c for c in chunks if c['chunk_type'] == 'branch'])
    product_chunks = len([c for c in chunks if c['product_id']])
    
    if branch_chunks != expected_branch_count:
        logger.warning(f"Branch count mismatch: expected {expected_branch_count}, got {branch_chunks}")
    if product_chunks < expected_product_count:
        logger.warning(f"Product chunk count too low: expected at least {expected_product_count}, got {product_chunks}")
    
    # Check for key fields in a sample product
    sample_product = original_data['products'][0]
    product_id = sample_product['product_id']
    product_chunks = [c for c in chunks if c['product_id'] == product_id]
    expected_chunk_types = [
        'product_metadata', 'premium', 'coverage', 'exclusions',
        'add_ons', 'claims_process', 'renewal_terms'
    ]
    if sample_product.get('provider_network') and sample_product['provider_network'].get('hospitals'):
        expected_chunk_types.append('provider_network')
    if sample_product.get('customer_reviews'):
        expected_chunk_types.append('customer_reviews')
    
    for chunk_type in expected_chunk_types:
        if not any(c['chunk_type'] == chunk_type for c in product_chunks):
            logger.warning(f"Missing {chunk_type} chunk for product {product_id}")

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
    """Main preprocessing function for Britam.json."""
    input_path = Path('src/data/raw/Britam.json')
    output_path = Path('src/data/preprocessed/britam_preprocessed.json')
    
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