// Floating Action Button (FAB) for Groww Pages
// Provides quick access to AI analysis from any Groww stock page

console.log("Stock Analyzerr FAB: Initializing...");

// Check if FAB already exists
if (document.getElementById("groww-ai-fab")) {
  console.log("Stock Analyzerr FAB: Already exists, skipping");
} else {
  createFloatingActionButton();
}

async function createFloatingActionButton() {
  // Create FAB container
  const fab = document.createElement("div");
  fab.id = "groww-ai-fab";
  fab.innerHTML = `
    <div class="fab-button" id="fab-button" title="Analyze with AI">
      <span class="fab-icon">🤖</span>
    </div>
    <div class="fab-toast" id="fab-toast"></div>
  `;

  // Load modal HTML from external file
  try {
    const modalHTML = await fetch(
      chrome.runtime.getURL("scripts/fab-modal.html")
    ).then((r) => r.text());
    fab.innerHTML += modalHTML;
  } catch (error) {
    console.error("Failed to load FAB modal HTML:", error);
  }

  // Load FAB button CSS from external file
  const fabButtonCSS = document.createElement("link");
  fabButtonCSS.rel = "stylesheet";
  fabButtonCSS.href = chrome.runtime.getURL("scripts/fab-button.css");
  document.head.appendChild(fabButtonCSS);

  // Load modal CSS from external file
  const modalCSS = document.createElement("link");
  modalCSS.rel = "stylesheet";
  modalCSS.href = chrome.runtime.getURL("scripts/fab-modal.css");
  document.head.appendChild(modalCSS);

  document.body.appendChild(fab);

  // Add click handlers
  const fabButton = document.getElementById("fab-button");
  fabButton.addEventListener("click", handleFABClick);

  // Modal event listeners
  const fabModal = document.getElementById("fab-preview-modal");
  const fabModalCloseBtn = document.getElementById("fab-modal-close-btn");
  const fabModalCopyBtn = document.getElementById("fab-modal-copy-btn");
  const fabModalAnalyzeBtn = document.getElementById("fab-modal-analyze-btn");

  fabModalCloseBtn.addEventListener("click", hideFABModal);
  fabModalCopyBtn.addEventListener("click", handleFABModalCopy);
  fabModalAnalyzeBtn.addEventListener("click", handleFABModalAnalyze);

  // Close modal when clicking outside
  fabModal.addEventListener("click", (e) => {
    if (e.target === fabModal) {
      hideFABModal();
    }
  });

  console.log("Stock Analyzerr FAB: Created successfully");

  // Optional: Add subtle pulse animation on first load
  setTimeout(() => {
    fabButton.classList.add("pulse");
    setTimeout(() => {
      fabButton.classList.remove("pulse");
    }, 4000);
  }, 1000);
}

let currentStockData = null; // Store extracted data for modal actions

async function handleFABClick() {
  const fabButton = document.getElementById("fab-button");

  // Prevent multiple clicks
  if (fabButton.classList.contains("loading")) {
    return;
  }

  try {
    // Show loading state
    fabButton.classList.add("loading");
    showToast("Extracting stock data...", "info");

    // Send message to background script to perform extraction
    // (Content scripts can't use chrome.tabs or chrome.scripting APIs)
    const response = await chrome.runtime.sendMessage({
      action: "extractFromFAB",
    });

    if (!response || !response.success) {
      throw new Error(response?.error || "Extraction failed");
    }

    const result = response.result;

    // Check for validation errors
    if (result.error) {
      throw new Error(result.message);
    }

    const stockData = result.data;

    // Store data in chrome.storage
    await chrome.storage.local.set({
      growwStockData: stockData,
      lastExtracted: Date.now(),
    });

    // Store data for modal actions
    currentStockData = stockData;

    // Remove loading state
    fabButton.classList.remove("loading");

    // Show preview modal
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

  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Modal Helper Functions
function showFABModal(data) {
  const modal = document.getElementById("fab-preview-modal");
  const previewContent = document.getElementById("fab-preview-content");

  if (!modal || !previewContent) return;

  // Convert data to YAML for display
  const yamlData = jsonToYaml(data);
  previewContent.textContent = yamlData;

  // Show modal
  modal.classList.remove("fab-hidden");

  // Store the data
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

    // Copy YAML to clipboard
    await navigator.clipboard.writeText(yamlData);

    showToast("✓ Data copied to clipboard!", "success");
  } catch (error) {
    console.error("Copy error:", error);
    showToast("Failed to copy to clipboard", "error");
  }
}

async function handleFABModalAnalyze() {
  try {
    // Get user preferences from storage
    const { autoSubmit, tempChat } = await chrome.storage.local.get([
      "autoSubmit",
      "tempChat",
    ]);

    // Ensure data is stored with preferences
    await chrome.storage.local.set({
      growwStockData: currentStockData,
      growwAnalysisRequest: true,
      autoSubmit: autoSubmit !== false, // Default true
      tempChat: tempChat === true, // Default false
      lastExtracted: Date.now(),
    });

    // Build ChatGPT URL
    let chatGPTUrl = "https://chatgpt.com/?groww_analysis=true";
    if (tempChat) {
      chatGPTUrl += "&temporary-chat=true";
    }

    // Open ChatGPT in a new tab
    window.open(chatGPTUrl, "_blank");

    // Hide modal
    hideFABModal();

    // Success feedback
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

// Convert JSON to YAML format (lightweight, no dependencies)
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
