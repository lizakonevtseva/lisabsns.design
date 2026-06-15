(function () {
  const EMAIL = "liza.konevtseva@gmail.com";

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".info-contact__email").forEach((link) => {
      link.href = `mailto:${EMAIL}`;

      link.addEventListener("click", () => {
        window.location.href = `mailto:${EMAIL}`;
      });
    });
  });
})();
