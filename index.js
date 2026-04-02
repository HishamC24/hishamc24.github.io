const aspectToClass = {
  "1:1": "grid-item-1-1",
  "1:2": "grid-item-1-2",
  "2:1": "grid-item-2-1",
  "2:2": "grid-item-2-2",
};

const aspectToSpan = {
  "1:1": { cols: 1, rows: 1 },
  "1:2": { cols: 1, rows: 2 },
  "2:1": { cols: 2, rows: 1 },
  "2:2": { cols: 2, rows: 2 },
};

fetch("Database.json")
  .then((response) => response.json())
  .then((data) => {
    const section = document.getElementById("portfolio-grid");
    data.forEach((item) => {
      const primary = item.primaryImage;
      if (!primary) return;
      const klass = aspectToClass[primary.aspectRatio] || aspectToClass["1:1"];
      const img = document.createElement("img");
      img.className = klass;
      img.src = `Images/${primary.src}`;
      img.alt = primary.description || primary.src;
      if (primary["object-fit"] === "contain") {
        img.style.objectFit = "contain";
      } else {
        img.style.objectFit = "cover";
      }
      section.appendChild(img);
    });
  })
  .catch((err) => {
    console.error("Failed to load images from Database.json", err);
  });


document.getElementById("action-btn").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});