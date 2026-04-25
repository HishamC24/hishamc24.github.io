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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.style.opacity = "1";
          observer.unobserve(target);
        }
      });
    }, {
      threshold: 0.1
    });

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
      // Set up fade-in effect (but only trigger when in viewport)
      img.style.opacity = "0";
      img.style.transition = "opacity 1s";
      section.appendChild(img);

      // Use IntersectionObserver to fade in when visible
      observer.observe(img);

      // If the image is cached, it may be instantly visible,
      // So if already in viewport at append, force check
      if (img.complete) {
        // This will be handled soon by IntersectionObserver. If you want instant check:
        setTimeout(() => {
          if (img.getBoundingClientRect().top < window.innerHeight && img.getBoundingClientRect().bottom > 0) {
            img.style.opacity = "1";
            observer.unobserve(img);
          }
        }, 1);
      }
    });
  })
  .catch((err) => {
    console.error("Failed to load images from Database.json", err);
  });

document.getElementById("action-btn").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

new Vivus('HandwrittenName', {
  type: 'oneByOne',
  duration: 200,
  animTimingFunction: Vivus.EASE,
  start: 'autostart'
}, function (myVivus) {
  setTimeout(function () {
    if (myVivus.getStatus() === 'end') {
      setTimeout(function () {
        myVivus.play(-1);
      }, 1000);
    } else {
      myVivus.play(1);
    }
  }, 200);
});