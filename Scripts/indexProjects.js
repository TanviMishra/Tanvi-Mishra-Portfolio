// Home page: render Work + Sandbox projects in the Sandbox card format (Work first).

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0 && v.trim().toLowerCase() !== "blank";
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function isBlank(v) {
  return !v || String(v).trim() === "" || String(v).trim().toLowerCase() === "blank";
}

function normalizeProjectForCard(project, workDetailHrefBySearch) {
  // Convert projects.json schema into the card renderer format.
  const search = project.search;
  const detailHref = search && !isBlank(search) ? workDetailHrefBySearch[String(search).toLowerCase()] : null;

  const collaborators = safeArray(project.collaborators)
    .filter((c) => c && isNonEmptyString(c.name || c.text))
    .map((c) => ({ name: c.name || c.text || "", url: isNonEmptyString(c.url) ? c.url : "" }));

  // Listing cards: show gallery images only
  const images = safeArray(project.image)
    .filter((img) => img && img.url && img.url !== "blank")
    .filter((img) => {
      const types = Array.isArray(img.type) ? img.type : (img.type ? [img.type] : []);
      return types.includes("gallery");
    })
    .slice(0, 12);

  const projectType = project["project type"] || "experiment";
  
  return {
    source: detailHref ? "work" : "sandbox",
    title: project.title || "",
    year: project.year || "",
    tags: safeArray(project.tags).filter(isNonEmptyString),
    "short description": project["short description"] || project.brief || project["long description"] || "",
    links: safeArray(project.links).filter((l) => l && isNonEmptyString(l.url) && isNonEmptyString(l.text)),
    collaborators,
    resources: safeArray(project.resources),
    image_gallery: project.image_gallery || "triple",
    images,
    detailHref: projectType === "featured" ? detailHref : null, // Only allow links if featured
    search,
    projectType: projectType,
    archived: projectType === "archived",
  };
}

// Helper function to create list HTML
function createListHTML(items, className, label, formatItem) {
  if (!items || items.length === 0) return "";
  const content = items.map(formatItem).filter(Boolean).join(className === "links" ? "<br>" : ", ");
  return content ? `<div class="${className}">${label ? `<p class="underline">${label}:</p>` : ""}${content}</div>` : "";
}

function createProjectSection(project) {
  const section = document.createElement("section");
  section.className = "flex-column";

  const linksList = createListHTML(
    project.links,
    "links",
    "",
    (link) => `<a href="${link.url}">${link.text} &#8599;</a>`
  );

  const collaboratorsList = createListHTML(
    project.collaborators,
    "collaborators",
    "Collaborators",
    (collab) => {
      const name = collab.name || collab.text || "";
      if (!isNonEmptyString(name)) return "";
      return collab.url ? `<a href="${collab.url}">${name}</a>` : name;
    }
  );

  const resourceList = createListHTML(
    project.resources,
    "collaborators",
    "Resources",
    (r) => `<a href="${r.url}">${r.text} &#8599;</a>`
  );

  const titleHtml = isNonEmptyString(project.title) ? project.title : "";
  const titleSection = titleHtml
    ? project.projectType === "featured" && project.detailHref
      ? `<h2><a href="${project.detailHref}">${titleHtml} &#8594;</a></h2>`
      : `<h2>${titleHtml}</h2>`
    : "";

  const mediaContent = (project.images || [])
    .map((img) => `<img src="${img.url}" alt="${img.alt || ""}" class="gallery-img">`)
    .join("");

  const galleryClass = project.image_gallery === "single" ? "single-grid" : 
                       project.image_gallery === "double" ? "double-grid" : "triple-grid";

  section.innerHTML = `
    <article class="flex-responsive project-card">
        <div class="column1">
            ${titleSection}
            <p>${project.year || ""}</p>
            <p class="classification">${safeArray(project.tags).join(", ")}</p>
            ${linksList}
            ${resourceList}
        </div>
        <div class="column2">
            <p>${project["short description"] || ""}</p>
            ${collaboratorsList}
        </div>
        <div class="column4 img-gallery ${galleryClass}">
            ${mediaContent}
        </div>
    </article>
  `;

  // Lightbox behavior for images
  const images = section.querySelectorAll(".gallery-img");
  images.forEach((img) => {
    img.addEventListener("click", () => {
      const fullscreenContainer = document.createElement("div");
      fullscreenContainer.className = "fullscreen-container";
      const fullscreenImage = document.createElement("img");
      fullscreenImage.src = img.src;
      fullscreenImage.className = "fullscreen-image";
      fullscreenContainer.addEventListener("click", () => fullscreenContainer.remove());
      fullscreenContainer.appendChild(fullscreenImage);
      document.body.appendChild(fullscreenContainer);
    });
  });

  return section;
}

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return await res.json();
}

// Store combined data globally so tags can filter
let projectsData = [];

function createTags(projects) {
  const tagsSection = document.getElementById("tags");
  if (!tagsSection) return;
  tagsSection.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.textContent = "All Work";
  allButton.addEventListener("click", () => filterProjects("all"));
  tagsSection.appendChild(allButton);

  // Include tags from featured and experiment projects
  const activeProjects = projects.filter((p) => p.projectType === "featured" || p.projectType === "experiment");
  const uniqueTags = [
    ...new Set(safeArray(activeProjects).flatMap((project) => safeArray(project.tags))),
  ].filter(isNonEmptyString);

  uniqueTags.forEach((tag) => {
    const button = document.createElement("button");
    button.textContent = tag;
    button.addEventListener("click", () => {
      window.scrollTo(0, 0);
      filterProjects(tag);
    });
    tagsSection.appendChild(button);
  });
}

function filterProjects(tag) {
  const featuredContainer = document.getElementById("featured-projects-container");
  const experimentsContainer = document.getElementById("experiments-projects-container");
  const experimentsSection = document.getElementById("experiments-section");
  const archivedContainer = document.getElementById("archived-projects-container");
  const archivedSection = document.getElementById("archived-section");
  if (!featuredContainer) return;
  
  featuredContainer.innerHTML = "";
  if (experimentsContainer) experimentsContainer.innerHTML = "";
  if (archivedContainer) archivedContainer.innerHTML = "";

  // Filter projects based on tag
  const allFilteredProjects =
    tag === "all"
      ? projectsData
      : projectsData.filter((project) => safeArray(project.tags).includes(tag));

  // Separate by project type
  const featuredProjects = allFilteredProjects.filter((project) => project.projectType === "featured");
  const experimentProjects = allFilteredProjects.filter((project) => project.projectType === "experiment");
  const archivedProjects = tag === "all" 
    ? allFilteredProjects.filter((project) => project.projectType === "archived")
    : [];

  // Display featured projects
  featuredProjects.forEach((project) =>
    featuredContainer.appendChild(createProjectSection(project))
  );

  // Show/hide experiments section based on filter
  if (experimentsSection) {
    if (experimentProjects.length > 0) {
      experimentsSection.style.display = "block";
      // Keep experiments visible by default (don't hide when switching filters)
      if (experimentsContainer) {
        experimentsContainer.classList.remove("hidden");
        const toggleButton = document.getElementById("toggle-experiments");
        if (toggleButton) {
          toggleButton.textContent = "Experiments";
        }
      }
    } else {
      experimentsSection.style.display = "none";
    }
  }

  // Display experiment projects if container exists
  if (experimentsContainer && experimentProjects.length > 0) {
    experimentProjects.forEach((project) =>
      experimentsContainer.appendChild(createProjectSection(project))
    );
  }

  // Show/hide archived section based on filter
  if (archivedSection) {
    if (tag === "all" && archivedProjects.length > 0) {
      archivedSection.style.display = "block";
      // Reset archived container to hidden state when switching filters
      if (archivedContainer) {
        archivedContainer.classList.add("hidden");
        const toggleButton = document.getElementById("toggle-archived");
        if (toggleButton) {
          toggleButton.textContent = "Archive";
          toggleButton.blur();
        }
      }
    } else {
      archivedSection.style.display = "none";
    }
  }

  // Display archived projects if container exists and we're showing all
  if (archivedContainer && archivedProjects.length > 0) {
    archivedProjects.forEach((project) =>
      archivedContainer.appendChild(createProjectSection(project))
    );
  }
}

function toggleExperimentsProjects() {
  const experimentsContainer = document.getElementById("experiments-projects-container");
  const toggleButton = document.getElementById("toggle-experiments");
  if (!experimentsContainer || !toggleButton) return;

  const isHidden = experimentsContainer.classList.contains("hidden");
  if (isHidden) {
    experimentsContainer.classList.remove("hidden");
    toggleButton.focus();
  } else {
    experimentsContainer.classList.add("hidden");
    toggleButton.blur();
  }
}

function toggleArchivedProjects() {
  const archivedContainer = document.getElementById("archived-projects-container");
  const toggleButton = document.getElementById("toggle-archived");
  if (!archivedContainer || !toggleButton) return;

  const isHidden = archivedContainer.classList.contains("hidden");
  if (isHidden) {
    archivedContainer.classList.remove("hidden");
    toggleButton.focus();
  } else {
    archivedContainer.classList.add("hidden");
    toggleButton.blur();
  }
}

async function initHome() {
  const featuredContainer = document.getElementById("featured-projects-container");
  if (!featuredContainer) return;

  // Map work "search" keys to existing detail HTML pages.
  // (These are the pages in `/Work/*.html` that call `loadProjectContent("<search>")`.)
  const workDetailHrefBySearch = {
    xrrnd: "/Pages/FeaturedProjects/XRRnD.html",
    tridal: "/Pages/FeaturedProjects/tridal.html",
    neo: "/Pages/FeaturedProjects/neo-TCH 1.3.html",
    sfpc: "/Pages/FeaturedProjects/sfpc.html",
    forestclearing: "/Pages/FeaturedProjects/forest clearing.html",
    cssoch: "/Pages/FeaturedProjects/cssoch.html",
  };

  try {
    const all = await loadJson("./Data/projects.json");

    const normalized = safeArray(all).map((p) =>
      normalizeProjectForCard(p, workDetailHrefBySearch)
    );

    // Home ordering: work (has search + detail page) first, then sandbox.
    // Also separate archived projects to the end
    projectsData = normalized.sort((a, b) => {
      // Archived projects go to the end
      if (a.projectType === "archived" && b.projectType !== "archived") return 1;
      if (a.projectType !== "archived" && b.projectType === "archived") return -1;
      // Within same archive status, work projects first
      const aIsWork = !isBlank(a.search) && !!a.detailHref;
      const bIsWork = !isBlank(b.search) && !!b.detailHref;
      return Number(bIsWork) - Number(aIsWork);
    });

    createTags(projectsData);
    filterProjects("all");

    // Set up experiments toggle button
    const experimentsToggleButton = document.getElementById("toggle-experiments");
    const experimentsSection = document.getElementById("experiments-section");
    if (experimentsToggleButton) {
      experimentsToggleButton.addEventListener("click", toggleExperimentsProjects);
      // Check if there are any experiment projects
      const hasExperiments = projectsData.some((p) => p.projectType === "experiment");
      if (!hasExperiments && experimentsSection) {
        experimentsSection.style.display = "none";
      }
    }

    // Set up archived toggle button
    const archivedToggleButton = document.getElementById("toggle-archived");
    const archivedSection = document.getElementById("archived-section");
    if (archivedToggleButton) {
      archivedToggleButton.addEventListener("click", toggleArchivedProjects);
      // Check if there are any archived projects
      const hasArchived = projectsData.some((p) => p.projectType === "archived");
      if (!hasArchived && archivedSection) {
        archivedSection.style.display = "none";
      }
    }
  } catch (e) {
    console.error("Failed to render home projects:", e);
    const featuredContainer = document.getElementById("featured-projects-container");
    if (featuredContainer) {
      featuredContainer.innerHTML =
        "<p>Sorry—projects couldn't be loaded right now. Please refresh.</p>";
    }
  }
}

document.addEventListener("DOMContentLoaded", initHome);
