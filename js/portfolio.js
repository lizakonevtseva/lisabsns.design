(function () {
  const SCROLL_DURATION = 750;
  const AUTO_INTERVAL = 2000;
  const AUTO_START_MIN = 2000;
  const AUTO_START_MAX = 8000;
  const MOBILE_BREAKPOINT = 900;

  function getFrameWidth(frame) {
    return Math.max(Math.round(frame.clientWidth), 1);
  }

  function isMobileLayout() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
  }

  const portfolioAutoplay = {
    enabled: true,
    hoverCount: 0,
    timer: null,
    controllers: [],
  };

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function clearGlobalAutoplay() {
    if (portfolioAutoplay.timer) {
      clearTimeout(portfolioAutoplay.timer);
      portfolioAutoplay.timer = null;
    }
  }

  function getRandomDelay(min = AUTO_INTERVAL, max = AUTO_INTERVAL) {
    return min + Math.random() * (max - min);
  }

  function getEligibleControllers() {
    return portfolioAutoplay.controllers.filter((controller) =>
      controller.canAutoAdvance()
    );
  }

  function tickGlobalAutoplay() {
    portfolioAutoplay.timer = null;

    if (portfolioAutoplay.enabled && portfolioAutoplay.hoverCount === 0) {
      const eligible = getEligibleControllers();

      if (eligible.length) {
        const randomIndex = Math.floor(Math.random() * eligible.length);
        eligible[randomIndex].goNext();
      }
    }

    if (portfolioAutoplay.enabled) {
      scheduleGlobalAutoplay(AUTO_INTERVAL);
    }
  }

  function scheduleGlobalAutoplay(delay = AUTO_INTERVAL) {
    clearGlobalAutoplay();
    portfolioAutoplay.timer = setTimeout(tickGlobalAutoplay, delay);
  }

  function startGlobalAutoplay(useRandomStart = false) {
    if (!portfolioAutoplay.enabled || portfolioAutoplay.hoverCount > 0) return;

    const delay = useRandomStart
      ? getRandomDelay(AUTO_START_MIN, AUTO_START_MAX)
      : AUTO_INTERVAL;

    scheduleGlobalAutoplay(delay);
  }

  function stopGlobalAutoplay() {
    clearGlobalAutoplay();
  }

  function disablePortfolioAutoplay() {
    portfolioAutoplay.enabled = false;
    stopGlobalAutoplay();
  }

  function formatTags(tags) {
    return tags
      .map((tag, index) => {
        const prefix = index === 0 ? "* " : "";
        const suffix = index < tags.length - 1 ? "," : "";
        return `<span>${prefix}${tag}${suffix}</span>`;
      })
      .join("");
  }

  function createProjectItem(project) {
    const item = document.createElement("article");
    item.className = "home-portfolio-item";
    item.dataset.project = project.id;

    const images = project.images
      .map(
        (src, index) =>
          `<img src="${src}" alt="${project.title} — ${index + 1}" draggable="false">`
      )
      .join("");

    item.innerHTML = `
      <div class="home-portfolio-item__inner">
        <aside class="home-portfolio__meta">
          <div class="home-portfolio__header">
            <span>${project.id} PROJECT</span>
            <span>${project.title}</span>
            <span>(${project.year})</span>
          </div>
          <div class="home-portfolio__tags">${formatTags(project.tags)}</div>
        </aside>
        <div class="home-portfolio">
          <div class="home-portfolio__frame">
            <div class="home-portfolio__track">${images}</div>
          </div>
        </div>
      </div>
    `;

    return item;
  }

  function alignPortfolioScroll() {
    const photo = document.querySelector(".hero__photo");
    const scroll = document.getElementById("portfolio-scroll");
    if (!scroll) return;

    scroll.style.top = "0";

    if (isMobileLayout() || !photo) {
      scroll.style.paddingTop = "0";
      return;
    }

    scroll.style.paddingTop = `${photo.getBoundingClientRect().top}px`;
  }

  function scrollToLatestProject(scroll) {
    scroll.scrollTop = 0;
  }

  function initFrameCarousel(frame) {
    const track = frame.querySelector(".home-portfolio__track");
    if (!track) return;

    const slides = [...track.querySelectorAll("img")];
    if (!slides.length) return;

    if (slides.length > 1) {
      const firstClone = slides[0].cloneNode(true);
      const lastClone = slides[slides.length - 1].cloneNode(true);

      firstClone.setAttribute("aria-hidden", "true");
      lastClone.setAttribute("aria-hidden", "true");

      track.insertBefore(lastClone, slides[0]);
      track.appendChild(firstClone);
    }

    const slideCount = slides.length;
    let isScrolling = false;
    let animationId = null;

    function getPosition() {
      return Math.round(frame.scrollLeft / getFrameWidth(frame));
    }

    function scrollToPosition(position, instant = false) {
      const frameWidth = getFrameWidth(frame);
      const target = position * frameWidth;
      const start = frame.scrollLeft;
      const distance = target - start;

      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }

      if (instant || distance === 0) {
        frame.scrollLeft = target;
        resetPositionIfNeeded();
        return;
      }

      isScrolling = true;
      const startTime = performance.now();

      function animate(now) {
        const progress = Math.min((now - startTime) / SCROLL_DURATION, 1);
        frame.scrollLeft = start + distance * easeInOutCubic(progress);

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          animationId = null;
          resetPositionIfNeeded();
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    function resetPositionIfNeeded() {
      const position = getPosition();

      if (position === 0) {
        scrollToPosition(slideCount, true);
        return;
      }

      if (position === slideCount + 1) {
        scrollToPosition(1, true);
        return;
      }

      isScrolling = false;
    }

    function goNext() {
      if (isScrolling || slideCount <= 1) return;
      scrollToPosition(getPosition() + 1);
    }

    function goPrev() {
      if (isScrolling || slideCount <= 1) return;
      scrollToPosition(getPosition() - 1);
    }

    function updateCursor(e) {
      if (slideCount <= 1 || isScrolling) return;

      const rect = frame.getBoundingClientRect();
      const isRightHalf = e.clientX - rect.left > rect.width / 2;

      frame.classList.toggle("is-next", isRightHalf);
      frame.classList.toggle("is-prev", !isRightHalf);
    }

    portfolioAutoplay.controllers.push({
      goNext,
      canAutoAdvance() {
        return slideCount > 1 && !isScrolling;
      },
    });

    scrollToPosition(1, true);

    frame.addEventListener("mouseenter", () => {
      portfolioAutoplay.hoverCount += 1;
      stopGlobalAutoplay();
    });

    frame.addEventListener("mousemove", updateCursor);
    frame.addEventListener("mouseleave", () => {
      portfolioAutoplay.hoverCount = Math.max(0, portfolioAutoplay.hoverCount - 1);
      frame.classList.remove("is-next");
      frame.classList.remove("is-prev");
      startGlobalAutoplay();
    });

    frame.addEventListener("click", (e) => {
      disablePortfolioAutoplay();

      const rect = frame.getBoundingClientRect();
      const isRightHalf = e.clientX - rect.left > rect.width / 2;

      if (isRightHalf) {
        goNext();
      } else {
        goPrev();
      }
    });
  }

  function loadProjects() {
    return fetch("data/projects.json")
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить проекты");
        return res.json();
      })
      .then((data) => data.projects)
      .catch(() => {
        if (window.__PORTFOLIO_DATA__?.projects) {
          return window.__PORTFOLIO_DATA__.projects;
        }

        throw new Error("Не удалось загрузить проекты");
      });
  }

  function initPortfolio() {
    const scroll = document.getElementById("portfolio-scroll");
    if (!scroll) return;

    const heroPhoto = document.querySelector(".hero__photo img");

    alignPortfolioScroll();
    window.addEventListener("resize", alignPortfolioScroll);

    if (heroPhoto) {
      if (heroPhoto.complete) {
        alignPortfolioScroll();
      } else {
        heroPhoto.addEventListener("load", alignPortfolioScroll);
      }
    }

    loadProjects()
      .then((projects) => {
        [...projects].reverse().forEach((project) => {
          scroll.appendChild(createProjectItem(project));
        });

        scroll.querySelectorAll(".home-portfolio__frame").forEach(initFrameCarousel);
        scrollToLatestProject(scroll);
        startGlobalAutoplay(true);
      })
      .catch((err) => console.error(err));
  }

  document.addEventListener("DOMContentLoaded", initPortfolio);
})();
