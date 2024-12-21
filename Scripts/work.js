// Store project data globally after fetching
let projectsData = null;

// Function to load all project data
async function loadProjects() {
  if (projectsData === null) {
    try {
      console.log("Attempting to fetch work.json...");
      const response = await fetch("../Data/work.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      projectsData = await response.json();
      console.log("Successfully loaded projects:", projectsData);
    } catch (error) {
      console.error("Error loading projects:", error);
      projectsData = [];
    }
  }
  return projectsData;
}

// Helper function to check if a value is empty
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  if (typeof value === "string")
    return value.trim() === "" || value.trim().toLowerCase() === "blank";
  return false;
}

// Function to load specific project content
async function loadProjectContent(searchTerm) {
  try {
    // Wait for DOM content to be loaded
    if (document.readyState !== "complete") {
      await new Promise((resolve) => window.addEventListener("load", resolve));
    }

    // Load project data
    const projects = await loadProjects();

    // Debug logging
    console.log("Searching for project with search term:", searchTerm);

    // Find the project using search parameter
    const project = projects.find(
      (p) => p.search.toLowerCase() === searchTerm.toLowerCase()
    );

    if (!project) {
      console.error("Project not found:", searchTerm);
      return;
    }

    console.log("Found project:", project.title);

    // Update page title
    document.title = `${project.title}`;

    // Populate basic content
    const elements = {
      title: project.title,
      classification: project.classification
        .filter((c) => !isEmpty(c))
        .join(", "),
      date: project.date,
      description: project.description,
      "image-description": project["image-description"],
    };

    // Update all basic elements
    Object.entries(elements).forEach(([id, content]) => {
      const element = document.getElementById(id);
      if (element && !isEmpty(content)) {
        element.textContent = content;
      } else if (element) {
        element.style.display = "none";
      }
    });

    // Add project links
    const linkDiv = document.getElementById("links");
    if (linkDiv) {
      if (!isEmpty(project.links)) {
        linkDiv.innerHTML = "";
        project.links.forEach((link) => {
          if (!isEmpty(link.url) && !isEmpty(link.text)) {
            const a = document.createElement("a");
            a.href = link.url;
            a.innerHTML = `${link.text} &#8599;`;
            a.target = "_blank";
            linkDiv.appendChild(a);
          }
        });
      } else {
        linkDiv.style.display = "none";
      }
    }

    // Add collaborators
    const collabElement = document.getElementById("collaborators");
    if (collabElement) {
      if (!isEmpty(project.collaborators)) {
        const validCollabs = project.collaborators.filter(
          (collab) => !isEmpty(collab.text)
        );
        if (validCollabs.length > 0) {
          const collabText = validCollabs
            .map((collab) =>
              collab.url
                ? `<a href="${collab.url}" target="_blank">${collab.text}</a>`
                : collab.text
            )
            .join(", ");
          collabElement.innerHTML = `<span class="underline">Collaborators:</span>&nbsp;${collabText}`;
        } else {
          collabElement.style.display = "none";
        }
      } else {
        collabElement.style.display = "none";
      }
    }

    // Add role
    const roleElement = document.getElementById("role");
    if (roleElement) {
      if (!isEmpty(project.role)) {
        roleElement.innerHTML = `<span class="underline">Role:</span>&nbsp;${project.role}`;
      } else {
        roleElement.style.display = "none";
      }
    }

    // Process images based on type
    if (!isEmpty(project.images)) {
      // Featured images
      const featuredSection = document.querySelector(".featured-image");
      const featuredImages = project.images.filter(
        (img) =>
          img.type === "featured" && !isEmpty(img.url) && img.url !== "../"
      );
      if (featuredSection && featuredImages.length > 0) {
        featuredSection.innerHTML = "";
        featuredImages.forEach((image) => {
          const container = document.createElement("div");
          container.className = "featured-image-container";
          container.innerHTML = `
            <img src="${image.url}" alt="${image.alt || ""}">
            ${!isEmpty(image.text) ? `<h2>${image.text}</h2>` : ""}
          `;
          featuredSection.appendChild(container);
        });
      } else if (featuredSection) {
        featuredSection.style.display = "none";
      }

      // Final images for slider
      const finalImages = project.images.filter(
        (img) => img.type === "final" && !isEmpty(img.url) && img.url !== "../"
      );

      // Find both the slider container and its parent section
      const sliderContainer = document.getElementById("final-images");
      const sliderSection =
        document.getElementById("arrowContainer")?.parentElement;

      if (finalImages.length > 0 && sliderContainer) {
        sliderContainer.innerHTML = "";
        finalImages.forEach((image) => {
          const slide = document.createElement("div");
          slide.className = "slide";
          slide.innerHTML = `
            <img src="${image.url}" alt="${image.alt || ""}">
            ${
              !isEmpty(image.text)
                ? `<p class="slide-caption">${image.text}</p>`
                : ""
            }
          `;
          sliderContainer.appendChild(slide);
        });
        // Initialize slider if function exists
        if (typeof initializeSlider === "function") {
          initializeSlider();
        }
      } else {
        // Remove the entire slider section if no valid final images
        if (sliderSection) {
          sliderSection.remove();
        }
      }

      // Process progress images
      const processProgressImages = (images, containerId, containerClass) => {
        const container = document.getElementById(containerId);
        const filteredImages = images.filter(
          (img) =>
            img.type === containerClass &&
            !isEmpty(img.url) &&
            img.url !== "../"
        );
        if (container && filteredImages.length > 0) {
          container.innerHTML = "";
          filteredImages.forEach((image) => {
            const imgContainer = document.createElement("div");
            const className =
              containerClass === "progress-big"
                ? "big-image-container"
                : "small-image-container";
            imgContainer.className = className;
            imgContainer.innerHTML = `
              <img src="${image.url}" alt="${image.alt || ""}">
              ${
                !isEmpty(image.text)
                  ? `<p class="image-caption">${image.text}</p>`
                  : ""
              }
            `;
            container.appendChild(imgContainer);
          });
        } else if (container) {
          container.style.display = "none";
        }
      };

      processProgressImages(project.images, "progress-big", "progress-big");
      processProgressImages(project.images, "progress-small", "progress-small");
    }

    // Handle video container visibility
    const videoDesc = document.getElementById("video-description");
    const processVidContainer = document.getElementById("processVidContainer");

    // Update video description if it exists
    if (videoDesc && !isEmpty(project["video-description"])) {
      videoDesc.textContent = project["video-description"];
    } else {
      // Hide the entire video container if there's no description
      if (processVidContainer) {
        processVidContainer.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Error loading project content:", error);
  }
}
