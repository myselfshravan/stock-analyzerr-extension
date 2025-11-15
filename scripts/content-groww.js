console.log("Groww content script loaded on:", window.location.href);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in Groww content script:", message);

  if (message.action === "extractData") {
    handleExtraction(sendResponse);
    return true;
  }

  if (message.action === "getBasicInfo") {
    const basicInfo = getBasicStockInfo();
    sendResponse({ success: true, data: basicInfo });
    return true;
  }

  return false;
});

async function handleExtraction(sendResponse) {
  try {
    if (typeof window.extractGrowwStockData !== "function") {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("scripts/dom-extractor.js");
      document.head.appendChild(script);

      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const stockData = window.extractGrowwStockData();

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

function getBasicStockInfo() {
  const info = {
    name: "Stock",
    price: "",
    change: "",
  };

  const nameSelectors = [
    'h1[class*="stock"]',
    "h1",
    "[data-testid='stock-name']",
  ];

  for (const selector of nameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText) {
      info.name = element.innerText.trim();
      break;
    }
  }

  const priceSelectors = ['[class*="price"]', '[data-testid="current-price"]'];

  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText) {
      info.price = element.innerText.trim();
      break;
    }
  }

  const changeSelectors = ['[class*="change"]', '[data-testid="day-change"]'];

  for (const selector of changeSelectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText) {
      info.change = element.innerText.trim();
      break;
    }
  }

  return info;
}

(function autoCache() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", performAutoCache);
  } else {
    performAutoCache();
  }
})();

async function performAutoCache() {
  const { lastExtracted } = await chrome.storage.local.get(["lastExtracted"]);
  const now = Date.now();

  if (!lastExtracted || now - lastExtracted > 5 * 60 * 1000) {
    console.log("Auto-caching stock data...");

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
