// Background Service Worker for Groww to ChatGPT Extension
// This runs in the background and handles extension lifecycle events

console.log("Background service worker starting...");

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed/updated:", details.reason);

  if (details.reason === "install") {
    console.log("🎉 Groww to ChatGPT extension installed successfully!");

    // Initialize storage
    chrome.storage.local.set({
      installDate: new Date().toISOString(),
      version: chrome.runtime.getManifest().version,
    });

    // Optional: Open a welcome page
    // chrome.tabs.create({
    //   url: 'https://github.com/your-repo/groww-extension'
    // });
  } else if (details.reason === "update") {
    console.log(
      "Extension updated to version:",
      chrome.runtime.getManifest().version
    );
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.action === "openChatGPT") {
    handleOpenChatGPT(message.data, sendResponse);
    return true; // Keep message channel open for async response
  }

  if (message.action === "getStoredData") {
    handleGetStoredData(sendResponse);
    return true;
  }

  if (message.action === "clearData") {
    handleClearData(sendResponse);
    return true;
  }

  if (message.action === "extractFromFAB") {
    handleExtractFromFAB(sender.tab.id, sendResponse);
    return true; // Keep message channel open for async response
  }

  return false;
});

// Handle opening ChatGPT with the analysis prompt
async function handleOpenChatGPT(stockData, sendResponse) {
  try {
    // Store the data if provided
    if (stockData) {
      await chrome.storage.local.set({
        growwStockData: stockData,
        growwAnalysisRequest: true,
        lastExtracted: Date.now(),
      });
    }

    // Create a new tab with ChatGPT
    const tab = await chrome.tabs.create({
      url: "https://chatgpt.com/?groww_analysis=true",
      active: true,
    });

    console.log("✓ ChatGPT tab created:", tab.id);

    sendResponse({
      success: true,
      tabId: tab.id,
    });
  } catch (error) {
    console.error("Error opening ChatGPT:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Handle retrieving stored data
async function handleGetStoredData(sendResponse) {
  try {
    const data = await chrome.storage.local.get([
      "growwStockData",
      "lastExtracted",
      "growwAnalysisRequest",
    ]);

    sendResponse({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error getting stored data:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Handle clearing stored data
async function handleClearData(sendResponse) {
  try {
    await chrome.storage.local.remove([
      "growwStockData",
      "lastExtracted",
      "growwAnalysisRequest",
    ]);

    console.log("✓ Stored data cleared");

    sendResponse({
      success: true,
    });
  } catch (error) {
    console.error("Error clearing data:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Handle extraction from FAB button
async function handleExtractFromFAB(tabId, sendResponse) {
  try {
    console.log("📊 FAB extraction requested for tab:", tabId);

    // First inject the dom-extractor script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["scripts/dom-extractor.js"],
    });

    // Then call the extraction function
    const [extractResult] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        if (typeof window.extractGrowwStockData === "function") {
          return window.extractGrowwStockData();
        } else {
          throw new Error("Extraction function not found");
        }
      },
    });

    if (!extractResult || !extractResult.result) {
      throw new Error("No data extracted");
    }

    console.log("✓ FAB extraction successful");

    sendResponse({
      success: true,
      result: extractResult.result,
    });
  } catch (error) {
    console.error("❌ FAB extraction error:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Optional: Monitor tab updates for ChatGPT pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // When a ChatGPT tab finishes loading with our analysis parameter
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("chatgpt.com") &&
    tab.url.includes("groww_analysis=true")
  ) {
    console.log("📊 ChatGPT analysis tab loaded:", tabId);

    // The content script will handle the auto-injection
    // We could send additional messages here if needed
  }
});

// Optional: Handle extension icon click (if not using popup)
// chrome.action.onClicked.addListener((tab) => {
//   console.log('Extension icon clicked on tab:', tab.id);
// });

// Handle errors
self.addEventListener("error", (event) => {
  console.error("Service worker error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// Keep service worker alive if needed (for long-running operations)
// Note: Service workers in MV3 are designed to be ephemeral
// Use chrome.storage for persistence, not global variables

// Optional: Set up periodic tasks (if needed in future)
// chrome.alarms.create('periodicTask', { periodInMinutes: 60 });
// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === 'periodicTask') {
//     console.log('Periodic task triggered');
//     // Perform periodic operations here
//   }
// });

console.log("✅ Background service worker initialized successfully");
