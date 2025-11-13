# 🚀 Stock Analyzerr - AI Stock Insights

> **Instantly analyze any Groww stock with AI-powered insights from ChatGPT**

A powerful Chrome Extension that extracts comprehensive stock data from Groww.in and automatically sends it to ChatGPT for deep AI analysis — with zero manual intervention.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-success)
![AI Powered](https://img.shields.io/badge/AI-Powered-blueviolet?logo=openai)
![License MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

[![GitHub](https://img.shields.io/badge/GitHub-myselfshravan/stock--analyzerr--extension-181717?logo=github)](https://github.com/myselfshravan/stock-analyzerr-extension)
[![Stars](https://img.shields.io/github/stars/myselfshravan/stock-analyzerr-extension?style=social)](https://github.com/myselfshravan/stock-analyzerr-extension/stargazers)

---

## ✨ Features

- **📊 Smart Data Extraction**: Automatically scrapes comprehensive stock data from any Groww stock page
- **🤖 AI-Powered Analysis**: Sends extracted data to ChatGPT with a pre-formatted analysis prompt
- **⚡ One-Click Operation**: Extract, copy, and analyze stock data with a single click
- **🔒 Privacy-First**: All data processed locally, no external servers
- **🎯 Zero Manual Work**: ChatGPT auto-fills and submits the analysis request
- **📋 Clipboard Support**: Instantly copy extracted JSON data to clipboard

---

## 📸 How It Works

### Step 1: Visit any Groww Stock Page
Navigate to any stock on Groww.in (e.g., `https://groww.in/stocks/hindustan-aeronautics-ltd`)

### Step 2: Click Extension Icon
Open the extension popup and see basic stock information

### Step 3: Extract & Copy (Optional)
Click "Extract & Copy Data" to copy full JSON data to clipboard

### Step 4: Analyze with ChatGPT
Click "Analyze with ChatGPT" and watch the magic:
- ChatGPT opens in a new tab
- Stock data is auto-pasted with analysis prompt
- Message is auto-submitted
- AI analysis appears instantly

---

## 🛠️ Installation

### Method 1: Load Unpacked Extension (Development)

1. **Clone or Download** this repository:
   ```bash
   git clone https://github.com/myselfshravan/stock-analyzerr-extension.git
   cd stock-analyzerr-extension
   ```

2. **Open Chrome Extensions Page**:
   - Navigate to `chrome://extensions/`
   - Or click Menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**:
   - Click "Load unpacked"
   - Select the `groww-extension` folder
   - The extension should now appear in your toolbar

5. **Pin the Extension** (Optional):
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Groww to ChatGPT Stock Analyzer"
   - Click the pin icon to keep it visible

### Method 2: Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store soon!

---

## 📋 Usage Guide

### Basic Workflow

1. **Navigate to a Groww Stock Page**
   ```
   https://groww.in/stocks/any-stock-name
   ```

2. **Click the Extension Icon**
   - The popup will show if you're on a valid Groww stock page
   - Stock name and basic info will be displayed

3. **Extract Data** (Optional)
   - Click "📋 Extract & Copy Data"
   - Full JSON data is copied to your clipboard
   - Status message confirms success

4. **Analyze with ChatGPT**
   - Click "🤖 Analyze with ChatGPT"
   - ChatGPT opens automatically
   - Data is pasted and submitted
   - Wait for AI analysis

### Example Stocks to Try

- [Hindustan Aeronautics Ltd](https://groww.in/stocks/hindustan-aeronautics-ltd)
- [Billionbrains Garage Ventures Ltd](https://groww.in/stocks/billionbrains-garage-ventures-ltd)
- [Ather Energy Ltd](https://groww.in/stocks/ather-energy-ltd)
- Any other stock on Groww.in!

---

## 📊 Extracted Data Points

The extension captures comprehensive stock information:

### Basic Information
- Stock name and symbol
- Current price
- Day change (% and absolute)

### Key Metrics
- Market capitalization
- P/E ratio, P/B ratio
- Book value
- Dividend yield
- ROE, ROCE, EPS
- Face value

### Financial Data
- Revenue
- Net profit
- Sales figures
- Debt to equity ratio
- Current ratio

### Price Information
- 52-week high/low
- Volume and average volume

### Qualitative Data
- Company description
- Industry and sector
- Pros and cons (if available)
- Shareholding patterns

### Additional Data
- All table data from the page
- Timestamps and URLs

---

## 🔧 Technical Details

### Architecture

```
groww-extension/
├── manifest.json              # Extension configuration (MV3)
├── background.js              # Service worker for background tasks
├── popup/
│   ├── popup.html            # Extension popup UI
│   ├── popup.js              # Popup logic and event handlers
│   └── popup.css             # Popup styling
├── scripts/
│   ├── dom-extractor.js      # DOM parsing and data extraction
│   ├── content-groww.js      # Content script for Groww pages
│   └── content-chatgpt.js    # Content script for ChatGPT injection
└── icons/                     # Extension icons (16, 32, 48, 128px)
```

### Technology Stack

- **Manifest Version**: V3 (latest Chrome Extension standard)
- **Permissions**: `scripting`, `activeTab`, `storage`, `clipboardWrite`
- **APIs Used**:
  - `chrome.scripting.executeScript()` - Inject extraction scripts
  - `chrome.storage.local` - Store extracted data
  - `chrome.tabs.create()` - Open ChatGPT
  - `navigator.clipboard` - Copy to clipboard
  - `MutationObserver` - Detect dynamic DOM changes

### Key Features

1. **Smart DOM Extraction**: Uses multiple selector strategies to handle Groww's dynamic UI
2. **React Event Handling**: Properly triggers input events for ChatGPT's React framework
3. **MutationObserver**: Waits for ChatGPT's textarea to load (SPA detection)
4. **Fallback Mechanisms**: Multiple approaches for clipboard copy and button detection
5. **Auto-Caching**: Caches stock data on page load for faster popup interaction

---

## 🎯 AI Analysis Prompt

The extension uses this pre-formatted prompt:

```
You are an AI equity analyst. Analyze the following Groww stock data and give a clear, deep and structured breakdown:

- Overall summary
- Business model
- Strengths
- Red flags
- Financial health
- Valuation tone
- Long-term outlook

Here is the extracted data:
[JSON data]
```

---

## ⚙️ Configuration

### Modifying the Analysis Prompt

Edit the prompt in `scripts/content-chatgpt.js`:

```javascript
function formatAnalysisPrompt(stockData) {
  const preprompt = `Your custom prompt here...`;
  // ...
}
```

### Changing Extraction Selectors

If Groww updates their UI, update selectors in `scripts/dom-extractor.js`:

```javascript
stockName: extractText('h1.newClassName', 'h1'),
currentPrice: extractText('span.newPriceClass'),
// ...
```

### Adjusting ChatGPT Selectors

If ChatGPT changes their UI, update selectors in `scripts/content-chatgpt.js`:

```javascript
const possibleSelectors = [
  '#prompt-textarea',
  'textarea[placeholder*="Message"]',
  // Add new selectors here
];
```

---

## 🐛 Troubleshooting

### Extension Not Loading

**Problem**: Extension doesn't appear after loading
**Solution**:
1. Check `chrome://extensions/` for error messages
2. Ensure all files are present in the folder
3. Try reloading the extension (click reload icon)

### "Not a supported Groww stock page" Error

**Problem**: Popup shows error on Groww page
**Solution**:
1. Ensure you're on a URL matching `https://groww.in/stocks/*`
2. Not all Groww pages are supported (only stock detail pages)
3. Try a different stock page

### Data Not Copying to Clipboard

**Problem**: "Extract & Copy" doesn't copy data
**Solution**:
1. Grant clipboard permission when prompted
2. Try clicking the button again
3. Check browser console for errors (F12)

### ChatGPT Auto-Submit Not Working

**Problem**: Prompt is filled but not submitted
**Solution**:
1. This is expected behavior sometimes (ChatGPT UI changes)
2. The data is still pasted - just click Send manually
3. Check if textarea is disabled or in rate limit mode

### Missing Stock Data

**Problem**: Some fields show "N/A"
**Solution**:
1. Not all stocks have all data points
2. Some new listings may have incomplete data
3. Groww may update their page structure
4. Update the selectors in `dom-extractor.js` if needed

---

## 🔒 Privacy & Security

### Data Handling
- **Local Processing**: All data extraction happens locally in your browser
- **No External Servers**: No data is sent to external servers except ChatGPT (when you click Analyze)
- **No Tracking**: No analytics, cookies, or user tracking
- **No Ads**: Completely ad-free

### Permissions Explained
- **scripting**: Needed to inject extraction code into Groww pages
- **activeTab**: Temporary access to current tab (no permission warnings)
- **storage**: Store extracted data temporarily between popup and content scripts
- **clipboardWrite**: Copy data to clipboard

### Security Best Practices
- Extension only runs on Groww.in and ChatGPT.com
- No access to your browsing history
- No access to other tabs or websites
- Can be disabled/uninstalled anytime

---

## 🚀 Future Enhancements

### Planned Features

- [ ] **Price Alerts**: Monitor stocks and get notifications
- [ ] **Option Chain Analysis**: Extract and analyze options data
- [ ] **Multi-Stock Batch Mode**: Analyze multiple stocks at once
- [ ] **Notion Integration**: Save analysis to Notion database
- [ ] **Historical Tracking**: Track stock analyses over time
- [ ] **Export Formats**: CSV, PDF, Excel exports
- [ ] **Custom Prompts**: User-configurable analysis prompts
- [ ] **Watchlist Integration**: Quick access to watchlist stocks

### Contributions Welcome!

Have ideas for improvements? Open an issue or submit a pull request!

---

## 📝 Development

### Prerequisites

- Google Chrome (latest version)
- Basic knowledge of JavaScript
- Text editor (VS Code recommended)

### Setup Development Environment

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/groww-extension.git
   cd groww-extension
   ```

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project folder

3. **Make Changes**:
   - Edit files in your text editor
   - Most changes auto-reload (popup files)
   - For content scripts/manifest: Click reload icon in `chrome://extensions/`

4. **Debug**:
   - **Popup**: Right-click extension icon → Inspect
   - **Background**: Extensions page → Inspect views: service worker
   - **Content Scripts**: F12 on Groww/ChatGPT pages

### Project Structure

```
.
├── manifest.json              # Extension configuration
├── background.js              # Background service worker
├── popup/                     # Popup UI files
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── scripts/                   # Content and injection scripts
│   ├── dom-extractor.js
│   ├── content-groww.js
│   └── content-chatgpt.js
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── claude.md                  # Implementation plan
└── README.md                  # This file
```

### Building for Production

1. **Test Thoroughly**:
   - Test on multiple stock pages
   - Test ChatGPT integration
   - Test error handling

2. **Clean Up**:
   - Remove console.log statements
   - Update version in manifest.json

3. **Package**:
   ```bash
   zip -r groww-extension.zip . -x "*.git*" "*.DS_Store" "node_modules/*"
   ```

4. **Submit to Chrome Web Store**:
   - Create developer account
   - Upload ZIP file
   - Fill in store listing details
   - Submit for review

---

## 📄 License

MIT License - feel free to use, modify, and distribute!

---

## 🙏 Acknowledgments

- **Groww**: For providing an excellent stock research platform
- **OpenAI**: For ChatGPT's powerful analysis capabilities
- **Chrome Extension Community**: For excellent documentation and resources

---

## 📞 Support

Having issues? Here's how to get help:

1. **Check Troubleshooting** section above
2. **Open an Issue** on GitHub with:
   - Chrome version
   - Extension version
   - Steps to reproduce
   - Console errors (F12)
3. **Read the Docs**: [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)

---

## 🌟 Star This Project

If you find this extension useful, please give it a star on GitHub!

---

**Made with ❤️ for stock market enthusiasts and AI-powered research**

*Disclaimer: This extension is not affiliated with Groww or OpenAI. Stock market investments involve risks. Please do your own research before making investment decisions.*
