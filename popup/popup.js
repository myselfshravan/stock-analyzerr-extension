// DOM Elements
const stockInfo = document.getElementById('stock-info');
const stockName = document.getElementById('stock-name');
const stockPrice = document.getElementById('stock-price');
const stockChange = document.getElementById('stock-change');
const errorMessage = document.getElementById('error-message');
const extractBtn = document.getElementById('extract-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const statusMessage = document.getElementById('status-message');
const loading = document.getElementById('loading');
const autoSubmitToggle = document.getElementById('auto-submit-toggle');

let currentTabId = null;
let extractedData = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  try {
    // Load auto-submit preference
    const { autoSubmit } = await chrome.storage.local.get(['autoSubmit']);
    autoSubmitToggle.checked = autoSubmit !== false; // Default true

    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTabId = tab.id;

    // Check if we're on a Groww stock page
    const isGrowwStock = tab.url && tab.url.match(/^https:\/\/groww\.in\/stocks\/.+/);

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
    console.error('Initialization error:', error);
    showStatus('Failed to initialize extension', 'error');
    showLoading(false);
  }
}

// Save toggle state when changed
autoSubmitToggle.addEventListener('change', async () => {
  const isChecked = autoSubmitToggle.checked;
  await chrome.storage.local.set({ autoSubmit: isChecked });
  console.log('Auto-submit preference saved:', isChecked);

  showStatus(
    isChecked
      ? 'Auto-submit enabled - ChatGPT will auto-send'
      : 'Auto-submit disabled - you can review before sending',
    'info'
  );
});

async function getBasicStockInfo(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Try multiple possible selectors for stock name
        const nameSelectors = [
          'h1.usph14Head',
          'h1[class*="stock"]',
          'h1',
          '.stock-name',
          '[data-testid="stock-name"]'
        ];

        let name = 'Stock';
        for (const selector of nameSelectors) {
          const el = document.querySelector(selector);
          if (el && el.innerText) {
            name = el.innerText.trim();
            break;
          }
        }

        // Try to get price
        const priceSelectors = [
          'span.uht141Pri',
          '[class*="price"]',
          '[data-testid="current-price"]'
        ];

        let price = '';
        for (const selector of priceSelectors) {
          const el = document.querySelector(selector);
          if (el && el.innerText) {
            price = el.innerText.trim();
            break;
          }
        }

        // Try to get change
        const changeSelectors = [
          'div.uht141Day',
          '[class*="change"]',
          '[data-testid="day-change"]'
        ];

        let change = '';
        for (const selector of changeSelectors) {
          const el = document.querySelector(selector);
          if (el && el.innerText) {
            change = el.innerText.trim();
            break;
          }
        }

        return { name, price, change };
      }
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
        if (change.includes('+') || change.includes('▲')) {
          stockChange.classList.add('positive');
        } else if (change.includes('-') || change.includes('▼')) {
          stockChange.classList.add('negative');
        }
      }

      stockInfo.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error getting stock info:', error);
    // Don't show error, just don't display the info
  }
}

// Button Event Listeners
extractBtn.addEventListener('click', handleExtract);
analyzeBtn.addEventListener('click', handleAnalyze);

async function handleExtract() {
  try {
    // CLEAR OLD DATA FIRST to prevent stale data
    console.log('🗑️ Clearing old stock data from storage...');
    await chrome.storage.local.remove(['growwStockData', 'growwAnalysisRequest']);

    showLoading(true);
    extractBtn.disabled = true;

    // Execute the extraction script
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      files: ['scripts/dom-extractor.js']
    });

    // Now call the extraction function
    const [extractResult] = await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      func: () => {
        if (typeof window.extractGrowwStockData === 'function') {
          return window.extractGrowwStockData();
        } else {
          throw new Error('Extraction function not found');
        }
      }
    });

    if (extractResult && extractResult.result) {
      const result = extractResult.result;

      // CHECK FOR VALIDATION ERRORS
      if (result.error) {
        console.error('❌ Extraction validation failed:', result.message);
        showStatus(`❌ ${result.message}`, 'error');
        showLoading(false);
        extractBtn.disabled = false;
        return; // Don't proceed
      }

      // Success - use result.data
      extractedData = result.data;

      // Store in chrome.storage
      await chrome.storage.local.set({
        growwStockData: extractedData,
        lastExtracted: Date.now()
      });

      // Copy to clipboard
      await copyToClipboard(extractedData);

      showStatus('✓ Data extracted and copied to clipboard!', 'success');
    } else {
      throw new Error('No data extracted');
    }

    showLoading(false);
    extractBtn.disabled = false;
  } catch (error) {
    console.error('Extraction error:', error);
    showStatus('Failed to extract data. Please try again.', 'error');
    showLoading(false);
    extractBtn.disabled = false;
  }
}

async function handleAnalyze() {
  try {
    showLoading(true);
    analyzeBtn.disabled = true;

    // If data not already extracted, extract it first
    if (!extractedData) {
      const stored = await chrome.storage.local.get(['growwStockData']);

      if (stored.growwStockData) {
        extractedData = stored.growwStockData;
      } else {
        // Need to extract first
        await handleExtract();

        // Check if extraction succeeded
        if (!extractedData) {
          throw new Error('Failed to extract data');
        }
      }
    }

    // Get auto-submit preference
    const autoSubmit = autoSubmitToggle.checked;

    // Ensure data is stored with auto-submit preference
    await chrome.storage.local.set({
      growwStockData: extractedData,
      growwAnalysisRequest: true,
      autoSubmit: autoSubmit, // Pass auto-submit setting
      lastExtracted: Date.now()
    });

    console.log('📊 Opening ChatGPT with auto-submit:', autoSubmit);

    // Open ChatGPT in a new tab
    const tab = await chrome.tabs.create({
      url: 'https://chatgpt.com/?groww_analysis=true',
      active: true
    });

    showStatus(
      autoSubmit
        ? '✓ Opening ChatGPT - will auto-submit...'
        : '✓ Opening ChatGPT - review before sending',
      'success'
    );

    // Close popup after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);

  } catch (error) {
    console.error('Analysis error:', error);
    showStatus('Failed to open ChatGPT. Please try again.', 'error');
    showLoading(false);
    analyzeBtn.disabled = false;
  }
}

async function copyToClipboard(data) {
  const jsonString = JSON.stringify(data, null, 2);

  try {
    // Method 1: Try using the clipboard API in the page context
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      world: 'MAIN',
      func: (text) => {
        return navigator.clipboard.writeText(text)
          .then(() => true)
          .catch(() => false);
      },
      args: [jsonString]
    });
  } catch (error) {
    console.log('Method 1 failed, trying fallback:', error);

    // Method 2: Fallback using execCommand
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      func: (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      },
      args: [jsonString]
    });
  }
}

// UI Helper Functions
function showError() {
  errorMessage.classList.remove('hidden');
  stockInfo.classList.add('hidden');
  extractBtn.disabled = true;
  analyzeBtn.disabled = true;
}

function hideError() {
  errorMessage.classList.add('hidden');
}

function showLoading(show) {
  if (show) {
    loading.classList.remove('hidden');
  } else {
    loading.classList.add('hidden');
  }
}

function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');

  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 5000);
}
