(function () {
  function parsePx(value, fallback) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function getDefaultPosition() {
    const root = getComputedStyle(document.documentElement);
    return {
      x: parsePx(root.getPropertyValue("--name-x"), 50),
      y: parsePx(root.getPropertyValue("--name-y"), 5),
    };
  }

  function getPosition(name) {
    const match = name.style.transform.match(
      /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/
    );

    if (match) {
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
    }

    return getDefaultPosition();
  }

  function applyTransform(el, x, y) {
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  function initDraggableName() {
    const name = document.querySelector(".hero__name");
    if (!name) return;

    const isHomeLink =
      document.body.classList.contains("page-info") ||
      document.body.classList.contains("page-work");
    const clickThreshold = 5;

    let isDragging = false;
    let didMove = false;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    let x = 0;
    let y = 0;

    name.addEventListener("dragstart", (e) => e.preventDefault());

    name.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;

      const pos = getPosition(name);
      x = pos.x;
      y = pos.y;

      isDragging = true;
      didMove = false;
      name.classList.add("is-dragging");
      name.setPointerCapture(e.pointerId);

      startX = e.clientX;
      startY = e.clientY;
      originX = x;
      originY = y;
    });

    name.addEventListener("pointermove", (e) => {
      if (!isDragging) return;

      if (
        Math.abs(e.clientX - startX) > clickThreshold ||
        Math.abs(e.clientY - startY) > clickThreshold
      ) {
        didMove = true;
      }

      x = originX + (e.clientX - startX);
      y = originY + (e.clientY - startY);
      applyTransform(name, x, y);
    });

    function endDrag(e) {
      if (!isDragging) return;

      isDragging = false;
      name.classList.remove("is-dragging");

      if (isHomeLink && !didMove) {
        window.location.href = "index.html";
        return;
      }

      console.log(
        `Name position: --name-x: ${Math.round(x)}px; --name-y: ${Math.round(y)}px;`
      );
    }

    name.addEventListener("pointerup", endDrag);
    name.addEventListener("pointercancel", endDrag);

    if (isHomeLink) {
      name.style.cursor = "pointer";
    }
  }

  document.addEventListener("DOMContentLoaded", initDraggableName);
})();
