// produto.js

const mainImage = document.querySelector(".product-main-image");
const imageModal = document.getElementById("imageModal");
const imageModalImg = document.getElementById("imageModalImg");
const imageModalClose = document.getElementById("imageModalClose");

function openImageModal() {
  if (!imageModal) return;
  imageModal.classList.add("open");
}

function closeImageModal() {
  if (!imageModal || !imageModalImg) return;
  imageModal.classList.remove("open");
  imageModalImg.src = "";
}

if (mainImage && imageModal && imageModalImg) {
  mainImage.addEventListener("click", () => {
    const fullSrc = mainImage.getAttribute("data-full") || mainImage.src;
    imageModalImg.src = fullSrc;
    imageModalImg.alt = mainImage.alt || "";
    openImageModal();
  });
}

if (imageModalClose) {
  imageModalClose.addEventListener("click", closeImageModal);
}

if (imageModal) {
  imageModal.addEventListener("click", (e) => {
    if (
      e.target === imageModal ||
      e.target.classList.contains("image-modal-backdrop")
    ) {
      closeImageModal();
    }
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && imageModal && imageModal.classList.contains("open")) {
    closeImageModal();
  }
});
