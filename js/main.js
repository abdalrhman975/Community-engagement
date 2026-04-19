"use strict";

const schoolsContainer = document.getElementById("schools-container");
const searchInput = document.getElementById("search-input");
const feedback = document.getElementById("feedback");
const totalNeededEl = document.getElementById("total-needed");
const totalCollectedEl = document.getElementById("total-collected");
const totalRemainingEl = document.getElementById("total-remaining");

const FAVORITES_KEY = "favoriteSchools";
let schoolsData = [];

const currencyFormatter = new Intl.NumberFormat("ar", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function formatMoney(value) {
  return currencyFormatter.format(value);
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function setFavorites(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function renderGlobalStats(schools) {
  const totalNeeded = schools.reduce((sum, s) => sum + s.total_cost, 0);
  const totalCollected = schools.reduce((sum, s) => sum + s.collected_funds, 0);
  const totalRemaining = Math.max(totalNeeded - totalCollected, 0);

  totalNeededEl.textContent = formatMoney(totalNeeded);
  totalCollectedEl.textContent = formatMoney(totalCollected);
  totalRemainingEl.textContent = formatMoney(totalRemaining);
}

function renderSchools(schools) {
  if (!schools.length) {
    schoolsContainer.innerHTML = "<p>لا توجد نتائج مطابقة للبحث.</p>";
    return;
  }

  const favoriteIds = getFavorites();

  const cards = schools.map((school) => {
    const remainingAmount = Math.max(school.total_cost - school.collected_funds, 0);
    const isFavorite = favoriteIds.includes(school.id);
    const statusLabel = school.status || (school.completion_percentage < 40 ? "عاجل" : "متوسط");

    return `
      <article class="school-card">
        <a class="card-link" href="./details.html?id=${school.id}" aria-label="عرض تفاصيل ${school.name}">
          <div class="image-wrap">
            <img class="school-image" src="${school.image_url}" alt="صورة ${school.name}" loading="lazy" />
            <span class="status-badge">${statusLabel}</span>
          </div>
        </a>
        <div class="card-body">
          <h2 class="school-name">${school.name}</h2>
          <p class="location">📍 ${school.location}</p>

          <div class="progress-meta">
            <span>نسبة الإنجاز</span>
            <strong>${school.completion_percentage}%</strong>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${school.completion_percentage}%"></div>
          </div>

          <div class="stats">
            <div><span>إجمالي التكلفة:</span> <strong>${formatMoney(school.total_cost)}</strong></div>
            <div><span>المبلغ المجمّع:</span> <strong>${formatMoney(school.collected_funds)}</strong></div>
            <div class="remaining"><span>المبلغ المتبقي:</span> ${formatMoney(remainingAmount)}</div>
          </div>

          <div class="card-actions">
            <a class="btn btn-primary btn-link" href="./details.html?id=${school.id}">التفاصيل / تبرع الآن</a>
            <button class="btn btn-secondary btn-fav ${isFavorite ? "active" : ""}" data-id="${school.id}">
              ${isFavorite ? "مفضلة" : "إضافة للمفضلة"}
            </button>
          </div>
        </div>
      </article>
    `;
  });

  schoolsContainer.innerHTML = cards.join("");
}

function filterSchools(query) {
  const value = query.trim().toLowerCase();
  if (!value) return schoolsData;

  return schoolsData.filter((school) => {
    return school.name.toLowerCase().includes(value) || school.location.toLowerCase().includes(value);
  });
}

async function loadSchools() {
  try {
    feedback.textContent = "";
    const response = await fetch("./data/schools.json");
    if (!response.ok) {
      throw new Error("تعذر تحميل بيانات المدارس.");
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("صيغة البيانات غير صحيحة.");
    }

    schoolsData = data;
    renderGlobalStats(schoolsData);
    renderSchools(schoolsData);
  } catch (error) {
    feedback.textContent = `حدث خطأ: ${error.message}`;
    schoolsContainer.innerHTML = "";
  }
}

searchInput.addEventListener("input", (event) => {
  renderSchools(filterSchools(event.target.value));
});

schoolsContainer.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest(".btn-fav");
  if (!favoriteButton) return;

  const schoolId = Number(favoriteButton.dataset.id);
  const favorites = getFavorites();
  const nextFavorites = favorites.includes(schoolId)
    ? favorites.filter((id) => id !== schoolId)
    : [...favorites, schoolId];

  setFavorites(nextFavorites);
  renderSchools(filterSchools(searchInput.value));
});

loadSchools();
