import { useState, useEffect } from "react";
import "./App.css";

const API_KEY = import.meta.env.VITE_CAT_API_KEY;

export default function App() {
  const [cat, setCat] = useState(null);
  const [banList, setBanList] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bgCats, setBgCats] = useState([]);

  useEffect(() => {
    const loadBgCats = async () => {
      try {
        const res = await fetch(
          "https://api.thecatapi.com/v1/images/search?limit=10&has_breeds=1",
          { headers: { "x-api-key": API_KEY } }
        );
        const data = await res.json();
        setBgCats(data.map((c) => c.url));
      } catch (e) {
        console.error("BG fetch failed", e);
      }
    };
    loadBgCats();
  }, []);

  const fetchCat = async () => {
    setLoading(true);
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      try {
        const res = await fetch(
          "https://api.thecatapi.com/v1/images/search?has_breeds=1",
          { headers: { "x-api-key": API_KEY } }
        );
        const data = await res.json();
        const item = data[0];

        if (!item || !item.breeds || item.breeds.length === 0) {
          attempts++;
          continue;
        }

        const breed = item.breeds[0];
        const origin = breed.origin || "Unknown";
        const weight = breed.weight?.imperial
          ? `${breed.weight.imperial} lbs`
          : "Unknown";
        const lifeSpan = breed.life_span ? `${breed.life_span} years` : "Unknown";
        const breedName = breed.name || "Unknown";

        const allAttrs = [breedName, origin, weight, lifeSpan];
        const isBanned = allAttrs.some((attr) => banList.includes(attr));

        if (!isBanned) {
          const newCat = {
            id: item.id,
            name: randomCatName(),
            imageUrl: item.url,
            breed: breedName,
            weight,
            origin,
            lifeSpan,
          };
          setCat(newCat);
          setHistory((prev) => [newCat, ...prev]);
          setLoading(false);
          return;
        }

        attempts++;
      } catch (e) {
        console.error("Fetch error", e);
        attempts++;
      }
    }

    alert("Too many attributes banned! Try removing some from the ban list.");
    setLoading(false);
  };

  const randomCatName = () => {
    const names = [
      "Whiskers", "Luna", "Oliver", "Bella", "Kitty", "Max", "Mittens",
      "Shadow", "Simba", "Nala", "Tiger", "Cleo", "Leo", "Mochi", "Pumpkin",
      "Biscuit", "Cheddar", "Pepper", "Ginger", "Oreo",
    ];
    return names[Math.floor(Math.random() * names.length)];
  };

  const toggleBan = (attr) => {
    setBanList((prev) =>
      prev.includes(attr) ? prev.filter((b) => b !== attr) : [...prev, attr]
    );
  };

  const isAttributeBanned = (attr) => banList.includes(attr);

  return (
    <div className="app">
      <div className="bg-mosaic">
        {Array.from({ length: 8 }).flatMap((_, repeatIdx) =>
          bgCats.map((url, i) => (
            <img key={`${repeatIdx}-${i}`} src={url} alt="" className="bg-tile" />
          ))
        )}
      </div>
      <div className="bg-overlay" />

      <div className="main-panel">
        <header className="header">
          <h1 className="title">Veni Vici!</h1>
          <p className="subtitle">Discover cats from your wildest dreams!</p>
          <div className="cat-emojis">🐱😺🙀😸🐾😻😿😾</div>
        </header>

        {cat && (
          <div className="cat-card">
            <h2 className="cat-name">{cat.name}</h2>
            <div className="attributes">
              {[
                { label: cat.breed, key: "breed" },
                { label: cat.weight, key: "weight" },
                { label: cat.origin, key: "origin" },
                { label: cat.lifeSpan, key: "lifeSpan" },
              ].map(({ label, key }) => (
                <button
                  key={key}
                  className={`attr-btn ${isAttributeBanned(label) ? "banned" : ""}`}
                  onClick={() => toggleBan(label)}
                >
                  {label}
                </button>
              ))}
            </div>
            <img src={cat.imageUrl} alt={cat.name} className="cat-image" />
          </div>
        )}

        <button
          className={`discover-btn ${loading ? "loading" : ""}`}
          onClick={fetchCat}
          disabled={loading}
        >
          {loading ? (
            <><span className="spinner" /> Searching...</>
          ) : (
            <><span>⇄</span> Discover!</>
          )}
        </button>

        {history.length > 1 && (
          <div className="history-section">
            <h3 className="history-title">Previously Seen</h3>
            <div className="history-grid">
              {history.slice(1).map((h, i) => (
                <div key={i} className="history-item">
                  <img src={h.imageUrl} alt={h.name} className="history-img" />
                  <span className="history-breed">{h.breed}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="ban-sidebar">
        <h2 className="ban-title">Ban List</h2>
        {banList.length === 0 ? (
          <p className="ban-empty">Select an attribute in your listing to ban it</p>
        ) : (
          <div className="ban-items">
            {banList.map((item) => (
              <button
                key={item}
                className="ban-item"
                onClick={() => toggleBan(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}