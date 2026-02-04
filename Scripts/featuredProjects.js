// Store project data globally after fetching
let projectsData = null;

// Function to load all project data
async function loadProjects() {
  if (projectsData === null) {
    try {
      console.log("Attempting to fetch projects.json...");
      // Determine the correct path based on current location
      let path = "../Data/projects.json";
      if (window.location.pathname.includes("Pages/FeaturedProjects")) {
        path = "../../Data/projects.json";
      } else if (window.location.pathname.includes("Work")) {
        path = "../Data/projects.json";
      }
      const response = await fetch(path);
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

// Helper function to adjust image paths based on current page location
function adjustImagePath(url) {
  if (!url || typeof url !== "string") return url;
  // If URL starts with ../Assets/, convert to ../../Assets/ for Pages/FeaturedProjects/
  if (window.location.pathname.includes("Pages/FeaturedProjects") && url.startsWith("../Assets/")) {
    return url.replace("../Assets/", "../../Assets/");
  }
  return url;
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
      (p) => p.search && p.search.toLowerCase() === searchTerm.toLowerCase()
    );

    if (!project) {
      console.error("Project not found:", searchTerm);
      return;
    }

    console.log("Found project:", project.title);

    // Update page title
    document.title = `${project.title}`;

    // Populate basic content - map projects.json fields to HTML elements
    const elements = {
      title: project.title,
      tags: Array.isArray(project.tags) 
        ? project.tags.filter((c) => !isEmpty(c)).join(", ")
        : "",
      year: project.year || "",
      "long description": project["long description"] || project["short description"] || "",
      "image-description": project["image description"] || "",
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

    // Add collaborators - map from {name, url} to {text, url}
    const collabElement = document.getElementById("collaborators");
    if (collabElement) {
      if (!isEmpty(project.collaborators)) {
        const validCollabs = project.collaborators.filter(
          (collab) => !isEmpty(collab.name) || !isEmpty(collab.text)
        );
        if (validCollabs.length > 0) {
          const collabText = validCollabs
            .map((collab) => {
              const name = collab.name || collab.text || "";
              const url = collab.url || "";
              return url ? `<a href="${url}" target="_blank">${name}</a>` : name;
            })
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

    // Process images based on type - projects.json uses "image" array with type as array
    if (!isEmpty(project.image)) {
      // Featured images - type array contains "featured"
      const featuredSection = document.querySelector(".featured-image");
      const featuredImages = project.image.filter((img) => {
        if (isEmpty(img.url) || img.url === "../") return false;
        const types = Array.isArray(img.type) ? img.type : (img.type ? [img.type] : []);
        return types.includes("featured");
      });
      
      if (featuredSection && featuredImages.length > 0) {
        featuredSection.innerHTML = "";
        featuredImages.forEach((image) => {
          const container = document.createElement("div");
          container.className = "featured-image-container";
          container.innerHTML = `
            <img src="${adjustImagePath(image.url)}" alt="${image.alt || ""}">
            ${!isEmpty(image.text) ? `<h2>${image.text}</h2>` : ""}
          `;
          featuredSection.appendChild(container);
        });
      } else if (featuredSection) {
        featuredSection.style.display = "none";
      }

      // Final images for slider - type array contains "final"
      const finalImages = project.image.filter((img) => {
        if (isEmpty(img.url) || img.url === "../") return false;
        const types = Array.isArray(img.type) ? img.type : (img.type ? [img.type] : []);
        return types.includes("final");
      });

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
            <img src="${adjustImagePath(image.url)}" alt="${image.alt || ""}">
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
        const filteredImages = images.filter((img) => {
          if (isEmpty(img.url) || img.url === "../") return false;
          const types = Array.isArray(img.type) ? img.type : (img.type ? [img.type] : []);
          return types.includes(containerClass);
        });
        
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
              <img src="${adjustImagePath(image.url)}" alt="${image.alt || ""}">
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

      processProgressImages(project.image, "progress-big", "progress-big");
      processProgressImages(project.image, "progress-small", "progress-small");
    }

    // Handle video container visibility and videos
    const videoDesc = document.getElementById("video-description");
    const processVidContainer = document.getElementById("processVidContainer");
    const videoContainer = document.getElementById("video-container");

    // Process videos
    if (!isEmpty(project.video) && videoContainer) {
      videoContainer.innerHTML = "";
      const videos = Array.isArray(project.video) ? project.video : [];
      
      videos.forEach((video) => {
        let videoUrl = "";
        let videoAlt = "";
        
        // Handle different video formats
        if (typeof video === "string") {
          // Video is a string URL (e.g., Vimeo URL)
          videoUrl = video;
        } else if (video && typeof video === "object") {
          // Video is an object with url property
          videoUrl = video.url || "";
          videoAlt = video.alt || "";
        }
        
        if (!isEmpty(videoUrl) && videoUrl !== "../") {
          // Check if it's a Vimeo URL
          if (videoUrl.includes("vimeo.com")) {
            // Extract Vimeo video ID and convert to embed URL
            const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
            if (vimeoMatch) {
              const videoId = vimeoMatch[1];
              // Get any query parameters from original URL
              const urlParams = new URLSearchParams(videoUrl.split("?")[1] || "");
              const embedUrl = `https://player.vimeo.com/video/${videoId}?${urlParams.toString()}`;
              
              const videoWrapper = document.createElement("div");
              videoWrapper.className = "video-wrapper";
              videoWrapper.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
              videoContainer.appendChild(videoWrapper);
            }
          } else if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
            // Handle YouTube URLs
            let videoId = "";
            if (videoUrl.includes("youtube.com/watch?v=")) {
              videoId = videoUrl.split("v=")[1].split("&")[0];
            } else if (videoUrl.includes("youtu.be/")) {
              videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
            }
            if (videoId) {
              const embedUrl = `https://www.youtube.com/embed/${videoId}`;
              const videoWrapper = document.createElement("div");
              videoWrapper.className = "video-wrapper";
              videoWrapper.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
              videoContainer.appendChild(videoWrapper);
            }
          } else {
            // Local video file
            const videoWrapper = document.createElement("div");
            videoWrapper.className = "video-wrapper";
            const videoElement = document.createElement("video");
            videoElement.src = adjustImagePath(videoUrl);
            videoElement.controls = true;
            if (videoAlt) {
              videoElement.setAttribute("alt", videoAlt);
            }
            videoWrapper.appendChild(videoElement);
            videoContainer.appendChild(videoWrapper);
          }
        }
      });
    }

    // Update video description if it exists
    if (videoDesc && !isEmpty(project["video description"])) {
      videoDesc.textContent = project["video description"];
    }
    
    // Hide the entire video container if there are no videos and no description
    if (processVidContainer) {
      const hasVideos = !isEmpty(project.video) && videoContainer && videoContainer.children.length > 0;
      const hasDescription = !isEmpty(project["video description"]);
      if (!hasVideos && !hasDescription) {
        processVidContainer.style.display = "none";
      } else {
        processVidContainer.style.display = "";
      }
    }
  } catch (error) {
    console.error("Error loading project content:", error);
  }
}
