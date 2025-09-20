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
    
    # Validate product fields for Jubilee Insurance
    product_keys = [
        'product_id', 'product_name', 'category', 'target_market',
        'eligibility', 'geographic_coverage', 'coverage', 'exclusions',
        'add_ons', 'claims_process', 'distribution_channels', 'last_updated',
        'sources'
    ]
    for product in data['products']:
        for key in product_keys:
            if key not in product:
                logger.warning(f"Product {product.get('product_id', 'unknown')} missing key: {key}")
        # Validate sub-products if present
        if 'sub_products' in product:
            if not isinstance(product['sub_products'], list):
                logger.error(f"Sub-products for {product['product_id']} must be a list")
                raise ValueError(f"Sub-products for {product['product_id']} must be a list")
            sub_product_keys = ['sub_product_id', 'sub_product_name']
            for sub_product in product['sub_products']:
                for key in sub_product_keys:
                    if key not in sub_product:
                        logger.warning(f"Sub-product {sub_product.get('sub_product_id', 'unknown')} missing key: {key}")
                # Validate variants if present (e.g., for motor insurance)
                if 'variants' in sub_product:
                    if not isinstance(sub_product['variants'], list):
                        logger.error(f"Variants for {sub_product['sub_product_id']} must be a list")
                        raise ValueError(f"Variants for {sub_product['sub_product_id']} must be a list")
                    variant_keys = ['variant_id', 'variant_name']
                    for variant in sub_product['variants']:
                        for key in variant_keys:
                            if key not in variant:
                                logger.warning(f"Variant {variant.get('variant_id', 'unknown')} missing key: {key}")

def flatten_dict(d: Dict[str, Any], parent_key: str = '', sep: str = '_') -> Dict[str, Any]:
    """Flatten a nested dictionary."""
    items = []
    for key, value in d.items():
        new_key = f"{parent_key}{sep}{key}" if parent_key else key
        if isinstance(value, dict):
            items.extend(flatten_dict(value, new_key, sep).items())
        elif isinstance(value, list) and key not in ['branches', 'products', 'sub_products', 'variants', 'rate_table', 'sample_examples', 'benefits', 'exclusions', 'add_ons', 'required_documents', 'partners', 'sources']:
            items.append((new_key, ', '.join(str(v) for v in value if isinstance(v, str))))
        else:
            items.append((new_key, value))
    return dict(items)

def normalize_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize and flatten company data."""
    normalized = {'company_metadata': {}, 'branches': [], 'products': [], 'sub_products': [], 'variants': []}
    
    # Flatten company metadata
    company_data = {k: v for k, v in data.items() if k not in ['branches', 'products']}
    normalized['company_metadata'] = flatten_dict(company_data)
    
    # Normalize branches
    for i, branch in enumerate(data['branches'], 1):
        branch_data = flatten_dict(branch)
        branch_data['company_id'] = data['company_id']
        branch_data['branch_id'] = f"{data['company_id']}_branch_{i:03d}"
        normalized['branches'].append(branch_data)
    
    # Normalize products and sub-products
    for product in data['products']:
        product_data = flatten_dict({k: v for k, v in product.items() if k != 'sub_products'})
        product_data['company_id'] = data['company_id']
        normalized['products'].append(product_data)
        
        # Normalize sub-products
        if 'sub_products' in product:
            for sub_product in product['sub_products']:
                sub_product_data = flatten_dict({k: v for k, v in sub_product.items() if k != 'variants'})
                sub_product_data['company_id'] = data['company_id']
                sub_product_data['product_id'] = product['product_id']
                normalized['sub_products'].append(sub_product_data)
                
                # Normalize variants (e.g., for motor insurance)
                if 'variants' in sub_product:
                    for variant in sub_product['variants']:
                        variant_data = flatten_dict(variant)
                        variant_data['company_id'] = data['company_id']
                        variant_data['product_id'] = product['product_id']
                        variant_data['sub_product_id'] = sub_product['sub_product_id']
                        normalized['variants'].append(variant_data)
    
    logger.info(f"Normalized data: {len(normalized['branches'])} branches, {len(normalized['products'])} products, {len(normalized['sub_products'])} sub-products, {len(normalized['variants'])} variants")
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
                f"Contact phones: {chunk_data.get('phone', 'N/A')}. "
                f"Mobile: {chunk_data.get('mobile', 'N/A')}. "
                f"Email: {chunk_data.get('email', 'N/A')}."
            )
        elif chunk_type == 'product_metadata':
            text = (
                f"{chunk_data['product_name']} (ID: {chunk_data['product_id']}) is a "
                f"{chunk_data['category']} insurance product by {chunk_data['company_id']} "
                f"for {chunk_data['target_market']}. "
                f"Geographic coverage: {chunk_data['geographic_coverage']}."
            )
        elif chunk_type == 'sub_product_metadata':
            text = (
                f"{chunk_data['sub_product_name']} (ID: {chunk_data['sub_product_id']}) is a "
                f"sub-product of {chunk_data['product_id']} by {chunk_data['company_id']}. "
                f"Sum assured: Min {chunk_data.get('sum_assured_min', 'N/A')}, "
                f"Max {chunk_data.get('sum_assured_max', 'N/A')}."
            )
        elif chunk_type == 'variant_metadata':
            text = (
                f"{chunk_data['variant_name']} (ID: {chunk_data['variant_id']}) is a variant of "
                f"{chunk_data['sub_product_id']} under {chunk_data['product_id']} by {chunk_data['company_id']}. "
                f"Sum assured: Min {chunk_data.get('sum_assured_min', 'N/A')}, "
                f"Max {chunk_data.get('sum_assured_max', 'N/A')}."
            )
        elif chunk_type == 'premium':
            text = (
                f"Premium for {chunk_data['product_name'] or chunk_data.get('sub_product_name', 'N/A')} "
                f"(ID: {chunk_data.get('product_id') or chunk_data.get('sub_product_id', 'N/A') or chunk_data.get('variant_id', 'N/A')}): "
                f"Currency: {chunk_data.get('premium_currency', 'N/A')}, "
                f"Payment frequency: {chunk_data.get('premium_payment_frequency', 'N/A')}. "
                f"Sample examples: {chunk_data.get('premium_sample_examples', 'N/A')}. "
                f"Notes: {chunk_data.get('premium_rate_table_notes', 'N/A')}."
            )
        elif chunk_type == 'coverage':
            text = (
                f"Coverage for {chunk_data['product_name'] or chunk_data.get('sub_product_name', 'N/A')} "
                f"(ID: {chunk_data.get('product_id') or chunk_data.get('sub_product_id', 'N/A') or chunk_data.get('variant_id', 'N/A')}): "
                f"Benefits: {chunk_data.get('coverage_benefits', 'N/A')}. "
                f"Duration: {chunk_data.get('coverage_duration', 'N/A')}."
            )
        elif chunk_type == 'exclusions':
            text = (
                f"Exclusions for {chunk_data['product_name'] or chunk_data.get('sub_product_name', 'N/A')} "
                f"(ID: {chunk_data.get('product_id') or chunk_data.get('sub_product_id', 'N/A') or chunk_data.get('variant_id', 'N/A')}): "
                f"{chunk_data.get('exclusions', 'N/A')}."
            )
        elif chunk_type == 'add_ons':
            text = (
                f"Add-ons for {chunk_data['product_name'] or chunk_data.get('sub_product_name', 'N/A')} "
                f"(ID: {chunk_data.get('product_id') or chunk_data.get('sub_product_id', 'N/A') or chunk_data.get('variant_id', 'N/A')}): "
                f"{chunk_data.get('add_ons', 'N/A')}."
            )
        elif chunk_type == 'claims_process':
            text = (
                f"Claims process for {chunk_data['product_name'] or chunk_data.get('sub_product_name', 'N/A')} "
                f"(ID: {chunk_data.get('product_id') or chunk_data.get('sub_product_id', 'N/A') or chunk_data.get('variant_id', 'N/A')}): "
                f"Required documents: {chunk_data.get('claims_process_required_documents', 'N/A')}. "
                f"Average turnaround: {chunk_data.get('claims_process_average_turnaround_days', 'N/A')} days. "
                f"Digital claims supported: {chunk_data.get('claims_process_digital_claims_supported', 'N/A')}."
            )
        elif chunk_type == 'provider_network':
            text = (
                f"Provider network for {chunk_data['product_name'] or chunk_data.get('sub_product_name', 'N/A')} "
                f"(ID: {chunk_data.get('product_id') or chunk_data.get('sub_product_id', 'N/A') or chunk_data.get('variant_id', 'N/A')}): "
                f"Partners: {chunk_data.get('provider_network_partners', 'N/A')}. "
                f"Note: {chunk_data.get('provider_network_note', 'N/A')}."
            )
        elif chunk_type == 'sum_assured':
            text = (
                f"Sum assured for {chunk_data['product_name'] or chunk_data.get('sub_product_name', 'N/A')} "
                f"(ID: {chunk_data.get('product_id') or chunk_data.get('sub_product_id', 'N/A') or chunk_data.get('variant_id', 'N/A')}): "
                f"Min: {chunk_data.get('sum_assured_min', 'N/A')}, Max: {chunk_data.get('sum_assured_max', 'N/A')}. "
                f"Notes: {chunk_data.get('sum_assured_notes', 'N/A')}."
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
        'sub_product_id': None,
        'variant_id': None,
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
            'sub_product_id': None,
            'variant_id': None,
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
            'eligibility_notes', 'geographic_coverage', 'last_updated',
            'distribution_channels', 'sources'
        ]
        metadata = {k: product.get(k, 'N/A') for k in metadata_fields}
        metadata['company_id'] = product['company_id']
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': product['company_id'],
            'product_id': product_id,
            'sub_product_id': None,
            'variant_id': None,
            'chunk_type': 'product_metadata',
            'raw_data': metadata,
            'text': create_text_from_chunk(metadata, 'product_metadata')
        })
        
        # Product-level sum assured chunk
        if 'sum_assured' in product:
            sum_assured = product['sum_assured']
            sum_assured['company_id'] = product['company_id']
            sum_assured['product_id'] = product_id
            sum_assured['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'sub_product_id': None,
                'variant_id': None,
                'chunk_type': 'sum_assured',
                'raw_data': sum_assured,
                'text': create_text_from_chunk(sum_assured, 'sum_assured')
            })
        
        # Product-level premium chunk
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
                'sub_product_id': None,
                'variant_id': None,
                'chunk_type': 'premium',
                'raw_data': premium,
                'text': create_text_from_chunk(premium, 'premium')
            })
        
        # Product-level coverage chunk
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
                'sub_product_id': None,
                'variant_id': None,
                'chunk_type': 'coverage',
                'raw_data': coverage,
                'text': create_text_from_chunk(coverage, 'coverage')
            })
        
        # Product-level exclusions chunk
        if 'exclusions' in product:
            exclusions = {'exclusions': product['exclusions']}
            exclusions['company_id'] = product['company_id']
            exclusions['product_id'] = product_id
            exclusions['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'sub_product_id': None,
                'variant_id': None,
                'chunk_type': 'exclusions',
                'raw_data': exclusions,
                'text': create_text_from_chunk(exclusions, 'exclusions')
            })
        
        # Product-level add-ons chunk
        if 'add_ons' in product:
            add_ons = {'add_ons': product['add_ons']}
            add_ons['company_id'] = product['company_id']
            add_ons['product_id'] = product_id
            add_ons['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'sub_product_id': None,
                'variant_id': None,
                'chunk_type': 'add_ons',
                'raw_data': add_ons,
                'text': create_text_from_chunk(add_ons, 'add_ons')
            })
        
        # Product-level claims process chunk
        if 'claims_process' in product:
            claims_process = product['claims_process']
            claims_process['company_id'] = product['company_id']
            claims_process['product_id'] = product_id
            claims_process['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'sub_product_id': None,
                'variant_id': None,
                'chunk_type': 'claims_process',
                'raw_data': claims_process,
                'text': create_text_from_chunk(claims_process, 'claims_process')
            })
        
        # Product-level provider network chunk
        if 'provider_network' in product:
            provider_network = product['provider_network']
            provider_network['company_id'] = product['company_id']
            provider_network['product_id'] = product_id
            provider_network['product_name'] = product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': product['company_id'],
                'product_id': product_id,
                'sub_product_id': None,
                'variant_id': None,
                'chunk_type': 'provider_network',
                'raw_data': provider_network,
                'text': create_text_from_chunk(provider_network, 'provider_network')
            })
    
    # Sub-product chunks
    for sub_product in normalized_data['sub_products']:
        sub_product_id = sub_product['sub_product_id']
        sub_product_name = sub_product['sub_product_name']
        product_id = sub_product['product_id']
        
        # Sub-product metadata chunk
        metadata_fields = [
            'sub_product_id', 'sub_product_name', 'sum_assured_min', 'sum_assured_max', 'sum_assured_notes'
        ]
        metadata = {k: sub_product.get(k, 'N/A') for k in metadata_fields}
        metadata['company_id'] = sub_product['company_id']
        metadata['product_id'] = product_id
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': sub_product['company_id'],
            'product_id': product_id,
            'sub_product_id': sub_product_id,
            'variant_id': None,
            'chunk_type': 'sub_product_metadata',
            'raw_data': metadata,
            'text': create_text_from_chunk(metadata, 'sub_product_metadata')
        })
        
        # Sub-product sum assured chunk
        if 'sum_assured' in sub_product:
            sum_assured = sub_product['sum_assured']
            sum_assured['company_id'] = sub_product['company_id']
            sum_assured['product_id'] = product_id
            sum_assured['sub_product_id'] = sub_product_id
            sum_assured['sub_product_name'] = sub_product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': sub_product['company_id'],
                'product_id': product_id,
                'sub_product_id': sub_product_id,
                'variant_id': None,
                'chunk_type': 'sum_assured',
                'raw_data': sum_assured,
                'text': create_text_from_chunk(sum_assured, 'sum_assured')
            })
        
        # Sub-product premium chunk
        if 'premium' in sub_product:
            premium = sub_product['premium']
            premium['company_id'] = sub_product['company_id']
            premium['product_id'] = product_id
            premium['sub_product_id'] = sub_product_id
            premium['sub_product_name'] = sub_product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': sub_product['company_id'],
                'product_id': product_id,
                'sub_product_id': sub_product_id,
                'variant_id': None,
                'chunk_type': 'premium',
                'raw_data': premium,
                'text': create_text_from_chunk(premium, 'premium')
            })
        
        # Sub-product coverage chunk
        if 'coverage' in sub_product:
            coverage = sub_product['coverage']
            coverage['company_id'] = sub_product['company_id']
            coverage['product_id'] = product_id
            coverage['sub_product_id'] = sub_product_id
            coverage['sub_product_name'] = sub_product_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': sub_product['company_id'],
                'product_id': product_id,
                'sub_product_id': sub_product_id,
                'variant_id': None,
                'chunk_type': 'coverage',
                'raw_data': coverage,
                'text': create_text_from_chunk(coverage, 'coverage')
            })
    
    # Variant chunks
    for variant in normalized_data['variants']:
        variant_id = variant['variant_id']
        variant_name = variant['variant_name']
        product_id = variant['product_id']
        sub_product_id = variant['sub_product_id']
        
        # Variant metadata chunk
        metadata_fields = [
            'variant_id', 'variant_name', 'sum_assured_min', 'sum_assured_max', 'sum_assured_notes'
        ]
        metadata = {k: variant.get(k, 'N/A') for k in metadata_fields}
        metadata['company_id'] = variant['company_id']
        metadata['product_id'] = product_id
        metadata['sub_product_id'] = sub_product_id
        chunk_id = str(uuid.uuid4())
        chunks.append({
            'chunk_id': chunk_id,
            'company_id': variant['company_id'],
            'product_id': product_id,
            'sub_product_id': sub_product_id,
            'variant_id': variant_id,
            'chunk_type': 'variant_metadata',
            'raw_data': metadata,
            'text': create_text_from_chunk(metadata, 'variant_metadata')
        })
        
        # Variant sum assured chunk
        if 'sum_assured' in variant:
            sum_assured = variant['sum_assured']
            sum_assured['company_id'] = variant['company_id']
            sum_assured['product_id'] = product_id
            sum_assured['sub_product_id'] = sub_product_id
            sum_assured['variant_id'] = variant_id
            sum_assured['variant_name'] = variant_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': variant['company_id'],
                'product_id': product_id,
                'sub_product_id': sub_product_id,
                'variant_id': variant_id,
                'chunk_type': 'sum_assured',
                'raw_data': sum_assured,
                'text': create_text_from_chunk(sum_assured, 'sum_assured')
            })
        
        # Variant premium chunk
        if 'premium' in variant:
            premium = variant['premium']
            premium['company_id'] = variant['company_id']
            premium['product_id'] = product_id
            premium['sub_product_id'] = sub_product_id
            premium['variant_id'] = variant_id
            premium['variant_name'] = variant_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': variant['company_id'],
                'product_id': product_id,
                'sub_product_id': sub_product_id,
                'variant_id': variant_id,
                'chunk_type': 'premium',
                'raw_data': premium,
                'text': create_text_from_chunk(premium, 'premium')
            })
        
        # Variant coverage chunk
        if 'coverage' in variant:
            coverage = variant['coverage']
            coverage['company_id'] = variant['company_id']
            coverage['product_id'] = product_id
            coverage['sub_product_id'] = sub_product_id
            coverage['variant_id'] = variant_id
            coverage['variant_name'] = variant_name
            chunk_id = str(uuid.uuid4())
            chunks.append({
                'chunk_id': chunk_id,
                'company_id': variant['company_id'],
                'product_id': product_id,
                'sub_product_id': sub_product_id,
                'variant_id': variant_id,
                'chunk_type': 'coverage',
                'raw_data': coverage,
                'text': create_text_from_chunk(coverage, 'coverage')
            })
    
    logger.info(f"Created {len(chunks)} chunks")
    return chunks

def validate_chunks(chunks: List[Dict[str, Any]], original_data: Dict[str, Any]) -> None:
    """Validate that all data is captured in chunks."""
    expected_branch_count = len(original_data['branches'])
    expected_product_count = len(original_data['products'])
    expected_sub_product_count = sum(len(product.get('sub_products', [])) for product in original_data['products'])
    expected_variant_count = sum(
        sum(len(sub_product.get('variants', [])) for sub_product in product.get('sub_products', []))
        for product in original_data['products']
    )
    
    branch_chunks = len([c for c in chunks if c['chunk_type'] == 'branch'])
    product_chunks = len([c for c in chunks if c['chunk_type'] == 'product_metadata'])
    sub_product_chunks = len([c for c in chunks if c['chunk_type'] == 'sub_product_metadata'])
    variant_chunks = len([c for c in chunks if c['chunk_type'] == 'variant_metadata'])
    
    if branch_chunks != expected_branch_count:
        logger.warning(f"Branch count mismatch: expected {expected_branch_count}, got {branch_chunks}")
    if product_chunks != expected_product_count:
        logger.warning(f"Product count mismatch: expected {expected_product_count}, got {product_chunks}")
    if sub_product_chunks != expected_sub_product_count:
        logger.warning(f"Sub-product count mismatch: expected {expected_sub_product_count}, got {sub_product_chunks}")
    if variant_chunks != expected_variant_count:
        logger.warning(f"Variant count mismatch: expected {expected_variant_count}, got {variant_chunks}")

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
    """Main preprocessing function for Jubilee.json."""
    input_path = Path('src/data/raw/Jubilee.json')
    output_path = Path('src/data/preprocessed/jubilee_preprocessed.json')
    
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