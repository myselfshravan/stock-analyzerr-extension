// DOM Elements
const stockInfo = document.getElementById("stock-info");
const stockName = document.getElementById("stock-name");
const stockPrice = document.getElementById("stock-price");
const stockChange = document.getElementById("stock-change");
const errorMessage = document.getElementById("error-message");
const extractBtn = document.getElementById("extract-btn");
const analyzeBtn = document.getElementById("analyze-btn");
const statusMessage = document.getElementById("status-message");
const loading = document.getElementById("loading");
const autoSubmitToggle = document.getElementById("auto-submit-toggle");
const tempChatToggle = document.getElementById("temp-chat-toggle");
const extractFinancialsToggle = document.getElementById(
  "extract-financials-toggle"
);

// Modal Elements
const previewModal = document.getElementById("preview-modal");
const previewContent = document.getElementById("preview-content");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalCopyBtn = document.getElementById("modal-copy-btn");
const modalAnalyzeBtn = document.getElementById("modal-analyze-btn");

let currentTabId = null;
let extractedData = null;

// Initialize popup
document.addEventListener("DOMContentLoaded", initializePopup);

async function initializePopup() {
  try {
    // Load preferences
    const { autoSubmit, tempChat, extractFinancials } =
      await chrome.storage.local.get([
        "autoSubmit",
        "tempChat",
        "extractFinancials",
      ]);
    autoSubmitToggle.checked = autoSubmit !== false; // Default true
    tempChatToggle.checked = tempChat === true; // Default false
    extractFinancialsToggle.checked = extractFinancials === true; // Default false

    // Get current active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    currentTabId = tab.id;

    // Check if we're on a Groww stock page
    const isGrowwStock =
      tab.url && tab.url.match(/^https:\/\/groww\.in\/stocks\/.+/);

    if (!isGrowwStock) {
      showError();
      return;
    }

    // We're on a Groww page, enable UI
    hideError();
    showLoading(true);

    // Try to get basic stock info to display
    await getBasicStockInfo(tab.id);

    // Enable buttons
    extractBtn.disabled = false;
    analyzeBtn.disabled = false;

    showLoading(false);
  } catch (error) {
    console.error("Initialization error:", error);
    showStatus("Failed to initialize extension", "error");
    showLoading(false);
  }
}

// Save toggle states when changed
autoSubmitToggle.addEventListener("change", async () => {
  const isChecked = autoSubmitToggle.checked;
  await chrome.storage.local.set({ autoSubmit: isChecked });
  console.log("Auto-submit preference saved:", isChecked);

  showStatus(
    isChecked
      ? "Auto-submit enabled - ChatGPT will auto-send"
      : "Auto-submit disabled - you can review before sending",
    "info"
  );
});

tempChatToggle.addEventListener("change", async () => {
  const isChecked = tempChatToggle.checked;
  await chrome.storage.local.set({ tempChat: isChecked });
  console.log("Temp chat preference saved:", isChecked);

  showStatus(
    isChecked
      ? "Temporary chat enabled - conversation won't be saved"
      : "Normal chat mode - conversation will be saved",
    "info"
  );
});

extractFinancialsToggle.addEventListener("change", async () => {
  const isChecked = extractFinancialsToggle.checked;
  await chrome.storage.local.set({ extractFinancials: isChecked });
  console.log("Extract financials preference saved:", isChecked);

  showStatus(
    isChecked
      ? "Financial charts enabled - extraction will take ~2s longer"
      : "Financial charts disabled - faster extraction",
    "info"
  );
});

async function getBasicStockInfo(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Try multiple possible selectors for stock name
        const nameSelectors = [
          'h1[class*="stock"]',
          "h1",
          ".stock-name",
          '[data-testid="stock-name"]',
        ];

        let name = "Stock";
        for (const selector of nameSelectors) {
          const el = document.querySelector(selector);
          if (el && el.innerText) {
            name = el.innerText.trim();
            break;
          }
        }

        // Try to get price
        const priceSelectors = [
          '[class*="price"]',
          '[data-testid="current-price"]',
        ];

        let price = "";
        for (const selector of priceSelectors) {
          const el = document.querySelector(selector);
          if (el && el.innerText) {
            price = el.innerText.trim();
            break;
          }
        }

        // Try to get change
        const changeSelectors = [
          '[class*="change"]',
          '[data-testid="day-change"]',
        ];

        let change = "";
        for (const selector of changeSelectors) {
          const el = document.querySelector(selector);
          if (el && el.innerText) {
            change = el.innerText.trim();
            break;
          }
        }

        return { name, price, change };
      },
    });

    if (result && result.result) {
      const { name, price, change } = result.result;

      stockName.textContent = name;

      if (price) {
        stockPrice.textContent = price;
      }

      if (change) {
        stockChange.textContent = change;
        // Add positive/negative class based on content
        if (change.includes("+") || change.includes("▲")) {
          stockChange.classList.add("positive");
        } else if (change.includes("-") || change.includes("▼")) {
          stockChange.classList.add("negative");
        }
      }

      stockInfo.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error getting stock info:", error);
    // Don't show error, just don't display the info
  }
}

// Button Event Listeners
extractBtn.addEventListener("click", handleExtract);
analyzeBtn.addEventListener("click", handleAnalyze);

// Modal Event Listeners
modalCloseBtn.addEventListener("click", hidePreviewModal);
modalCopyBtn.addEventListener("click", handleModalCopy);
modalAnalyzeBtn.addEventListener("click", handleModalAnalyze);

// Close modal when clicking outside
previewModal.addEventListener("click", (e) => {
  if (e.target === previewModal) {
    hidePreviewModal();
  }
});

async function handleExtract() {
  try {
    // CLEAR OLD DATA FIRST to prevent stale data
    console.log("🗑️ Clearing old stock data from storage...");
    await chrome.storage.local.remove([
      "growwStockData",
      "growwAnalysisRequest",
    ]);

    showLoading(true);
    extractBtn.disabled = true;

    // Get extractFinancials preference
    const { extractFinancials } = await chrome.storage.local.get([
      "extractFinancials",
    ]);

    // Execute the extraction script
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      files: ["scripts/dom-extractor.js"],
    });

    // Now call the extraction function with options
    const [extractResult] = await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      func: (options) => {
        if (typeof window.extractGrowwStockData === "function") {
          return window.extractGrowwStockData(options);
        } else {
          throw new Error("Extraction function not found");
        }
      },
      args: [{ extractFinancials: extractFinancials === true }],
    });

    if (extractResult && extractResult.result) {
      const result = extractResult.result;

      // CHECK FOR VALIDATION ERRORS
      if (result.error) {
        console.error("❌ Extraction validation failed:", result.message);
        showStatus(`❌ ${result.message}`, "error");
        showLoading(false);
        extractBtn.disabled = false;
        return; // Don't proceed
      }

      // Success - use result.data
      extractedData = result.data;

      // Store in chrome.storage
      await chrome.storage.local.set({
        growwStockData: extractedData,
        lastExtracted: Date.now(),
      });

      showLoading(false);
      extractBtn.disabled = false;

      // Show preview modal instead of copying directly
      showPreviewModal(extractedData);
    } else {
      throw new Error("No data extracted");
    }
  } catch (error) {
    console.error("Extraction error:", error);
    showStatus("Failed to extract data. Please try again.", "error");
    showLoading(false);
    extractBtn.disabled = false;
  }
}

async function handleAnalyze() {
  try {
    showLoading(true);
    analyzeBtn.disabled = true;

    // CLEAR OLD DATA FIRST to prevent stale data
    console.log("🗑️ Clearing old stock data from storage...");
    await chrome.storage.local.remove([
      "growwStockData",
      "growwAnalysisRequest",
    ]);

    // Get extractFinancials preference
    const { extractFinancials } = await chrome.storage.local.get([
      "extractFinancials",
    ]);

    // Always perform fresh extraction for "Analyze" button
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      files: ["scripts/dom-extractor.js"],
    });

    const [extractResult] = await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      func: (options) => {
        if (typeof window.extractGrowwStockData === "function") {
          return window.extractGrowwStockData(options);
        } else {
          throw new Error("Extraction function not found");
        }
      },
      args: [{ extractFinancials: extractFinancials === true }],
    });

    if (extractResult && extractResult.result) {
      const result = extractResult.result;

      // CHECK FOR VALIDATION ERRORS
      if (result.error) {
        console.error("❌ Extraction validation failed:", result.message);
        showStatus(`❌ ${result.message}`, "error");
        showLoading(false);
        analyzeBtn.disabled = false;
        return;
      }

      // Success - use result.data
      extractedData = result.data;

      // Store in chrome.storage
      await chrome.storage.local.set({
        growwStockData: extractedData,
        lastExtracted: Date.now(),
      });

      showLoading(false);
      analyzeBtn.disabled = false;

      // Show preview modal
      showPreviewModal(extractedData);
    } else {
      throw new Error("No data extracted");
    }
  } catch (error) {
    console.error("Analysis error:", error);
    showStatus("Failed to extract data. Please try again.", "error");
    showLoading(false);
    analyzeBtn.disabled = false;
  }
}

// UI Helper Functions
function showError() {
  errorMessage.classList.remove("hidden");
  stockInfo.classList.add("hidden");
  extractBtn.disabled = true;
  analyzeBtn.disabled = true;
}

function hideError() {
  errorMessage.classList.add("hidden");
}

function showLoading(show) {
  if (show) {
    loading.classList.remove("hidden");
  } else {
    loading.classList.add("hidden");
  }
}

function showStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove("hidden");

  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusMessage.classList.add("hidden");
  }, 5000);
}

// Modal Helper Functions
function showPreviewModal(data) {
  // Convert data to YAML for display
  const yamlData = jsonToYaml(data);
  previewContent.textContent = yamlData;
  previewModal.classList.remove("hidden");

  // Store the data for modal actions
  extractedData = data;
}

function hidePreviewModal() {
  previewModal.classList.add("hidden");
}

async function handleModalCopy() {
  try {
    const yamlData = jsonToYaml(extractedData);

    // Copy YAML to clipboard
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      world: "MAIN",
      func: (text) => {
        return navigator.clipboard
          .writeText(text)
          .then(() => true)
          .catch(() => false);
      },
      args: [yamlData],
    });

    showStatus("✓ Data copied to clipboard!", "success");
  } catch (error) {
    console.error("Copy error:", error);
    showStatus("Failed to copy to clipboard", "error");
  }
}

async function handleModalAnalyze() {
  try {
    // Get preferences
    const autoSubmit = autoSubmitToggle.checked;
    const tempChat = tempChatToggle.checked;

    // Ensure data is stored with preferences
    await chrome.storage.local.set({
      growwStockData: extractedData,
      growwAnalysisRequest: true,
      autoSubmit: autoSubmit,
      tempChat: tempChat,
      lastExtracted: Date.now(),
    });

    console.log(
      "📊 Opening ChatGPT with auto-submit:",
      autoSubmit,
      "temp-chat:",
      tempChat
    );

    // Build ChatGPT URL with parameters
    let chatGPTUrl = "https://chatgpt.com/?groww_analysis=true";
    if (tempChat) {
      chatGPTUrl += "&temporary-chat=true";
    }

    // Open ChatGPT in a new tab
    await chrome.tabs.create({
      url: chatGPTUrl,
      active: true,
    });

    // Hide modal
    hidePreviewModal();

    showStatus(
      autoSubmit
        ? "✓ Opening ChatGPT - will auto-submit..."
        : "✓ Opening ChatGPT - review before sending",
      "success"
    );

    // Close popup after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
  } catch (error) {
    console.error("Modal analyze error:", error);
    showStatus("Failed to open ChatGPT. Please try again.", "error");
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
