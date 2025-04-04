// Scroll Animation for Images
document.addEventListener("DOMContentLoaded", function () {
    const images = document.querySelectorAll(".image-box");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.3 });

    images.forEach(image => observer.observe(image));
});
