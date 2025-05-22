import React, { useEffect, useState } from "react";
import axios from "axios";
import "../public/css/style.css";
import { showToast } from "../public/scripts/utilies.js";
export default function LinkList() {
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    fetchLinks();
  }, [search, sort]);

  async function fetchLinks() {
    setLoading(true);
    let url = `/links?sort=${sort}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    try {
      const res = await axios.get(url);
      const data = Array.isArray(res.data) ? res.data : [];
      setLinks(data);
    } catch (e) {
      showToast("Could not load links.");
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(linkId, linkUsername) {
    if (!user || user.username !== linkUsername) {
      showToast("You can only delete your own post.");
      return;
    }
    try {
      await axios.delete(`/links/${linkId}`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });
      showToast("Delete successfully", true);
      fetchLinks();
    } catch (e) {
      showToast("Delete failed");
    }
  }

  return (
    <div id="root" style={{ minHeight: "100vh", background: "#fef9c3" }}>
      <header className="navbar">
        <h1 className="site-title">🧀 Cheese Grater Chat</h1>
        <div className="search-bar">
          <i className="fa fa-search"></i>
          <input
            type="text"
            id="searchInput"
            placeholder="Search posts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <nav className="nav-links">
          {user ? (
            <>
              <span id="profileInfo">👤 {user.username}</span>
              <button id="logoutBtn" onClick={() => { localStorage.removeItem("user"); window.location.reload(); }}>Logout</button>
            </>
          ) : (
            <>
              <a href="/login" id="loginLink">Login</a>
              <a href="/register" id="registerLink">Register</a>
            </>
          )}
        </nav>
      </header>
      <main className="main-layout" style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: "2rem", width: "100%", padding: "2rem", marginTop: "2rem" }}>
        <section id="link-list" className="url-list">
          {loading ? (
            <p>Loading...</p>
          ) : links.length === 0 ? (
            <p>No links posted yet.</p>
          ) : (
            links.map(link => (
              <div key={link.link_id} className="post-card">
                <h3>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.title}
                  </a>
                </h3>
                <p>{link.description || "No description provided."}</p>
                <p>Posted by: {link.username || "Anonymous"}</p>
                <p>
                  <strong>
                    Average Rating: <i className="fas fa-star" style={{ color: "gold" }}></i>
                  </strong>{" "}
                  <span className="agg-rating">{Number(link.avg_rating).toFixed(2)}</span> ({link.rating_count} ratings)
                </p>
                <p>Posted on: {new Date(link.created_at).toLocaleString()}</p>
                {user && user.username === link.username && (
                  <button className="delete-link-btn" onClick={() => handleDelete(link.link_id, link.username)}>
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </section>
        <aside className="right-panel">
          <section id="sort-controls">
            <label htmlFor="sortSelect">Sort by:</label>
            <select id="sortSelect" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
            </select>
          </section>
        </aside>
      </main>
    </div>
  );
}
