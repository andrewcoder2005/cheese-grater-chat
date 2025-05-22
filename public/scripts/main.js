import { showToast } from "./utilies.js";

document.addEventListener("DOMContentLoaded", () => {
  const linkList = document.getElementById("link-list");
  const form = document.getElementById("link-form");

  async function fetchLinks(searchTerm = "") {
    try {
      let url = "/links";
      if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch links");
      }
      const links = await res.json();
      renderLinks(links);
    } catch (_err) {
      console.error("Error loading links:", _err);
      linkList.innerHTML = `<p style="color: red;">Could not load links.</p>`;
    }
  }

  function renderLinks(links) {
    // Filter out hidden links for this user
    const hiddenLinks = JSON.parse(localStorage.getItem("hiddenLinks") || "[]");
    links = links.filter((l) => !hiddenLinks.includes(l.link_id.toString()));
    linkList.innerHTML = ""; // Clear previous

    if (!Array.isArray(links) || links.length === 0) {
      linkList.innerHTML = "<p>No links posted yet.</p>";
      return;
    }

    // Only show links that match the search if a search is active
    const searchValue = (document.getElementById("searchInput")?.value || "")
      .trim()
      .toLowerCase();
    const filteredLinks = searchValue
      ? links.filter(
          (link) =>
            (link.title && link.title.toLowerCase().includes(searchValue)) ||
            (link.description &&
              link.description.toLowerCase().includes(searchValue))
        )
      : links;

    if (filteredLinks.length === 0) {
      linkList.innerHTML = "<p>No matching posts found.</p>";
      return;
    }
    console.log("Filtered links:", filteredLinks);

    filteredLinks.forEach((link) => {
      const card = document.createElement("div");
      card.className = "link-card";
      card.innerHTML = `
        <h3><a href="${link.url}" target="_blank" rel="noopener noreferrer">${
        link.title
      }</a></h3>
        <p>${link.description || "No description provided."}</p>
        <p>Posted by: ${link.username || "Anonymous"}</p>
        <p>
          <strong>
            Average Rating: <i class="fas fa-star" style="color: gold;"></i>
          </strong>
          <span class="agg-rating">${Number(link.avg_rating).toFixed(2)}</span>
          (${link.rating_count} ratings)
        </p>
        <p>Posted on: ${new Date(link.created_at).toLocaleString()}</p>
        <button class="delete-link-btn" data-id="${
          link.link_id
        }">Delete</button>
        <button class="edit-link-btn" data-id="${link.link_id}">Edit</button>
        <button class="hide-link-btn" data-id="${link.link_id}">Hide</button>
        <div class="rate-section">
          <label for="rate-${link.link_id}">Your Rating:</label>
          <select class="rate-select" data-id="${link.link_id}" id="rate-${
        link.link_id
      }">
            <option value="">Rate</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <button class="rate-btn" data-id="${
            link.link_id
          }">Submit Rating</button>
        </div>
      `;
      linkList.appendChild(card);
    });

    // Hide link button listeners
    const hiddenBtn = document.querySelectorAll(".hide-link-btn");
    hiddenBtn.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const linkId = e.target.getAttribute("data-id");
        const hiddenLinks = JSON.parse(
          localStorage.getItem("hiddenLinks") || "[]"
        );
        if (!hiddenLinks.includes(linkId)) {
          hiddenLinks.push(linkId);
          localStorage.setItem("hiddenLinks", JSON.stringify(hiddenLinks));
        }
        showToast("Link hidden from your view.", true);
        fetchLinks();
      });
    });
    // Delete link button listeners
    const username = localStorage.getItem("username");
    const deleteBtn = document.querySelectorAll(".delete-link-btn");
    deleteBtn.forEach((btn) => {
      const linkId = btn.getAttribute("data-id");
      const link = filteredLinks.find((l) => l.link_id == linkId);
      if (!link || link.username !== username) {
        btn.style.display = "none";
      }
      if (btn.style.display === "none") return;
      btn.addEventListener("click", async (e) => {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          showToast("You must be logged in to delete.", false);
          return;
        }
        const linkId = e.target.getAttribute("data-id");
        try {
          const res = await fetch(`/links/${linkId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": userId,
            },
          });
          if (res.ok) {
            showToast("Delete successfully", true);
            fetchLinks();
          } else {
            showToast("Delete failed", false);
          }
        } catch (err) {
          showToast("Error deleting post.", false);
          console.log(err);
        }
      });
    });
    // Render hidden links section below main list
    renderHiddenLinks();

    // Add event listeners to the rating dropdowns
    // Add edit button listeners
    const editModal = document.getElementById("editModal");
    const closeEditModal = document.getElementById("closeEditModal");
    const editForm = document.getElementById("editForm");
    document.addEventListener("click", function (e) {
      if (e.target.classList.contains("edit-link-btn")) {
        const linkId = e.target.getAttribute("data-id");
        const link = filteredLinks.find((l) => l.link_id == linkId);
        if (link) {
          document.getElementById("editLinkId").value = link.link_id;
          document.getElementById("editTitle").value = link.title;
          document.getElementById("editUrl").value = link.url;
          document.getElementById("editDescription").value =
            link.description || "";
          editModal.classList.remove("hidden");
        }
      }
    });

    closeEditModal.addEventListener("click", () => {
      editModal.classList.add("hidden");
    });

    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const linkId = document.getElementById("editLinkId").value;
      const title = document.getElementById("editTitle").value.trim();
      const url = document.getElementById("editUrl").value.trim();
      const description = document
        .getElementById("editDescription")
        .value.trim();
      const userId = localStorage.getItem("userId");
      if (!userId) {
        showToast("You must be logged in to edit.", false);
        return;
      }
      try {
        const res = await fetch(`/api/links/${linkId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(userId ? { "x-user-id": userId } : {}),
          },
          body: JSON.stringify({ title, url, description }),
        });

        const result = await res.json();
        if (res.ok) {
          showToast("Post updated!", true);
          editModal.classList.add("hidden");
          fetchLinks();
        } else {
          showToast(result.error || "Update failed.", false);
        }
      } catch (_err) {
        showToast("Network error.", false);
      }
    });
    // Add rating button listeners
    document.querySelectorAll(".rate-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const linkId = e.target.getAttribute("data-id");
        const select = document.getElementById(`rate-${linkId}`);
        const score = parseInt(select.value, 10);
        if (!score || score < 1 || score > 5) {
          showToast("Please select a rating from 1 to 5.", false);
          return;
        }
        // Get userId from localStorage
        const userId = localStorage.getItem("userId");
        if (!userId) {
          showToast("You must be logged in to rate.", false);
          return;
        }
        try {
          // Prevent rating your own post
          const link = filteredLinks.find((l) => l.link_id == linkId);
          const username = localStorage.getItem("username");
          if (link && link.username === username) {
            showToast("You can't rate your own post!", false);
            return;
          }
          const res = await fetch(`/links/${linkId}/rate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: parseInt(userId, 10), score }),
          });
          if (res.ok) {
            showToast("Rating submitted!", true);
            // If rating is 4 or 5, add to favorites
            if (score >= 4) {
              try {
                await fetch(`/users/${userId}/favorites`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ linkId: Number(linkId) }),
                });
              } catch (favErr) {
                // Ignore favorite add error, just log
                console.log("Error adding to favorites:", favErr);
              }
            }
            // Update grater points for the logged-in user (fetch from backend)
            await updateGraterPointsUI();
            fetchLinks();
          } else {
            const errorResult = await res.json();
            showToast(
              "Error: " + (errorResult.error || "Unknown error"),
              false
            );
          }
        } catch (_err) {
          showToast("Error submitting rating.", false);
        }
      });
    });
  }

  // Search bar integration
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const value = e.target.value.trim();
      fetchLinks(value);
    });
  }

  fetchLinks();

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const user = JSON.parse(localStorage.getItem("user"));
    const username = localStorage.getItem("username") || "Anonymous";
    const userId = localStorage.getItem("userId") || null;
    console.log("User object:", user);
    console.log("Username:", username);
    console.log("UserId:", userId);
    console.log("Form data:", data);
    // Set default values
    data.username = username;
    data.submitterId = userId ? parseInt(userId, 10) : null;
    data.description = data.description || "";
    data.rating = parseInt(data.rating, 10) || 0;
    data.created_at = new Date().toISOString();
    data.avg_rating = 0;
    data.rating_count = 0;
    data.url = data.url.trim();
    data.title = data.title.trim();
    if (!data.title || !data.url) {
      showToast("Title and URL are required.", false);
      return;
    }
    console.log("submitterId being sent:", data.submitterId);

    try {
      const res = await fetch("/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        showToast("Link submitted successfully!", true);
        form.reset();
        setTimeout(() => {
          globalThis.location.reload();
        }, 2000);
      } else {
        const errorResult = await res.json();
        showToast("Error: " + (errorResult.error || "Unknown error"), false);
        console.error(errorResult.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast("Error submitting form. Please try again.", false);
    }
  });

  // Sorting integration
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (_e) => {
      const value = sortSelect.value;
      const search = (
        document.getElementById("searchInput")?.value || ""
      ).trim();
      let url = `/links?sort=${encodeURIComponent(value)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      fetchLinksFromUrl(url);
    });
  }

  async function fetchLinksFromUrl(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch links");
      const links = await res.json();
      renderLinks(links);
    } catch (_err) {
      linkList.innerHTML = `<p style="color: red;">Could not load links.</p>`;
    }
  }

  // Show/hide favorites section and load favorites
  const favoritesLink = document.getElementById("favoritesLink");
  const favoritesSection = document.getElementById("favorites-section");
  const favoritesList = document.getElementById("favoritesList");

  function renderFavorites(favorites) {
    favoritesList.innerHTML = "";
    if (!favorites.length) {
      favoritesList.innerHTML = "<li>No favorites yet.</li>";
      return;
    }
    favorites.forEach((link) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <a href="${link.url}" target="_blank">${link.title}</a>
        <span style="color: #ffb347; font-weight: bold; margin-left: 0.5rem;">★ ${Number(
          link.avg_rating
        ).toFixed(2)}</span>
      `;
      favoritesList.appendChild(li);
    });
  }

  async function fetchFavorites() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await fetch(`/users/${userId}/favorites`);
      if (!res.ok) throw new Error("Failed to fetch favorites");
      const favorites = await res.json();
      renderFavorites(favorites);
      favoritesSection.style.display = "block";
    } catch (error) {
      favoritesList.innerHTML = "<li>Error loading favorites.</li>";
      favoritesSection.style.display = "block";
      console.log(error);
      showToast("Error loading favorites.", false);
    }
  }

  if (favoritesLink && favoritesSection) {
    favoritesSection.style.display = "none";
    favoritesLink.style.display = "inline";
    favoritesLink.addEventListener("click", (e) => {
      e.preventDefault();
      fetchFavorites();
      favoritesSection.scrollIntoView({ behavior: "smooth" });
    });
  }
  // Unused function, prefix with underscore to satisfy linter
  async function _gainGraterPoint(userId) {
    try {
      const res = await fetch(`/users/${userId}/gainGraterPoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to gain Grater Point");
      const result = await res.json();
      console.log("Grater Point gained:", result);
    } catch (error) {
      console.error("Error gaining Grater Point:", error);
    }
  }

  // Add this function near the bottom of the file
  async function updateGraterPointsUI() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await fetch(`/users/${userId}`);
      if (!res.ok) return;
      const user = await res.json();
      const graterPoints = user.grater_points ?? 0;
      const graterPointsSpan = document.getElementById("graterPoints");
      if (graterPointsSpan) {
        graterPointsSpan.textContent = `🧀 Grater Points: ${graterPoints}`;
        graterPointsSpan.style.display = "inline";
      }
    } catch (e) {
      console.error("Error loading Grater Points:", e);
      showToast("User can't rate themself.", false);
    }
  }

  // On page load, show Grater Points if logged in
  updateGraterPointsUI();
});

function renderHiddenLinks() {
  const hiddenLinks = JSON.parse(localStorage.getItem("hiddenLinks") || "[]");
  let hiddenSection = document.getElementById("hidden-links-section");
  if (!hiddenSection) {
    hiddenSection = document.createElement("section");
    hiddenSection.id = "hidden-links-section";
    hiddenSection.innerHTML = `<h3>Hidden Links</h3><div id="hidden-links-list"></div>`;
    // Place after favorites section if present, else after linkList
    const favoritesSection = document.getElementById("favorites-section");
    if (favoritesSection && favoritesSection.nextSibling) {
      favoritesSection.parentNode.insertBefore(
        hiddenSection,
        favoritesSection.nextSibling
      );
    } else {
      linkList.parentNode.insertBefore(hiddenSection, linkList.nextSibling);
    }
  }
  const hiddenList = hiddenSection.querySelector("#hidden-links-list");
  hiddenList.innerHTML = "";
  if (!hiddenLinks.length) {
    hiddenList.innerHTML = "<p>No hidden links.</p>";
    return;
  }
  // Find all hidden links from the backend
  fetch("/links")
    .then((res) => res.json())
    .then((allLinks) => {
      const hidden = allLinks.filter((l) =>
        hiddenLinks.includes(l.link_id.toString())
      );
      if (!hidden.length) {
        hiddenList.innerHTML = "<p>No hidden links.</p>";
        return;
      }
      hidden.forEach((link) => {
        const div = document.createElement("div");
        div.className = "hidden-link-card";
        div.innerHTML = `
        <h4><a href="${link.url}" target="_blank">${link.title}</a></h4>
        <button class="unhide-link-btn" data-id="${link.link_id}">Unhide</button>
      `;
        hiddenList.appendChild(div);
      });
      // Add listeners for unhide
      hiddenList.querySelectorAll(".unhide-link-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const linkId = e.target.getAttribute("data-id");
          const hiddenLinks = JSON.parse(
            localStorage.getItem("hiddenLinks") || "[]"
          );
          const updatedLinks = hiddenLinks.filter((id) => id !== linkId);
          localStorage.setItem("hiddenLinks", JSON.stringify(updatedLinks));
          showToast("Link unhidden.", true);
          fetchLinks();
          globalThis.location.reload();
          renderHiddenLinks();
        });
      });
    });
}
