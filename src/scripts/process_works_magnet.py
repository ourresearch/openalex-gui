#!/usr/bin/env python3
"""
Process worksMagnet.tsv to create an atomic list of curations.

This script:
1. Filters rows to only include those with "Yes" in the "OpenAlex Approve?" column
2. Explodes the data so each ROR-operation-work combination is on a separate row
3. Outputs to worksMagnetAtomic.tsv
"""

import csv
import sys
from pathlib import Path


def process_works_magnet(input_file, output_file):
    """
    Process the worksMagnet.tsv file and create atomic curations.
    
    Args:
        input_file: Path to the input TSV file
        output_file: Path to the output TSV file
    """
    atomic_rows = []
    
    # Read the input file
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        
        for row in reader:
            # Filter: only process rows with "Yes" in OpenAlex Approve?
            if row.get('OpenAlex Approve?', '').strip() != 'Yes':
                continue
            
            # Parse the fields
            added_rors = [ror.strip() for ror in row.get('added_rors', '').split(';') if ror.strip()]
            removed_rors = [ror.strip() for ror in row.get('removed_rors', '').split(';') if ror.strip()]
            works = [work.strip() for work in row.get('works_examples', '').split(';') if work.strip()]
            
            # Create atomic rows for added RORs
            for ror in added_rors:
                for work in works:
                    atomic_rows.append({
                        'ror': ror,
                        'operation': 'add',
                        'work': work
                    })
            
            # Create atomic rows for removed RORs
            for ror in removed_rors:
                for work in works:
                    atomic_rows.append({
                        'ror': ror,
                        'operation': 'remove',
                        'work': work
                    })
    
    # Write the output file
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['ror', 'operation', 'work']
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter='\t')
        
        writer.writeheader()
        writer.writerows(atomic_rows)
    
    return len(atomic_rows)


def main():
    # Set up paths relative to the script location
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    input_file = project_root / 'data' / 'worksMagnet.tsv'
    output_file = project_root / 'data' / 'worksMagnetAtomic.tsv'
    
    # Check if input file exists
    if not input_file.exists():
        print(f"Error: Input file not found at {input_file}", file=sys.stderr)
        sys.exit(1)
    
    print(f"Processing {input_file}...")
    
    try:
        num_rows = process_works_magnet(input_file, output_file)
        print(f"✓ Successfully created {output_file}")
        print(f"✓ Generated {num_rows} atomic curation rows")
    except Exception as e:
        print(f"Error processing file: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
