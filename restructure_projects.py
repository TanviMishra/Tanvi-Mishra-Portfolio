import json
import os

# Read the JSON file
file_path = os.path.join('Data', 'projects.json')
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Define the field order
field_order = [
    'project type',
    'title',
    'search',
    'year',
    'tags',
    'short description',
    'long description',
    'collaborators',
    'resources',
    'image_gallery',
    'image description',
    'image',
    'video description',
    'video'
]

# Process each project
processed_projects = []
for project in data:
    # Remove 'brief' field and other unwanted fields
    # Set default project type to "experiment" if missing or empty
    project_type = project.get('project type', '').strip() if project.get('project type') else ''
    if not project_type:
        project_type = 'experiment'
    
    # Create new project with ordered fields
    processed_project = {}
    for field in field_order:
        if field == 'project type':
            processed_project[field] = project_type
        elif field in ['tags', 'collaborators', 'resources', 'image', 'video']:
            # Arrays - use empty array if missing
            processed_project[field] = project.get(field, [])
        else:
            # Strings - use empty string if missing
            value = project.get(field)
            processed_project[field] = value if value is not None else ''
    
    processed_projects.append(processed_project)

# Write the restructured JSON
with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(processed_projects, f, indent=2, ensure_ascii=False)

print(f'Processed {len(processed_projects)} projects')
print('Fields reordered and "brief" fields removed')
