# 🚀 Groww to ChatGPT Chrome Extension - Implementation Plan

## 📋 Project Overview

**Goal:** Build a Chrome Extension (Manifest V3) that extracts stock data from Groww.in pages and automatically analyzes it in ChatGPT with zero manual intervention.

**User Flow:**
1. User visits any Groww stock page (e.g., `https://groww.in/stocks/hindustan-aeronautics-ltd`)
2. Clicks extension icon → popup appears
3. Clicks "Extract & Copy Data" → JSON data copied to clipboard
4. Clicks "Analyze with ChatGPT" → ChatGPT opens in new tab
5. Data is auto-pasted and submitted to ChatGPT with analysis prompt
6. User receives instant AI analysis of the stock

---

## 🗂️ File Structure

```
groww-extension/
├── manifest.json                       # Extension configuration (MV3)
├── background.js                       # Service worker for background tasks
├── popup/
│   ├── popup.html                     # Extension popup UI
│   ├── popup.js                       # Popup button handlers & logic
│   └── popup.css                      # Popup styling
├── scripts/
│   ├── content-groww.js               # Content script for Groww.in
│   ├── content-chatgpt.js             # Content script for ChatGPT
│   └── dom-extractor.js               # DOM extraction logic
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── README.md                           # Installation & usage guide
└── claude.md                           # This implementation plan
```

---

## 🔧 Technical Implementation Details

### 1. manifest.json (Manifest V3)

**Required Permissions:**
- `scripting` - To inject scripts into Groww pages
- `activeTab` - Temporary access to current tab (no permission warnings)
- `storage` - To store extracted data between popup and content scripts
- `clipboardWrite` - To copy data to clipboard

**Host Permissions:**
- `https://groww.in/stocks/*` - Access to Groww stock pages only
- `https://chatgpt.com/*` - Access to ChatGPT for auto-injection

**Content Scripts:**
- Groww script: Runs on `https://groww.in/stocks/*` at `document_end`
- ChatGPT script: Runs on `https://chatgpt.com/*` at `document_end`

**Key Configuration:**
```json
{
  "manifest_version": 3,
  "name": "Groww to ChatGPT Stock Analyzer",
  "version": "1.0.0",
  "description": "Extract stock data from Groww and auto-analyze in ChatGPT",
  "permissions": ["scripting", "activeTab", "storage", "clipboardWrite"],
  "host_permissions": [
    "https://groww.in/stocks/*",
    "https://chatgpt.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://groww.in/stocks/*"],
      "js": ["scripts/content-groww.js"],
      "run_at": "document_end"
    },
    {
      "matches": ["https://chatgpt.com/*"],
      "js": ["scripts/content-chatgpt.js"],
      "run_at": "document_end"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

### 2. Popup UI (popup.html, popup.css, popup.js)

**Design:**
- Clean, minimal interface
- Shows current stock name (if on Groww page)
- Two primary action buttons
- Status messages for user feedback
- Error state for non-Groww pages

**HTML Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h1>Groww → ChatGPT</h1>

    <div id="stock-info">
      <div id="stock-name">Loading...</div>
      <div id="stock-price"></div>
    </div>

    <div id="error-message" class="hidden">
      Not a supported Groww stock page.
    </div>

    <div id="button-container">
      <button id="extract-btn" class="primary-btn">
        📋 Extract & Copy Data
      </button>
      <button id="analyze-btn" class="secondary-btn">
        🤖 Analyze with ChatGPT
      </button>
    </div>

    <div id="status-message"></div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

**Key JavaScript Logic (popup.js):**
1. On popup open, check if current tab is a Groww stock page
2. If yes, extract and display basic stock info
3. "Extract & Copy" button:
   - Execute DOM extraction script in active tab
   - Store data in chrome.storage.local
   - Copy JSON to clipboard
   - Show success message
4. "Analyze with ChatGPT" button:
   - Ensure data is extracted (run extraction if not)
   - Store data with special flag `growwAnalysisRequest: true`
   - Open ChatGPT in new tab with parameter `?groww_analysis=true`

**Communication Pattern:**
```javascript
// Check if on Groww stock page
chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
  const url = tabs[0].url;
  const isGrowwStock = url.match(/^https:\/\/groww\.in\/stocks\/.+/);

  if (!isGrowwStock) {
    showError();
    return;
  }

  // Get stock name from page
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => document.querySelector('h1')?.innerText
  });

  displayStockName(result.result);
});
```

---

### 3. DOM Extraction Script (scripts/dom-extractor.js)

**Strategy:**
Based on the Groww page HTML structure from sample_1.html, extract:

**Key Data Points:**
- Stock name
- Current price
- Day change (% and absolute)
- Market cap
- P/E ratio
- 52-week high/low
- Volume
- Book value
- Dividend yield
- ROE, ROCE, EPS
- Debt-to-equity
- Revenue, profit, assets
- Shareholding pattern
- Pros/cons (if available)

**Extraction Approach:**
```javascript
function extractGrowwStockData() {
  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,

    // Basic info
    stockName: extractText('h1.usph14Head'),
    symbol: extractFromURL(),
    currentPrice: extractText('span.uht141Pri'),
    dayChange: extractText('div.uht141Day'),

    // Fundamentals
    marketCap: extractKeyValue('Market Cap'),
    peRatio: extractKeyValue('P/E Ratio'),
    bookValue: extractKeyValue('Book Value'),
    dividendYield: extractKeyValue('Dividend Yield'),
    roe: extractKeyValue('ROE'),
    roce: extractKeyValue('ROCE'),
    eps: extractKeyValue('EPS'),

    // Financials
    revenue: extractFinancial('Revenue'),
    profit: extractFinancial('Net Profit'),
    debtToEquity: extractKeyValue('Debt to Equity'),

    // Additional data
    week52High: extractKeyValue('52W High'),
    week52Low: extractKeyValue('52W Low'),
    volume: extractKeyValue('Volume'),

    // Qualitative
    about: extractText('.gsd23CompProfile'),
    pros: extractList('.pros-section'),
    cons: extractList('.cons-section')
  };

  return data;
}

// Helper functions
function extractText(selector) {
  const element = document.querySelector(selector);
  return element ? element.innerText.trim() : 'N/A';
}

function extractKeyValue(label) {
  const elements = Array.from(document.querySelectorAll('td, div'));
  const labelEl = elements.find(el => el.innerText.includes(label));
  if (labelEl) {
    const valueEl = labelEl.nextElementSibling;
    return valueEl ? valueEl.innerText.trim() : 'N/A';
  }
  return 'N/A';
}

function extractFromURL() {
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1];
}
```

**Note:** The actual selectors will be determined by inspecting the live Groww page structure, as the HTML classes may differ from the saved sample.

---

### 4. Content Script for Groww (scripts/content-groww.js)

**Purpose:**
- Listen for extraction requests from popup
- Execute DOM extraction
- Send data back to popup
- Store data in chrome.storage.local

**Implementation:**
```javascript
// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractData') {
    try {
      // Import and execute the extraction function
      const stockData = extractGrowwStockData();

      // Store in chrome.storage
      chrome.storage.local.set({
        growwStockData: stockData,
        lastExtracted: Date.now()
      });

      // Send back to popup
      sendResponse({
        success: true,
        data: stockData
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  return true; // Required for async sendResponse
});

// Include the extraction logic
function extractGrowwStockData() {
  // ... (DOM extraction code from dom-extractor.js)
}
```

**Alternative Approach:**
Instead of duplicating code, we can inject dom-extractor.js dynamically:

```javascript
chrome.scripting.executeScript({
  target: { tabId: currentTab.id },
  files: ['scripts/dom-extractor.js']
}).then(() => {
  chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    func: () => window.extractGrowwStockData()
  });
});
```

---

### 5. Content Script for ChatGPT (scripts/content-chatgpt.js)

**Purpose:**
- Detect when ChatGPT loads with `?groww_analysis=true` parameter
- Wait for textarea to load (ChatGPT is an SPA)
- Retrieve stored stock data
- Auto-fill textarea with prompt + data
- Auto-submit the message

**Key Challenges:**
1. ChatGPT loads dynamically (React-based SPA)
2. Need to wait for textarea to appear
3. Must trigger proper React events for input
4. Send button may be disabled initially

**Implementation:**
```javascript
// Check if this is a Groww analysis request
const urlParams = new URLSearchParams(window.location.search);
const isGrowwAnalysis = urlParams.get('groww_analysis') === 'true';

if (isGrowwAnalysis) {
  console.log('Groww analysis detected, initializing auto-paste...');
  initializeAutoAnalysis();
}

async function initializeAutoAnalysis() {
  // Get stored stock data
  const { growwStockData } = await chrome.storage.local.get(['growwStockData']);

  if (!growwStockData) {
    console.error('No stock data found in storage');
    return;
  }

  // Wait for ChatGPT textarea to load
  waitForElement('#prompt-textarea, textarea[placeholder*="Message"]', (textarea) => {
    fillAndSubmitPrompt(textarea, growwStockData);
  });
}

function waitForElement(selector, callback, timeout = 10000) {
  const startTime = Date.now();

  const observer = new MutationObserver((mutations, obs) => {
    const element = document.querySelector(selector);

    if (element) {
      obs.disconnect();
      callback(element);
    } else if (Date.now() - startTime > timeout) {
      obs.disconnect();
      console.error('Timeout waiting for element:', selector);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also check immediately in case element already exists
  const existing = document.querySelector(selector);
  if (existing) {
    observer.disconnect();
    callback(existing);
  }
}

function fillAndSubmitPrompt(textarea, stockData) {
  // Format the prompt
  const prompt = formatAnalysisPrompt(stockData);

  // Set the value
  textarea.value = prompt;

  // Trigger React events (important for React to detect the change)
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
  textarea.dispatchEvent(inputEvent);

  const changeEvent = new Event('change', { bubbles: true, cancelable: true });
  textarea.dispatchEvent(changeEvent);

  // Focus the textarea
  textarea.focus();

  // Wait a bit for React to process, then find and click send button
  setTimeout(() => {
    clickSendButton();
  }, 500);
}

function clickSendButton() {
  // Try multiple possible selectors for the send button
  const possibleSelectors = [
    'button[data-testid="send-button"]',
    'button[aria-label="Send message"]',
    'button svg[class*="send"]',
    'button:has(svg)' // Button containing SVG (send icon)
  ];

  for (const selector of possibleSelectors) {
    const button = document.querySelector(selector);
    if (button && !button.disabled) {
      console.log('Clicking send button:', selector);
      button.click();

      // Clean up: remove the URL parameter
      setTimeout(() => {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }, 1000);

      return;
    }
  }

  console.error('Send button not found or disabled');
}

function formatAnalysisPrompt(stockData) {
  const preprompt = `You are an AI equity analyst. Analyze the following Groww stock data and give a clear, deep and structured breakdown:

- Overall summary
- Business model
- Strengths
- Red flags
- Financial health
- Valuation tone
- Long-term outlook

Here is the extracted data:`;

  const jsonData = JSON.stringify(stockData, null, 2);

  return `${preprompt}\n\n\`\`\`json\n${jsonData}\n\`\`\``;
}
```

**Fallback Strategy:**
If the auto-submit fails, the data is still pasted into the textarea, and the user can manually click send.

---

### 6. Background Service Worker (background.js)

**Purpose:**
- Handle extension installation
- Coordinate complex operations
- Listen for tab events
- Manage state if needed

**Implementation:**
```javascript
// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Groww to ChatGPT extension installed successfully');
});

// Optional: Listen for tab updates to detect ChatGPT loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // If a ChatGPT tab just finished loading with our parameter
  if (changeInfo.status === 'complete' &&
      tab.url &&
      tab.url.includes('chatgpt.com') &&
      tab.url.includes('groww_analysis=true')) {

    console.log('ChatGPT analysis tab loaded:', tabId);

    // The content script will handle the injection
    // We could send a message here if needed
  }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openChatGPT') {
    chrome.tabs.create({
      url: 'https://chatgpt.com/?groww_analysis=true',
      active: true
    }, (tab) => {
      sendResponse({ success: true, tabId: tab.id });
    });

    return true; // Keep message channel open for async response
  }
});
```

**Note:** For this extension, the background worker is relatively simple since most logic is in content scripts and popup.

---

### 7. Clipboard Copy Implementation

**Challenge:**
`navigator.clipboard.writeText()` in content scripts may trigger permission prompts.

**Solution:**
Use chrome.scripting.executeScript with `world: "MAIN"` to run in page context:

```javascript
// In popup.js
async function copyDataToClipboard(data) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN', // Run in page context, not isolated
      func: (jsonString) => {
        navigator.clipboard.writeText(jsonString)
          .then(() => console.log('Copied to clipboard'))
          .catch(err => console.error('Copy failed:', err));
      },
      args: [JSON.stringify(data, null, 2)]
    });

    return true;
  } catch (error) {
    console.error('Clipboard copy failed:', error);

    // Fallback: Use document.execCommand (deprecated but works)
    await fallbackCopy(tab.id, data);
  }
}

async function fallbackCopy(tabId, data) {
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (text) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    },
    args: [JSON.stringify(data, null, 2)]
  });
}
```

---

### 8. Extension Icons

**Design Approach:**
- Simple, recognizable icon
- Represents stock/chart + AI/automation
- Use Groww brand colors (green) or stock market theme (green/red)
- Must be clear at 16px size

**Icon Sizes:**
- 16x16: Toolbar icon
- 32x32: Extension management page
- 48x48: Extension management page
- 128x128: Chrome Web Store

**Creation Options:**
1. Use SVG and convert to PNG at different sizes
2. Create simple geometric design (line chart + sparkle/AI icon)
3. Use online icon generators or Figma

**Placeholder Approach:**
For initial development, create simple colored squares with text/symbols as placeholders.

---

## 🧪 Testing Checklist

### Phase 1: Basic Setup
- [ ] Extension loads without errors in chrome://extensions
- [ ] Popup opens when clicking extension icon
- [ ] Manifest permissions are accepted

### Phase 2: Groww Page Testing
- [ ] Extension detects Groww stock pages correctly
- [ ] Shows error on non-Groww pages
- [ ] DOM extraction captures all required data
- [ ] Stock name displays in popup
- [ ] "Extract & Copy" button works
- [ ] Data is copied to clipboard
- [ ] Data is stored in chrome.storage.local

### Phase 3: ChatGPT Integration
- [ ] "Analyze with ChatGPT" button opens new tab
- [ ] ChatGPT URL includes `?groww_analysis=true` parameter
- [ ] Content script detects the parameter
- [ ] Textarea is detected and data is pasted
- [ ] Prompt format is correct (preprompt + JSON)
- [ ] Send button is clicked automatically
- [ ] Message is submitted successfully
- [ ] URL parameter is cleaned up after submission

### Phase 4: Edge Cases
- [ ] Works with different Groww stocks (large cap, small cap, new listings)
- [ ] Handles missing data gracefully (N/A values)
- [ ] Works if ChatGPT is already open in another tab
- [ ] Handles slow network (MutationObserver timeout)
- [ ] Works across browser restarts (data persistence)

### Phase 5: User Experience
- [ ] Status messages are clear and helpful
- [ ] Buttons are disabled when not applicable
- [ ] Loading states are shown
- [ ] Errors are user-friendly
- [ ] Icons are visible and clear

---

## 🚀 Deployment Steps

### Development Mode
1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `groww-extension` folder
5. Extension should appear in toolbar

### Testing Workflow
1. Navigate to a Groww stock page (e.g., Hindustan Aeronautics Ltd)
2. Click extension icon
3. Verify stock name is displayed
4. Click "Extract & Copy Data"
5. Verify success message and check clipboard
6. Click "Analyze with ChatGPT"
7. Verify ChatGPT opens and message is auto-submitted
8. Review the AI analysis

### Debugging
- Use `chrome://extensions` → "Inspect views: service worker" for background.js
- Use `Inspect` on popup for popup.js debugging
- Use browser DevTools on Groww/ChatGPT pages for content script debugging
- Check Console for any error messages

---

## 🎯 Future Enhancements (Optional)

### Phase 2 Features
1. **Price Alerts**
   - Monitor stock price changes
   - Show browser notifications
   - Set custom thresholds

2. **Option Chain Analysis**
   - Extract option chain data
   - Analyze options strategies
   - Send to ChatGPT for insights

3. **Multi-Stock Batch Mode**
   - Queue multiple stocks
   - Batch analysis in ChatGPT
   - Compare multiple stocks

4. **Notion Integration**
   - Save analysis to Notion database
   - Create stock research notes
   - Track portfolio decisions

5. **Historical Tracking**
   - Store extraction history
   - Show previous analyses
   - Track stock over time

6. **Export Formats**
   - CSV export
   - PDF reports
   - Excel spreadsheet

### Technical Improvements
- Add TypeScript for type safety
- Implement comprehensive error handling
- Add retry logic for failed operations
- Create settings page for customization
- Add keyboard shortcuts
- Implement caching for repeated analyses

---

## 📚 Resources & References

### Chrome Extension Documentation
- [Getting Started](https://developer.chrome.com/docs/extensions/get-started)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Scripting API](https://developer.chrome.com/docs/extensions/reference/scripting/)
- [Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)

### Key APIs Used
- `chrome.scripting.executeScript()` - Inject code into pages
- `chrome.storage.local` - Store data persistently
- `chrome.tabs.create()` - Open new tabs
- `chrome.runtime.onMessage` - Listen for messages
- `navigator.clipboard` - Copy to clipboard
- `MutationObserver` - Detect DOM changes

### Best Practices
- Always use `manifest_version: 3`
- Request minimal permissions
- Handle async operations properly
- Implement proper error handling
- Clean up observers and listeners
- Provide user feedback for all actions

---

## 🔒 Security Considerations

1. **Data Privacy**
   - Stock data is stored locally only
   - No external servers or analytics
   - Data is cleared after use (optional)

2. **Permissions**
   - Only access specific Groww and ChatGPT domains
   - Use `activeTab` to minimize permission warnings
   - No access to browsing history or other tabs

3. **Code Injection**
   - Only inject into user-approved domains
   - Validate all extracted data before processing
   - No eval() or unsafe code execution

4. **User Control**
   - Explicit user action required for all operations
   - Clear messaging about what extension does
   - Easy to disable or uninstall

---

## ✅ Success Criteria

The extension is considered complete when:

1. ✅ User can extract stock data from any Groww stock page
2. ✅ Data is accurately parsed and structured
3. ✅ Data is copied to clipboard with one click
4. ✅ ChatGPT opens and receives the data automatically
5. ✅ Analysis prompt is correctly formatted
6. ✅ Message is submitted without user intervention
7. ✅ Extension works reliably across different stocks
8. ✅ Error states are handled gracefully
9. ✅ Code is clean, documented, and maintainable
10. ✅ README provides clear installation and usage instructions

---

## 📝 Implementation Timeline

### Phase 1: Core Setup (30 min)
- Create folder structure
- Write manifest.json
- Create basic popup UI
- Generate placeholder icons

### Phase 2: Groww Integration (45 min)
- Analyze Groww page structure
- Write DOM extraction logic
- Create content script
- Test data extraction

### Phase 3: ChatGPT Integration (45 min)
- Create ChatGPT content script
- Implement MutationObserver
- Write auto-fill and submit logic
- Test end-to-end flow

### Phase 4: Polish & Testing (30 min)
- Add error handling
- Improve UI/UX
- Write README
- Test edge cases

**Total Estimated Time: ~2.5 hours**

---

## 🎉 Final Notes

This extension demonstrates:
- Chrome Extension MV3 best practices
- Cross-domain communication
- Dynamic content injection
- SPA interaction (ChatGPT)
- Clipboard API usage
- Storage API for state management
- User experience design for browser extensions

The modular architecture allows for easy future enhancements and maintenance. Each component is isolated and can be updated independently.

**Let's build something amazing! 🚀**
