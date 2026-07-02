document.addEventListener("DOMContentLoaded", () => {
  // Context Elements References
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const uploadPrompt = document.getElementById("uploadPrompt");
  const fileDisplay = document.getElementById("fileDisplay");
  const previewContainer = document.getElementById("previewContainer");
  const imagePreview = document.getElementById("imagePreview");
  const pdfIconContainer = document.getElementById("pdfIconContainer");
  const removeFileBtn = document.getElementById("removeFileBtn");
  const uploadForm = document.getElementById("uploadForm");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const btnText = document.getElementById("btnText");

  // View State Containers References
  const stateEmpty = document.getElementById("stateEmpty");
  const stateLoading = document.getElementById("stateLoading");
  const stateError = document.getElementById("stateError");
  const stateResult = document.getElementById("stateResult");

  const errorMessage = document.getElementById("errorMessage");
  const resultContent = document.getElementById("resultContent");

  // Functional Control Buttons References
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");
  const anotherBtn = document.getElementById("anotherBtn");

  let selectedFile = null;
  let selectedTestType = "diabetes";

  // Tab References
  const tabDiabetes = document.getElementById("tabDiabetes");
  const tabCBC = document.getElementById("tabCBC");

  // Define Global Constants
  const API_ENDPOINTS = {
    diabetes: "https://yousefm22-diabetes-api.hf.space/api/upload/diabetes",
    cbc: "https://yousefm22-cbc-api.hf.space/api/upload/cbc",
  };
  const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 Megabytes
  const VALID_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

  // Event Listeners for File Drop Handling
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(
      eventName,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add("border-blue-500", "bg-blue-50/20");
      },
      false,
    );
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(
      eventName,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove("border-blue-500", "bg-blue-50/20");
      },
      false,
    );
  });

  dropZone.addEventListener("drop", (e) => {
    const transferData = e.dataTransfer;
    const file = transferData.files[0];
    if (file) handleFileProcessing(file);
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleFileProcessing(file);
  });

  removeFileBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Stop trigger propagation to outer container trigger click
    resetUploadState();
  });

  // Tab Switching
  function switchTab(type) {
    selectedTestType = type;
    tabDiabetes.className = `tab-btn flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${type === "diabetes" ? "bg-white shadow-sm text-blue-700" : "text-slate-500 hover:text-slate-700 font-semibold"}`;
    tabCBC.className = `tab-btn flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${type === "cbc" ? "bg-white shadow-sm text-blue-700" : "text-slate-500 hover:text-slate-700 font-semibold"}`;
    tabDiabetes.setAttribute("aria-selected", type === "diabetes");
    tabCBC.setAttribute("aria-selected", type === "cbc");
    if (selectedFile) {
      document.getElementById("metaType").textContent = selectedFile.type.split("/")[1];
    }
  }

  tabDiabetes.addEventListener("click", () => switchTab("diabetes"));
  tabCBC.addEventListener("click", () => switchTab("cbc"));

  // Master Validation and Metadata Rendering Processor
  function handleFileProcessing(file) {
    hideAllViews();
    stateEmpty.classList.remove("hidden");

    if (!VALID_MIME_TYPES.includes(file.type)) {
      showError("Unsupported file type selected. Please provide a valid JPG, PNG, or PDF file.");
      resetUploadState();
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showError("File size violates upper allocation limits. Max permitted target scale is 20MB.");
      resetUploadState();
      return;
    }

    selectedFile = file;

    // Bind Target Meta Specs
    document.getElementById("metaName").textContent = file.name;
    document.getElementById("metaSize").textContent = formatBytes(file.size);
    document.getElementById("metaType").textContent = file.type.split("/")[1];

    uploadPrompt.classList.add("hidden");
    fileDisplay.classList.remove("hidden");

    if (file.type.startsWith("image/")) {
      pdfIconContainer.classList.add("hidden");
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewContainer.classList.remove("hidden");
      };
      fileReader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      previewContainer.classList.add("hidden");
      pdfIconContainer.classList.remove("hidden");
    }

    // Unlock State Submissions Action Interactivity Layer
    analyzeBtn.disabled = false;
  }

  function resetUploadState() {
    selectedFile = null;
    fileInput.value = "";
    imagePreview.src = "#";
    previewContainer.classList.add("hidden");
    pdfIconContainer.classList.add("hidden");
    fileDisplay.classList.add("hidden");
    uploadPrompt.classList.remove("hidden");
    analyzeBtn.disabled = true;
  }

  function hideAllViews() {
    stateEmpty.classList.add("hidden");
    stateLoading.classList.add("hidden");
    stateError.classList.add("hidden");
    stateResult.classList.add("hidden");
  }

  function showError(message) {
    errorMessage.textContent = message;
    stateError.classList.remove("hidden");
  }

  // Standard Utility Conversions Function
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  // Async API Context Submission Core Processing Hook
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    // UI Processing Lock States Initialization
    analyzeBtn.disabled = true;
    btnText.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin mr-2"></i> Analyzing...`;
    hideAllViews();
    stateLoading.classList.remove("hidden");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(API_ENDPOINTS[selectedTestType], {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Server returned ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (data.status && data.status !== "success") {
        throw new Error("Analysis failed: " + (data.message || "server returned an error status."));
      }
      if (!data.diagnosis) {
        throw new Error("Analysis failed: incomplete response from server.");
      }

      const values = data.values || {};

      if (selectedTestType === "cbc") {
        renderCBCResult(data, values);
      } else {
        renderDiabetesResult(data, values);
      }

      hideAllViews();
      stateResult.classList.remove("hidden");
    } catch (error) {
      console.error("Analysis Exception Context:", error);
      hideAllViews();
      showError(error.message || "Network communication error or server unavailable. Please try your validation context operation again.");
    } finally {
      btnText.textContent = "Analyze Report";
      analyzeBtn.disabled = false;
    }
  });

  // Interactive Utilities Layer Bindings
  copyBtn.addEventListener("click", () => {
    navigator.clipboard
      .writeText(resultContent.textContent)
      .then(() => {
        const originalBtnContent = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i class="fa-solid fa-check text-emerald-500"></i> Copied!`;
        setTimeout(() => (copyBtn.innerHTML = originalBtnContent), 2000);
      })
      .catch(() => {
        alert("Clipboard initialization copy operation failed.");
      });
  });

  function structuralGlobalReset() {
    resetUploadState();
    hideAllViews();
    stateEmpty.classList.remove("hidden");
  }

  clearBtn.addEventListener("click", structuralGlobalReset);
  anotherBtn.addEventListener("click", structuralGlobalReset);

  // ─── Diabetes Result Renderer ───────────────────────────────────────
  function renderDiabetesResult(data, values) {
    const interpretationText = data.diagnosis ? data.diagnosis.toLowerCase() : "";
    const isDiabetic = interpretationText.includes("diabetes") || interpretationText.includes("positive");

    const theme = isDiabetic
      ? { border: "border-red-100/80", bg: "bg-gradient-to-br from-red-50 via-red-50/50 to-orange-50/30", text: "text-red-700", icon: "fa-triangle-exclamation", badge: "bg-red-100 text-red-800", badgeBg: "bg-red-500", pulse: "bg-red-400/20" }
      : { border: "border-emerald-100/80", bg: "bg-gradient-to-br from-emerald-50 via-emerald-50/30 to-teal-50/30", text: "text-emerald-700", icon: "fa-circle-check", badge: "bg-emerald-100 text-emerald-800", badgeBg: "bg-emerald-500", pulse: "bg-emerald-400/20" };

    function biomarkerColor(value, type) {
      const num = parseFloat(value);
      if (isNaN(num)) return { color: "text-slate-400", dot: "bg-slate-300", label: null };
      if (type === "hba1c") {
        if (num >= 6.5) return { color: "text-red-600", dot: "bg-red-500", label: "High" };
        if (num >= 5.7) return { color: "text-amber-600", dot: "bg-amber-500", label: "Elevated" };
        return { color: "text-emerald-600", dot: "bg-emerald-500", label: "Normal" };
      }
      if (type === "glucose") {
        if (num >= 126) return { color: "text-red-600", dot: "bg-red-500", label: "High" };
        if (num >= 100) return { color: "text-amber-600", dot: "bg-amber-500", label: "Elevated" };
        return { color: "text-emerald-600", dot: "bg-emerald-500", label: "Normal" };
      }
      if (type === "bmi") {
        if (num >= 30) return { color: "text-red-600", dot: "bg-red-500", label: "Obese" };
        if (num >= 25) return { color: "text-amber-600", dot: "bg-amber-500", label: "Overweight" };
        if (num >= 18.5) return { color: "text-emerald-600", dot: "bg-emerald-500", label: "Normal" };
        return { color: "text-yellow-600", dot: "bg-yellow-500", label: "Underweight" };
      }
      return { color: "text-slate-800", dot: "bg-slate-400", label: null };
    }

    const hba1cInfo = biomarkerColor(values.HbA1c_level, "hba1c");
    const glucoseInfo = biomarkerColor(values.blood_glucose_level, "glucose");
    const bmiInfo = biomarkerColor(values.bmi, "bmi");

    function statusBadge(condition) {
      const detected = condition == 1 || condition == "Yes" || condition == true;
      if (detected) {
        return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Detected</span>`;
      }
      return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> None</span>`;
    }

    const htnBadge = statusBadge(values.hypertension);
    const hdBadge = statusBadge(values.heart_disease);

    resultContent.innerHTML = `
      <div class="space-y-5">
        <div class="relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} p-5 sm:p-6">
          <div class="absolute inset-0 bg-grid-pattern opacity-30"></div>
          <div class="absolute -top-6 -right-6 w-24 h-24 rounded-full ${theme.pulse} blur-2xl"></div>
          <div class="relative z-10 flex flex-col sm:flex-row items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-white/90 shadow-sm flex items-center justify-center text-xl ${theme.text} flex-shrink-0 border border-white/60">
              <i class="fa-solid ${theme.icon}"></i>
            </div>
            <div class="flex-1 min-w-0 w-full">
              <span class="text-xs font-bold tracking-wider uppercase ${theme.text} opacity-70">AI Core Assessment</span>
              <h3 class="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 leading-tight">${data.diagnosis}</h3>
              <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-slate-500 font-medium text-xs">Confidence</span>
                  <div class="w-28 sm:w-36 h-2 bg-slate-200/70 rounded-full overflow-hidden">
                    <div class="h-full rounded-full ${theme.badgeBg} progress-bar-animated" style="width: ${Math.min(data.confidence ?? 0, 100)}%"></div>
                  </div>
                  <span class="text-sm font-bold ${theme.text}">${data.confidence ?? "N/A"}%</span>
                </div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${theme.badge} border ${theme.border}">
                  <i class="fa-solid ${theme.icon} text-[10px]"></i>
                  ${isDiabetic ? "Positive Result" : "Negative Result"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up-stagger-1">
          <div class="flex items-center gap-2 mb-3 px-0.5">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Biomarkers</span>
            <div class="h-px bg-slate-100 flex-1"></div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <i class="fa-solid fa-venus-mars text-slate-300"></i> Gender
              </div>
              <span class="block text-base font-bold text-slate-800">${values.gender ?? "N/A"}</span>
            </div>
            <div class="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <i class="fa-solid fa-calendar text-slate-300"></i> Age
              </div>
              <span class="block text-base font-bold text-slate-800">${values.age ?? "N/A"} <span class="text-xs text-slate-400 font-medium">yrs</span></span>
            </div>
            <div class="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span class="w-2 h-2 rounded-full ${hba1cInfo.dot}"></span> HbA1c
              </div>
              <span class="block text-base font-bold ${hba1cInfo.color}">${values.HbA1c_level ?? "N/A"}</span>
              ${hba1cInfo.label ? `<span class="block text-[11px] font-medium ${hba1cInfo.color} opacity-70 mt-0.5">${hba1cInfo.label}</span>` : ""}
            </div>
            <div class="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span class="w-2 h-2 rounded-full ${glucoseInfo.dot}"></span> Glucose
              </div>
              <span class="block text-base font-bold ${glucoseInfo.color}">${values.blood_glucose_level ?? "N/A"} <span class="text-xs ${glucoseInfo.color} opacity-60 font-medium">mg/dL</span></span>
              ${glucoseInfo.label ? `<span class="block text-[11px] font-medium ${glucoseInfo.color} opacity-70 mt-0.5">${glucoseInfo.label}</span>` : ""}
            </div>
          </div>
        </div>

        <div class="animate-slide-up-stagger-2">
          <div class="flex items-center gap-2 mb-3 px-0.5">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Health Indicators</span>
            <div class="h-px bg-slate-100 flex-1"></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">BMI</span>
                <i class="fa-solid fa-weight-scale text-slate-200 text-lg"></i>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-base font-bold text-slate-800">${values.bmi ?? "N/A"}</span>
                ${bmiInfo.label ? `<span class="text-xs font-semibold ${bmiInfo.color}">${bmiInfo.label}</span>` : ""}
              </div>
            </div>
            <div class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hypertension</span>
                <i class="fa-solid fa-heart-pulse text-slate-200 text-lg"></i>
              </div>
              <div class="flex items-center">${htnBadge}</div>
            </div>
            <div class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Heart Disease</span>
                <i class="fa-solid fa-wave-square text-slate-200 text-lg"></i>
              </div>
              <div class="flex items-center">${hdBadge}</div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up-stagger-3">
          <div class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
              <i class="fa-solid fa-smoking"></i>
            </div>
            <div class="flex-1 min-w-0">
              <span class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Smoking History</span>
              <span class="block text-sm font-bold text-slate-800 mt-0.5">${values.smoking_history ?? "N/A"}</span>
            </div>
            <div class="text-xs text-slate-300 font-medium flex-shrink-0">
              <i class="fa-regular fa-clock"></i> Lifestyle
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── CBC Result Renderer ───────────────────────────────────────────
  function cbcColor(value, low, high) {
    const num = parseFloat(value);
    if (isNaN(num)) return { color: "text-slate-400", dot: "bg-slate-300", label: null };
    if (num > high) return { color: "text-red-600", dot: "bg-red-500", label: "High" };
    if (num < low) return { color: "text-amber-600", dot: "bg-amber-500", label: "Low" };
    return { color: "text-emerald-600", dot: "bg-emerald-500", label: "Normal" };
  }

  function fmtNum(val) {
    const n = parseFloat(val);
    return isNaN(n) ? "N/A" : n;
  }

  function fmtRBC(val) {
    const n = parseFloat(val);
    return isNaN(n) ? "N/A" : (n / 1000000).toFixed(1);
  }

  function fmtPLT(val) {
    const n = parseFloat(val);
    return isNaN(n) ? "N/A" : (n / 1000).toFixed(0);
  }

  function renderCBCResult(data, values) {
    const isHealthy = (data.diagnosis || "").toLowerCase().includes("healthy");

    const theme = isHealthy
      ? { border: "border-emerald-100/80", bg: "bg-gradient-to-br from-emerald-50 via-emerald-50/30 to-teal-50/30", text: "text-emerald-700", icon: "fa-circle-check", badge: "bg-emerald-100 text-emerald-800", badgeBg: "bg-emerald-500", pulse: "bg-emerald-400/20" }
      : { border: "border-red-100/80", bg: "bg-gradient-to-br from-red-50 via-red-50/50 to-orange-50/30", text: "text-red-700", icon: "fa-triangle-exclamation", badge: "bg-red-100 text-red-800", badgeBg: "bg-red-500", pulse: "bg-red-400/20" };

    const wbc = cbcColor(values.WBC, 4.5, 11);
    const rbc = cbcColor(values.RBC, 4200000, 6100000);
    const hgb = cbcColor(values.HGB, 12, 17.5);
    const hct = cbcColor(values.HCT, 36, 50);
    const mcv = cbcColor(values.MCV, 80, 100);
    const mch = cbcColor(values.MCH, 27, 34);
    const mchc = cbcColor(values.MCHC, 32, 36);
    const plt = cbcColor(values.PLT, 150000, 450000);
    const pdw = cbcColor(values.PDW, 9, 14);
    const pct = cbcColor(values.PCT, 0.15, 0.4);
    const lymp = cbcColor(values.LYMp, 20, 40);
    const neutp = cbcColor(values.NEUTp, 40, 60);
    const lymn = cbcColor(values.LYMn, 1, 4);
    const neutn = cbcColor(values.NEUTn, 2, 7);

    function cell(label, unit, value, info, icon) {
      return `
        <div class="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
          <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            ${icon ? `<i class="fa-solid ${icon} text-slate-300"></i>` : `<span class="w-2 h-2 rounded-full ${info.dot}"></span>`} ${label}
          </div>
          <span class="block text-base font-bold ${info.color}">${value}${unit ? ` <span class="text-xs ${info.color} opacity-60 font-medium">${unit}</span>` : ""}</span>
          ${info.label ? `<span class="block text-[11px] font-medium ${info.color} opacity-70 mt-0.5">${info.label}</span>` : ""}
        </div>`;
    }

    resultContent.innerHTML = `
      <div class="space-y-5">
        <div class="relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} p-5 sm:p-6">
          <div class="absolute inset-0 bg-grid-pattern opacity-30"></div>
          <div class="absolute -top-6 -right-6 w-24 h-24 rounded-full ${theme.pulse} blur-2xl"></div>
          <div class="relative z-10 flex flex-col sm:flex-row items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-white/90 shadow-sm flex items-center justify-center text-xl ${theme.text} flex-shrink-0 border border-white/60">
              <i class="fa-solid ${theme.icon}"></i>
            </div>
            <div class="flex-1 min-w-0 w-full">
              <span class="text-xs font-bold tracking-wider uppercase ${theme.text} opacity-70">AI Core Assessment</span>
              <h3 class="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 leading-tight">${data.diagnosis}</h3>
              <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-slate-500 font-medium text-xs">Confidence</span>
                  <div class="w-28 sm:w-36 h-2 bg-slate-200/70 rounded-full overflow-hidden">
                    <div class="h-full rounded-full ${theme.badgeBg} progress-bar-animated" style="width: ${Math.min(data.confidence ?? 0, 100)}%"></div>
                  </div>
                  <span class="text-sm font-bold ${theme.text}">${data.confidence ?? "N/A"}%</span>
                </div>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${theme.badge} border ${theme.border}">
                  <i class="fa-solid ${theme.icon} text-[10px]"></i>
                  ${isHealthy ? "Normal Result" : "Abnormal Result"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-slide-up-stagger-1">
          <div class="flex items-center gap-2 mb-3 px-0.5">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Complete Blood Count</span>
            <div class="h-px bg-slate-100 flex-1"></div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            ${cell("WBC", "K/μL", fmtNum(values.WBC), wbc, "fa-solid fa-dna")}
            ${cell("RBC", "M/μL", fmtRBC(values.RBC), rbc, "fa-solid fa-droplet")}
            ${cell("HGB", "g/dL", fmtNum(values.HGB), hgb, "fa-solid fa-droplet")}
            ${cell("HCT", "%", fmtNum(values.HCT), hct, "fa-solid fa-percentage")}
            ${cell("MCV", "fL", fmtNum(values.MCV), mcv)}
            ${cell("MCH", "pg", fmtNum(values.MCH), mch)}
            ${cell("MCHC", "g/dL", fmtNum(values.MCHC), mchc)}
            ${cell("PLT", "K/μL", fmtPLT(values.PLT), plt, "fa-solid fa-chart-line")}
          </div>
        </div>

        <div class="animate-slide-up-stagger-2">
          <div class="flex items-center gap-2 mb-3 px-0.5">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Differential &amp; Additional</span>
            <div class="h-px bg-slate-100 flex-1"></div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            ${cell("LYM%", "%", fmtNum(values.LYMp), lymp)}
            ${cell("NEUT%", "%", fmtNum(values.NEUTp), neutp)}
            ${cell("LYM#", "K/μL", fmtNum(values.LYMn), lymn)}
            ${cell("NEUT#", "K/μL", fmtNum(values.NEUTn), neutn)}
            ${cell("PDW", "fL", fmtNum(values.PDW), pdw)}
            ${cell("PCT", "%", fmtNum(values.PCT), pct)}
          </div>
        </div>
      </div>
    `;
  }
});