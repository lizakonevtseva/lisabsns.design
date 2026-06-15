(function () {
  const DRAG_THRESHOLD = 6;
  const MOBILE_BREAKPOINT = 640;
  const CANVAS_BOTTOM_PADDING = 48;

  function isMobileWorkLayout() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
  }

  function fitWorkCanvasHeight(canvas) {
    if (!isMobileWorkLayout()) {
      canvas.style.minHeight = "";
      return;
    }

    let maxBottom = 0;

    canvas.querySelectorAll(".work-item").forEach((item) => {
      maxBottom = Math.max(maxBottom, item.offsetTop + item.offsetHeight);
    });

    const minViewport = canvas.clientHeight;
    canvas.style.minHeight = `${Math.max(maxBottom + CANVAS_BOTTOM_PADDING, minViewport)}px`;
  }

  function initPersonalWork() {
    const canvas = document.getElementById("work-canvas");
    if (!canvas) return;

    fetch("data/personal-work.json")
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить работы");
        return res.json();
      })
      .then((data) => {
        const items = [...data.items].sort(
          (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
        );
        items.forEach((item) => {
          const el = createWorkItem(item, canvas);
          canvas.appendChild(el);

          const img = el.querySelector("img");
          if (img.complete) {
            fitWorkCanvasHeight(canvas);
          } else {
            img.addEventListener("load", () => fitWorkCanvasHeight(canvas));
          }
        });
        createLightbox();
        fitWorkCanvasHeight(canvas);

        window.addEventListener("resize", () => fitWorkCanvasHeight(canvas));
      })
      .catch((err) => console.error(err));
  }

  function createWorkItem(item, canvas) {
    const el = document.createElement("div");
    el.className = "work-item";
    el.dataset.id = item.id;
    el.style.left = `${item.x}%`;
    el.style.top = `${item.y}%`;
    el.style.width = `${item.width}vw`;
    el.style.zIndex = item.zIndex || 1;
    el.style.transform = `rotate(${item.rotate || 0}deg)`;

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.alt || "Personal work";
    img.draggable = false;
    el.appendChild(img);

    enableDrag(el, canvas);
    enableClick(el, item);

    return el;
  }

  function enableDrag(el, canvas) {
    let isDragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;

    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;

      isDragging = true;
      moved = false;
      el.classList.add("is-dragging");
      el.setPointerCapture(e.pointerId);
      bringToFront(el, canvas);

      const rect = el.getBoundingClientRect();
      const parent = canvas.getBoundingClientRect();
      originLeft = rect.left - parent.left;
      originTop = rect.top - parent.top;

      el.style.left = `${originLeft}px`;
      el.style.top = `${originTop}px`;
      el.style.width = `${rect.width}px`;

      startX = e.clientX;
      startY = e.clientY;
    });

    el.addEventListener("pointermove", (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        moved = true;
      }

      el.style.left = `${originLeft + dx}px`;
      el.style.top = `${originTop + dy}px`;
    });

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      el.classList.remove("is-dragging");
      el.dataset.moved = moved ? "1" : "0";
      fitWorkCanvasHeight(canvas);
    }

    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
  }

  function enableClick(el, item) {
    el.addEventListener("click", () => {
      if (el.dataset.moved === "1") {
        el.dataset.moved = "0";
        return;
      }

      if (item.link) {
        window.open(item.link, "_blank", "noopener");
        return;
      }

      openLightbox(el.querySelector("img").src, el.querySelector("img").alt);
    });
  }

  function bringToFront(el, canvas) {
    const items = [...canvas.querySelectorAll(".work-item")];
    const maxZ = items.reduce(
      (max, node) => Math.max(max, parseInt(node.style.zIndex, 10) || 0),
      0
    );
    el.style.zIndex = maxZ + 1;
  }

  let lightbox;

  function createLightbox() {
    lightbox = document.createElement("div");
    lightbox.className = "work-lightbox";
    lightbox.innerHTML = `
      <button class="work-lightbox__close" type="button" aria-label="Закрыть">CLOSE</button>
      <img src="" alt="">
    `;

    document.body.appendChild(lightbox);

    lightbox.querySelector(".work-lightbox__close").addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
  }

  function openLightbox(src, alt) {
    if (!lightbox) return;
    const img = lightbox.querySelector("img");
    img.src = src;
    img.alt = alt;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  document.addEventListener("DOMContentLoaded", initPersonalWork);
})();
