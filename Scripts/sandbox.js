// Global variable to store loaded data
let projectsData = [];

async function loadProjectData() {
  try {
    const response = await fetch("../data/sandbox.json");
    const data = await response.json();
    projectsData = data; // Store data globally
    return data;
  } catch (error) {
    console.error("Error loading project data:", error);
    return [];
  }
}

function createTags(projects) {
  const tagsSection = document.getElementById("tags");
  tagsSection.innerHTML = "";

  // Add "Show All" button
  const allButton = document.createElement("button");
  allButton.textContent = "Show All";
  allButton.addEventListener("click", () => filterProjects("all"));
  tagsSection.appendChild(allButton);

  // Create unique tags list and add buttons
  const uniqueTags = [
    ...new Set(projects.flatMap((project) => project.classification)),
  ];
  uniqueTags.forEach((tag) => {
    const button = document.createElement("button");
    button.textContent = tag;
    button.addEventListener("click", () => {
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
      document.body.scrollTop = 0; // For Safari

      filterProjects(tag);
    });

    tagsSection.appendChild(button);
  });
}

function createProjectSection(project) {
  const section = document.createElement("section");
  section.className = "flex-column";

  // Only create links list if there are links
  const linksList =
    project.links && project.links.length
      ? `
        <div class="links">
            ${project.links
              .map((link) => `<a href="${link.url}">${link.text} &#8599;</a>`)
              .join("<br>")}
        </div>
    `
      : "";

  // Only create collaborators list if there are collaborators
  const collaboratorsList =
    project.collaborators && project.collaborators.length
      ? `
        <div class="collaborators">
            <p class = "underline" >Collaborators:</p>
            ${project.collaborators
              .map((collab) => `<a href="${collab.url}">${collab.name}</a>`)
              .join(", ")}
        </div>
    `
      : "";

  // Only create resource list if there are resources
  const resourceList =
    project.resources && project.resources.length
      ? `
        <div class="collaborators">
            <p class = "underline">Resources:</p>
            ${project.resources
              .map(
                (collab) => `<a href="${collab.url}">${collab.text} &#8599;</a>`
              )
              .join(", ")}
        </div>
    `
      : "";

  // Only include title if it exists
  const titleSection = project.title ? `<h3>${project.title} &#8594;</h3>` : "";

  section.innerHTML = `
    <article class = "flex-responsive">
        <div class="column1">
            ${titleSection}
            <p>${project.date}</p>
            <p class="classification">${project.classification.join(", ")}</p>
        </div>
        <div class="column2">
            <p>${project.description}</p>
            ${collaboratorsList}
        </div>
        <div class="column3">
            ${linksList}
            ${resourceList}
        </div>
        <div class="column4 img-gallery${(() => {
          if (project.image_gallery === "double") return " double-grid";
          if (project.image_gallery === "single") return " no-grid";
          return "";
        })()}
        }">
            ${project.images
              .map(
                (img) =>
                  `<img src="${img.url}" alt="${img.alt}" class="gallery-img">`
              )
              .join("")}
        </div>
    </article>
        <hr>
    `;

  // Add click handlers for images after the HTML is set
  const images = section.querySelectorAll(".gallery-img");
  images.forEach((img) => {
    img.addEventListener("click", () => {
      const fullscreenContainer = document.createElement("div");
      fullscreenContainer.className = "fullscreen-container";
      const fullscreenImage = document.createElement("img");
      fullscreenImage.src = img.src;
      fullscreenImage.className = "fullscreen-image";

      // Close on click anywhere
      fullscreenContainer.addEventListener("click", () => {
        fullscreenContainer.remove();
      });

      fullscreenContainer.appendChild(fullscreenImage);
      document.body.appendChild(fullscreenContainer);
    });
  });

  return section;
}

function filterProjects(tag) {
  const projectsContainer = document.getElementById("projects-container");
  projectsContainer.innerHTML = "";

  // Filter projects
  const filteredProjects =
    tag === "all"
      ? projectsData
      : projectsData.filter((project) => project.classification.includes(tag));

  // Display filtered projects
  filteredProjects.forEach((project) => {
    projectsContainer.appendChild(createProjectSection(project));
  });
}

async function initPage() {
  const projects = await loadProjectData();
  if (projects.length > 0) {
    createTags(projects);
    // Show all projects initially
    filterProjects("all");
  } else {
    console.error("No project data loaded");
  }
}

document.addEventListener("DOMContentLoaded", initPage);
