// Content script for Groww stock pages
// This script runs automatically on all Groww stock pages

console.log("Groww content script loaded on:", window.location.href);

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in Groww content script:", message);

  if (message.action === "extractData") {
    handleExtraction(sendResponse);
    return true; // Keep the message channel open for async response
  }

  if (message.action === "getBasicInfo") {
    const basicInfo = getBasicStockInfo();
    sendResponse({ success: true, data: basicInfo });
    return true;
  }

  return false;
});

// Handle data extraction
async function handleExtraction(sendResponse) {
  try {
    // Check if extraction function is available
    if (typeof window.extractGrowwStockData !== "function") {
      // Load the extraction script
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("scripts/dom-extractor.js");
      document.head.appendChild(script);

      // Wait for script to load
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    // Execute extraction
    const stockData = window.extractGrowwStockData();

    // Store in chrome.storage
    await chrome.storage.local.set({
      growwStockData: stockData,
      lastExtracted: Date.now(),
    });

    console.log("Data extracted and stored:", stockData);

    sendResponse({
      success: true,
      data: stockData,
    });
  } catch (error) {
    console.error("Extraction error:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Get basic stock info for popup display
function getBasicStockInfo() {
  const info = {
    name: "Stock",
    price: "",
    change: "",
  };

  // Try multiple selectors for stock name
  const nameSelectors = [
    "h1.usph14Head",
    'h1[class*="stock"]',
    "h1",
    ".stock-name",
  ];

  for (const selector of nameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText) {
      info.name = element.innerText.trim();
      break;
    }
  }

  // Try to get price
  const priceSelectors = [
    "span.uht141Pri",
    '[class*="price"]',
    '[data-testid="current-price"]',
  ];

  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText) {
      info.price = element.innerText.trim();
      break;
    }
  }

  // Try to get change
  const changeSelectors = [
    "div.uht141Day",
    '[class*="change"]',
    '[data-testid="day-change"]',
  ];

  for (const selector of changeSelectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText) {
      info.change = element.innerText.trim();
      break;
    }
  }

  return info;
}

// Optional: Auto-extract on page load and cache the data
// This makes the popup faster
(function autoCache() {
  // Wait for page to be fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", performAutoCache);
  } else {
    performAutoCache();
  }
})();

async function performAutoCache() {
  // Check if we should auto-cache (don't do it too frequently)
  const { lastExtracted } = await chrome.storage.local.get(["lastExtracted"]);
  const now = Date.now();

  // Only auto-cache if last extraction was more than 5 minutes ago
  if (!lastExtracted || now - lastExtracted > 5 * 60 * 1000) {
    console.log("Auto-caching stock data...");

    // Give the page time to load (wait 2 seconds)
    setTimeout(async () => {
      try {
        if (typeof window.extractGrowwStockData === "function") {
          const stockData = window.extractGrowwStockData();
          await chrome.storage.local.set({
            growwStockData: stockData,
            lastExtracted: Date.now(),
          });
          console.log("Stock data auto-cached");
        }
      } catch (error) {
        console.log("Auto-cache failed:", error);
      }
    }, 2000);
  }
}

console.log("Groww content script initialized successfully");
