const API = "https://dummyjson.com/products";
const PAGE_SIZE = 12;
let products = [];
let filteredProducts = [];
let currentPage = 1;
let searchTimer;

const grid = document.getElementById("productGrid");
const statusBox = document.getElementById("status");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const sortSelect = document.getElementById("sortSelect");
const resultCount = document.getElementById("resultCount");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const dialog = document.getElementById("productDialog");

async function loadProducts() {
  setStatus("Loading the collection…");
  try {
    const [productResponse, categoryResponse] = await Promise.all([
      fetch(`${API}?limit=0`),
      fetch(`${API}/category-list`)
    ]);
    if (!productResponse.ok || !categoryResponse.ok) throw new Error("The API returned an error.");
    const productData = await productResponse.json();
    const categories = await categoryResponse.json();
    products = productData.products || [];
    categorySelect.innerHTML = '<option value="">All categories</option>' +
      categories.map(category => `<option value="${escapeHTML(category)}">${formatCategory(category)}</option>`).join("");
    applyFilters();
  } catch (error) {
    setStatus("Could not load products. Check your internet connection and refresh the page.", true);
    console.error(error);
  }
}

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.className = isError ? "status error" : "status";
  statusBox.hidden = false;
}

function applyFilters() {
  const term = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  filteredProducts = products.filter(product => {
    const matchesTerm = !term || `${product.title} ${product.description} ${product.brand || ""}`.toLowerCase().includes(term);
    const matchesCategory = !category || product.category === category;
    return matchesTerm && matchesCategory;
  });

  const sort = sortSelect.value;
  if (sort === "price-asc") filteredProducts.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filteredProducts.sort((a, b) => b.price - a.price);
  if (sort === "rating-desc") filteredProducts.sort((a, b) => b.rating - a.rating);
  if (sort === "title-asc") filteredProducts.sort((a, b) => a.title.localeCompare(b.title));

  currentPage = 1;
  renderProducts();
}

function renderProducts() {
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filteredProducts.slice(start, start + PAGE_SIZE);
  resultCount.textContent = `${filteredProducts.length} products`;
  statusBox.hidden = filteredProducts.length > 0;
  if (!filteredProducts.length) setStatus("No products found. Try another search or category.");

  grid.innerHTML = visible.map(product => `
    <article class="product-card" tabindex="0" role="button" aria-label="View ${escapeHTML(product.title)} details" data-id="${product.id}">
      <div class="product-image">
        <span class="product-tag">${escapeHTML(formatCategory(product.category))}</span>
        <img src="${escapeHTML(product.thumbnail)}" alt="${escapeHTML(product.title)}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-category">${escapeHTML(product.brand || formatCategory(product.category))}</div>
        <h3 class="product-title">${escapeHTML(product.title)}</h3>
        <div class="product-bottom">
          <span class="price">$${Number(product.price).toFixed(2)}</span>
          <span class="rating"><b>★</b> ${Number(product.rating).toFixed(1)}</span>
        </div>
      </div>
    </article>`).join("");

  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function showProduct(id) {
  const product = products.find(item => item.id === Number(id));
  if (!product) return;
  document.getElementById("dialogContent").innerHTML = `
    <div class="dialog-layout">
      <div class="dialog-image"><img src="${escapeHTML(product.thumbnail)}" alt="${escapeHTML(product.title)}"></div>
      <div class="dialog-copy">
        <div class="product-category">${escapeHTML(formatCategory(product.category))}</div>
        <h2>${escapeHTML(product.title)}</h2>
        <p>${escapeHTML(product.description)}</p>
        <div class="dialog-price">$${Number(product.price).toFixed(2)}</div>
        <div class="detail-meta">★ ${Number(product.rating).toFixed(1)} rating<br>Brand: ${escapeHTML(product.brand || "Not specified")}<br>Stock: ${Number(product.stock)} units</div>
        <div class="detail-note">Demo data supplied by DummyJSON — not a real purchasable listing.</div>
      </div>
    </div>`;
  dialog.showModal();
}

function formatCategory(value) {
  return String(value).replaceAll("-", " ").replace(/\b\w/g, char => char.toUpperCase());
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 180);
});
categorySelect.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);
prevBtn.addEventListener("click", () => { if (currentPage > 1) { currentPage--; renderProducts(); } });
nextBtn.addEventListener("click", () => {
  if (currentPage < Math.ceil(filteredProducts.length / PAGE_SIZE)) { currentPage++; renderProducts(); }
});
grid.addEventListener("click", event => {
  const card = event.target.closest(".product-card");
  if (card) showProduct(card.dataset.id);
});
grid.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches(".product-card")) {
    event.preventDefault(); showProduct(event.target.dataset.id);
  }
});
document.getElementById("dialogClose").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault(); searchInput.focus();
  }
});

loadProducts();