// Floating Action Button (FAB) for Groww Pages
// Provides quick access to AI analysis from any Groww stock page

console.log("Stock Analyzerr FAB: Initializing...");

// Check if FAB already exists
if (document.getElementById("groww-ai-fab")) {
  console.log("Stock Analyzerr FAB: Already exists, skipping");
} else {
  createFloatingActionButton();
}

function createFloatingActionButton() {
  // Create FAB container
  const fab = document.createElement("div");
  fab.id = "groww-ai-fab";
  fab.innerHTML = `
    <div class="fab-button" id="fab-button" title="Analyze with AI">
      <span class="fab-icon">🤖</span>
    </div>
    <div class="fab-toast" id="fab-toast"></div>

    <!-- Preview Modal for FAB -->
    <div id="fab-preview-modal" class="fab-modal-overlay fab-hidden">
      <div class="fab-modal-container">
        <div class="fab-modal-header">
          <h2>📊 Extracted Stock Data</h2>
          <button id="fab-modal-close-btn" class="fab-modal-close-btn" title="Close">✕</button>
        </div>

        <div class="fab-modal-body">
          <p class="fab-modal-description">
            This is the data that will be sent to ChatGPT for analysis:
          </p>
          <div class="fab-preview-container">
            <pre id="fab-preview-content" class="fab-preview-content"></pre>
          </div>
        </div>

        <div class="fab-modal-footer">
          <button id="fab-modal-copy-btn" class="fab-btn fab-btn-copy">
            <span class="fab-btn-icon">📋</span>
            <span class="fab-btn-text">Copy to Clipboard</span>
          </button>
          <button id="fab-modal-analyze-btn" class="fab-btn fab-btn-primary">
            <span class="fab-btn-icon">🤖</span>
            <span class="fab-btn-text">Analyze with ChatGPT</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
    #groww-ai-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .fab-button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      position: relative;
    }

    .fab-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15);
    }

    .fab-button:active {
      transform: scale(1.05);
    }

    .fab-button.loading {
      pointer-events: none;
    }

    .fab-button.loading .fab-icon {
      animation: fab-spin 1s linear infinite;
    }

    .fab-icon {
      font-size: 28px;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    @keyframes fab-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes fab-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .fab-button.pulse {
      animation: fab-pulse 2s ease-in-out infinite;
    }

    .fab-toast {
      position: absolute;
      bottom: 70px;
      right: 0;
      background: white;
      color: #2d3748;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
      pointer-events: none;
    }

    .fab-toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    .fab-toast.success {
      background: #48bb78;
      color: white;
    }

    .fab-toast.error {
      background: #f56565;
      color: white;
    }

    /* Hide FAB on mobile for better UX */
    @media (max-width: 768px) {
      #groww-ai-fab {
        bottom: 80px;
        right: 16px;
      }
      .fab-button {
        width: 48px;
        height: 48px;
      }
      .fab-icon {
        font-size: 24px;
      }
    }

    /* FAB Modal Styles */
    .fab-hidden {
      display: none !important;
    }

    .fab-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000000;
      animation: fabFadeIn 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    @keyframes fabFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .fab-modal-container {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: fabSlideUp 0.3s ease;
    }

    @keyframes fabSlideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .fab-modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px 12px 0 0;
    }

    .fab-modal-header h2 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .fab-modal-close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 20px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      padding: 0;
      line-height: 1;
    }

    .fab-modal-close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .fab-modal-body {
      padding: 20px 24px;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .fab-modal-description {
      font-size: 14px;
      color: #4a5568;
      margin: 0;
    }

    .fab-preview-container {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      flex: 1;
      min-height: 250px;
      max-height: 450px;
    }

    .fab-preview-content {
      margin: 0;
      padding: 16px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: #2d3748;
      overflow-x: auto;
      overflow-y: auto;
      max-height: 450px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .fab-modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      background: #f7fafc;
      border-radius: 0 0 12px 12px;
    }

    .fab-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .fab-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .fab-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .fab-btn-copy {
      background: #e2e8f0;
      color: #2d3748;
    }

    .fab-btn-copy:hover {
      background: #cbd5e0;
    }

    .fab-btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .fab-btn-primary:hover {
      background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);
    }

    .fab-btn-icon {
      font-size: 16px;
    }

    .fab-btn-text {
      letter-spacing: 0.3px;
    }

    @media (max-width: 768px) {
      .fab-modal-container {
        width: 95%;
        max-height: 90vh;
      }

      .fab-modal-footer {
        flex-direction: column;
      }

      .fab-btn {
        width: 100%;
      }
    }
  `;

  document.head.appendChild(style);
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
