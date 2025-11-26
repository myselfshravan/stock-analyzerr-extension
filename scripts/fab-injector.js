console.log("Stock Analyzerr FAB: Initializing...");

if (document.getElementById("groww-ai-fab")) {
  console.log("Stock Analyzerr FAB: Already exists, skipping");
} else {
  createFloatingActionButton();
}

async function createFloatingActionButton() {
  const fab = document.createElement("div");
  fab.id = "groww-ai-fab";
  fab.innerHTML = `
    <div class="fab-button" id="fab-button" title="Analyze with AI">
      <span class="fab-icon">🤖</span>
    </div>
    <div class="fab-toast" id="fab-toast"></div>
  `;

  try {
    const modalHTML = await fetch(
      chrome.runtime.getURL("scripts/fab-modal.html")
    ).then((r) => r.text());
    fab.innerHTML += modalHTML;
  } catch (error) {
    console.error("Failed to load FAB modal HTML:", error);
  }

  const fabButtonCSS = document.createElement("link");
  fabButtonCSS.rel = "stylesheet";
  fabButtonCSS.href = chrome.runtime.getURL("scripts/fab-button.css");
  document.head.appendChild(fabButtonCSS);

  const modalCSS = document.createElement("link");
  modalCSS.rel = "stylesheet";
  modalCSS.href = chrome.runtime.getURL("scripts/fab-modal.css");
  document.head.appendChild(modalCSS);

  document.body.appendChild(fab);

  const fabButton = document.getElementById("fab-button");
  fabButton.addEventListener("click", handleFABClick);

  const fabModal = document.getElementById("fab-preview-modal");
  const fabModalCloseBtn = document.getElementById("fab-modal-close-btn");
  const fabModalCopyBtn = document.getElementById("fab-modal-copy-btn");
  const fabModalAnalyzeBtn = document.getElementById("fab-modal-analyze-btn");

  fabModalCloseBtn.addEventListener("click", hideFABModal);
  fabModalCopyBtn.addEventListener("click", handleFABModalCopy);
  fabModalAnalyzeBtn.addEventListener("click", handleFABModalAnalyze);

  fabModal.addEventListener("click", (e) => {
    if (e.target === fabModal) {
      hideFABModal();
    }
  });

  console.log("Stock Analyzerr FAB: Created successfully");

  setTimeout(() => {
    fabButton.classList.add("pulse");
    setTimeout(() => {
      fabButton.classList.remove("pulse");
    }, 4000);
  }, 1000);
}

let currentStockData = null;

async function handleFABClick() {
  const fabButton = document.getElementById("fab-button");

  if (fabButton.classList.contains("loading")) {
    return;
  }

  try {
    fabButton.classList.add("loading");
    showToast("Extracting stock data...", "info");

    const response = await chrome.runtime.sendMessage({
      action: "extractFromFAB",
    });

    if (!response || !response.success) {
      throw new Error(response?.error || "Extraction failed");
    }

    const result = response.result;

    if (result.error) {
      throw new Error(result.message);
    }

    const stockData = result.data;

    await chrome.storage.local.set({
      growwStockData: stockData,
      lastExtracted: Date.now(),
    });

    currentStockData = stockData;

    fabButton.classList.remove("loading");

    showFABModal(stockData);
  } catch (error) {
    console.error("FAB click error:", error);
    showToast(`❌ ${error.message || "Extraction failed"}`, "error");
    fabButton.classList.remove("loading");
  }
}

function showToast(message, type = "info") {
  const toast = document.getElementById("fab-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = "fab-toast show " + type;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function showFABModal(data) {
  const modal = document.getElementById("fab-preview-modal");
  const previewContent = document.getElementById("fab-preview-content");
  const stockName = document.getElementById("fab-stock-name");
  const stockSymbol = document.getElementById("fab-stock-symbol");

  if (!modal || !previewContent) return;

  const yamlData = jsonToYaml(data);
  previewContent.textContent = yamlData;

  if (stockName && data.stockName) {
    stockName.textContent = data.stockName;
  }

  if (stockSymbol && data.symbol) {
    stockSymbol.textContent = data.symbol.toUpperCase();
  }

  modal.classList.remove("fab-hidden");

  currentStockData = data;
}

function hideFABModal() {
  const modal = document.getElementById("fab-preview-modal");
  if (modal) {
    modal.classList.add("fab-hidden");
  }
}

async function handleFABModalCopy() {
  try {
    const yamlData = jsonToYaml(currentStockData);

    await navigator.clipboard.writeText(yamlData);

    showToast("✓ Data copied to clipboard!", "success");
  } catch (error) {
    console.error("Copy error:", error);
    showToast("Failed to copy to clipboard", "error");
  }
}

async function handleFABModalAnalyze() {
  try {
    const { autoSubmit, tempChat } = await chrome.storage.local.get([
      "autoSubmit",
      "tempChat",
    ]);

    await chrome.storage.local.set({
      growwStockData: currentStockData,
      growwAnalysisRequest: true,
      autoSubmit: autoSubmit !== false,
      tempChat: tempChat === true,
      lastExtracted: Date.now(),
    });

    let chatGPTUrl = "https://chatgpt.com/?groww_analysis=true";
    if (tempChat) {
      chatGPTUrl += "&temporary-chat=true";
    }

    window.open(chatGPTUrl, "_blank");

    hideFABModal();

    showToast("✓ Opening ChatGPT...", "success");

    const fabButton = document.getElementById("fab-button");
    fabButton.classList.add("pulse");
    setTimeout(() => {
      fabButton.classList.remove("pulse");
    }, 1000);
  } catch (error) {
    console.error("Modal analyze error:", error);
    showToast("Failed to open ChatGPT", "error");
  }
}

function jsonToYaml(obj, indent = 0) {
  const spaces = "  ".repeat(indent);
  let yaml = "";

  if (obj === null || obj === undefined) {
    return "null";
  }

  if (typeof obj === "string") {
    // Escape special characters and add quotes if needed
    if (
      obj.includes("\n") ||
      obj.includes(":") ||
      obj.includes("#") ||
      obj.match(/^[\d\s]/)
    ) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj === "" ? '""' : obj;
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return "[]";
    }
    // Check if array contains simple values
    if (
      obj.every((item) => typeof item === "string" || typeof item === "number")
    ) {
      return (
        "[" +
        obj
          .map((item) => (typeof item === "string" ? `"${item}"` : item))
          .join(", ") +
        "]"
      );
    }
    // Complex array - use multi-line format
    obj.forEach((item) => {
      yaml += `\n${spaces}- ${jsonToYaml(item, indent + 1).replace(
        /\n/g,
        `\n${spaces}  `
      )}`;
    });
    return yaml;
  }

  if (typeof obj === "object") {
    const keys = Object.keys(obj);
    keys.forEach((key, index) => {
      const value = obj[key];
      const prefix = indent === 0 ? "\n" : index === 0 ? "" : "\n";

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        yaml += `${prefix}${spaces}${key}:`;
        const nestedYaml = jsonToYaml(value, indent + 1);
        yaml += nestedYaml.startsWith("\n") ? nestedYaml : `\n${nestedYaml}`;
      } else if (Array.isArray(value)) {
        yaml += `${prefix}${spaces}${key}:`;
        const arrayYaml = jsonToYaml(value, indent + 1);
        yaml += arrayYaml.startsWith("\n") ? arrayYaml : ` ${arrayYaml}`;
      } else {
        yaml += `${prefix}${spaces}${key}: ${jsonToYaml(value, indent)}`;
      }
    });
    return yaml;
  }

  return String(obj);
}

console.log("Stock Analyzerr FAB: Script loaded and ready");
