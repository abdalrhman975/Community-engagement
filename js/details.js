"use strict";

const params = new URLSearchParams(window.location.search);
const schoolId = Number(params.get("id"));

const feedback = document.getElementById("details-feedback");
const detailsContent = document.getElementById("details-content");
const nameEl = document.getElementById("details-school-name");
const locationEl = document.getElementById("details-location");
const mainImageEl = document.getElementById("details-main-image");
const galleryEl = document.getElementById("details-gallery");
const descriptionEl = document.getElementById("details-description");
const completionEl = document.getElementById("details-completion");
const progressFillEl = document.getElementById("details-progress-fill");
const totalCostEl = document.getElementById("details-total-cost");
const collectedEl = document.getElementById("details-collected");
const remainingEl = document.getElementById("details-remaining");
const contactNumbersEl = document.getElementById("contact-numbers");
const paymentMethodsEl = document.getElementById("payment-methods");
const whatsappLinksEl = document.getElementById("whatsapp-links");
const qrPlaceholderEl = document.getElementById("qr-placeholder");

const currencyFormatter = new Intl.NumberFormat("ar", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function formatMoney(value) {
  return currencyFormatter.format(value);
}

function normalizeWhatsappNumber(number) {
  return number.replace(/[^\d]/g, "");
}

function createCopyButton(textToCopy) {
  const button = document.createElement("button");
  button.className = "btn btn-secondary copy-btn";
  button.type = "button";
  button.textContent = "نسخ";

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      button.textContent = "تم النسخ";
      setTimeout(() => {
        button.textContent = "نسخ";
      }, 1400);
    } catch {
      button.textContent = "تعذر النسخ";
      setTimeout(() => {
        button.textContent = "نسخ";
      }, 1400);
    }
  });

  return button;
}

function renderGallery(images, fallbackAlt) {
  const gallery = Array.isArray(images) ? images : [];
  if (!gallery.length) {
    galleryEl.innerHTML = "<p class='muted'>لا توجد صور إضافية متاحة حاليًا.</p>";
    return;
  }

  galleryEl.innerHTML = "";
  gallery.forEach((imageUrl, index) => {
    const img = document.createElement("img");
    img.className = "gallery-image";
    img.src = imageUrl;
    img.alt = `${fallbackAlt} - صورة ${index + 1}`;
    img.loading = "lazy";
    img.addEventListener("click", () => {
      mainImageEl.src = imageUrl;
    });
    galleryEl.appendChild(img);
  });
}

function renderContacts(numbers) {
  const list = Array.isArray(numbers) ? numbers : [];
  if (!list.length) {
    contactNumbersEl.innerHTML = "<p class='muted'>لا توجد أرقام متاحة الآن.</p>";
    whatsappLinksEl.innerHTML = "";
    return;
  }

  contactNumbersEl.innerHTML = "";
  whatsappLinksEl.innerHTML = "";

  list.forEach((number, index) => {
    const row = document.createElement("div");
    row.className = "payment-item";
    row.innerHTML = `<span>${number}</span>`;
    row.appendChild(createCopyButton(number));
    contactNumbersEl.appendChild(row);

    if (index === 0) {
      const wa = document.createElement("a");
      wa.className = "btn btn-primary btn-link";
      wa.href = `https://wa.me/${normalizeWhatsappNumber(number)}?text=${encodeURIComponent("مرحبًا، أرغب بالتبرع لدعم ترميم المدرسة.")}`;
      wa.target = "_blank";
      wa.rel = "noopener noreferrer";
      wa.textContent = "التواصل عبر واتساب";
      whatsappLinksEl.appendChild(wa);
    }
  });
}

function renderPaymentMethods(methods) {
  const list = Array.isArray(methods) ? methods : [];
  if (!list.length) {
    paymentMethodsEl.innerHTML = "<p class='muted'>لا توجد طرق تحويل متاحة الآن.</p>";
    return;
  }

  paymentMethodsEl.innerHTML = "";
  list.forEach((item) => {
    const row = document.createElement("div");
    row.className = "payment-item payment-emphasis";
    row.innerHTML = `<span><strong>${item.method}</strong> - ID: ${item.id}</span>`;
    row.appendChild(createCopyButton(item.id));
    paymentMethodsEl.appendChild(row);
  });
}

function renderSchoolDetails(school) {
  const remainingAmount = Math.max(school.total_cost - school.collected_funds, 0);

  nameEl.textContent = school.name;
  locationEl.textContent = school.location;
  mainImageEl.src = school.image_url;
  mainImageEl.alt = `الصورة الرئيسية - ${school.name}`;
  descriptionEl.textContent = school.description;
  completionEl.textContent = `${school.completion_percentage}%`;
  progressFillEl.style.width = `${school.completion_percentage}%`;
  totalCostEl.textContent = formatMoney(school.total_cost);
  collectedEl.textContent = formatMoney(school.collected_funds);
  remainingEl.textContent = formatMoney(remainingAmount);

  renderGallery(school.full_gallery, school.name);
  renderContacts(school.contact_numbers);
  renderPaymentMethods(school.payment_methods);

  if (school.qr_code_url) {
    qrPlaceholderEl.innerHTML = `
      <strong>QR Code</strong>
      <img class="details-main-image" style="height:260px; margin-top:10px;" src="${school.qr_code_url}" alt="رمز QR للتبرع" />
    `;
  }
}

async function loadSchoolDetails() {
  if (!schoolId) {
    feedback.textContent = "معرّف المدرسة غير صحيح.";
    return;
  }

  try {
    const response = await fetch("./data/schools.json");
    if (!response.ok) {
      throw new Error("تعذر تحميل بيانات المدارس.");
    }

    const schools = await response.json();
    if (!Array.isArray(schools)) {
      throw new Error("صيغة البيانات غير صحيحة.");
    }

    const school = schools.find((item) => item.id === schoolId);
    if (!school) {
      feedback.textContent = "لم يتم العثور على المدرسة المطلوبة.";
      return;
    }

    feedback.textContent = "";
    detailsContent.classList.remove("hidden");
    renderSchoolDetails(school);
  } catch (error) {
    feedback.textContent = `حدث خطأ: ${error.message}`;
  }
}

loadSchoolDetails();
