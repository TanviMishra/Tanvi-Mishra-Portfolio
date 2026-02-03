const fs = require('fs');
const path = require('path');

// Read the JSON file
const filePath = path.join(__dirname, 'Data', 'projects.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Define the field order
const fieldOrder = [
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
];

// Process each project
const processedProjects = data.map(project => {
  // Remove 'brief' field
  delete project.brief;
  
  // Remove other fields not in the list (like 'role', 'links')
  const allowedFields = new Set(fieldOrder);
  Object.keys(project).forEach(key => {
    if (!allowedFields.has(key)) {
      delete project[key];
    }
  });
  
  // Set default project type to "experiment" if missing or empty
  if (!project['project type'] || project['project type'].trim() === '') {
    project['project type'] = 'experiment';
  }
  
  // Ensure all fields exist with default values
  const processedProject = {};
  fieldOrder.forEach(field => {
    if (field === 'tags' || field === 'collaborators' || field === 'resources' || field === 'image' || field === 'video') {
      // Arrays - use empty array if missing
      processedProject[field] = project[field] || [];
    } else {
      // Strings - use empty string if missing
      processedProject[field] = project[field] !== undefined && project[field] !== null ? project[field] : '';
    }
  });
  
  return processedProject;
});

// Write the restructured JSON
const output = JSON.stringify(processedProjects, null, 2);
fs.writeFileSync(filePath, output, 'utf8');

console.log(`Processed ${processedProjects.length} projects`);
console.log('Fields reordered and "brief" fields removed');
