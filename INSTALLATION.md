# 🚀 Quick Installation & Testing Guide

## ⚡ Quick Start (5 Minutes)

### Step 1: Open Chrome Extensions Page
1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Toggle **Developer mode** ON (top-right corner)

### Step 2: Load the Extension
1. Click **"Load unpacked"** button
2. Navigate to and select the `groww-extension` folder
3. The extension should appear with a purple icon

### Step 3: Pin the Extension (Recommended)
1. Click the puzzle piece icon 🧩 in Chrome toolbar
2. Find "Groww to ChatGPT Stock Analyzer"
3. Click the pin 📌 icon to keep it visible

### Step 4: Test It Out!
1. Visit a Groww stock page: [https://groww.in/stocks/hindustan-aeronautics-ltd](https://groww.in/stocks/hindustan-aeronautics-ltd)
2. Click the extension icon
3. Click "🤖 Analyze with ChatGPT"
4. Watch the magic happen! ✨

---

## 🧪 Testing Checklist

### Test 1: Basic Functionality
- [ ] Extension loads without errors in `chrome://extensions/`
- [ ] Extension icon appears in toolbar
- [ ] Clicking icon opens popup

### Test 2: Groww Page Detection
- [ ] Visit [https://groww.in/stocks/hindustan-aeronautics-ltd](https://groww.in/stocks/hindustan-aeronautics-ltd)
- [ ] Click extension icon
- [ ] Popup shows stock name (not error message)
- [ ] Stock price and change are displayed

### Test 3: Data Extraction
- [ ] Click "📋 Extract & Copy Data" button
- [ ] Status message shows "✓ Data extracted and copied to clipboard!"
- [ ] Paste (Ctrl/Cmd+V) into a text editor - should see JSON data
- [ ] JSON includes stock name, price, metrics, etc.

### Test 4: ChatGPT Integration
- [ ] Click "🤖 Analyze with ChatGPT" button
- [ ] New ChatGPT tab opens
- [ ] Data is pasted into ChatGPT textarea
- [ ] Message is auto-submitted (or ready to submit)
- [ ] ChatGPT responds with stock analysis

### Test 5: Error Handling
- [ ] Visit [https://groww.in/](https://groww.in/) (homepage, not stock page)
- [ ] Click extension icon
- [ ] Should show error: "Not a supported Groww stock page."

### Test 6: Multiple Stocks
Try these different stocks to ensure versatility:
- [ ] [Large Cap Stock](https://groww.in/stocks/reliance-industries-ltd)
- [ ] [Mid Cap Stock](https://groww.in/stocks/billionbrains-garage-ventures-ltd)
- [ ] [New Listing](https://groww.in/stocks/ather-energy-ltd)

---

## 🐛 Common Issues & Solutions

### Issue 1: Extension Not Loading
**Symptom**: Error messages in `chrome://extensions/`

**Solutions**:
```bash
# Check that all files exist
ls -la

# Should see these folders:
# - popup/
# - scripts/
# - icons/

# And these files:
# - manifest.json
# - background.js
# - README.md
```

If files are missing, re-download or re-clone the repository.

### Issue 2: "Failed to load extension" Error
**Symptom**: Manifest errors

**Solution**:
1. Open `manifest.json` and verify it's valid JSON
2. Check that all file paths in manifest exist
3. Ensure icons exist: `ls icons/*.png`

### Issue 3: Popup Shows Blank or Error
**Symptom**: Popup opens but shows nothing or errors

**Solution**:
1. Right-click extension icon → "Inspect"
2. Check Console for JavaScript errors
3. Verify all popup files exist:
   ```bash
   ls popup/
   # Should show: popup.html, popup.css, popup.js
   ```

### Issue 4: Cannot Extract Data
**Symptom**: "Extract & Copy" button doesn't work

**Solution**:
1. Open browser console (F12) on Groww page
2. Click extract button
3. Check for errors
4. Verify you're on a stock detail page (not search/list page)

### Issue 5: ChatGPT Doesn't Auto-Submit
**Symptom**: Data pastes but doesn't submit

**This is OK!** ChatGPT's UI changes frequently. If the data is pasted, just click Send manually.

To debug:
1. Open ChatGPT page
2. Press F12 to open DevTools
3. Check Console for messages from content script
4. Look for: "🤖 Groww analysis detected!"

---

## 🔍 Debugging Tips

### View Extension Logs

**Background Script Logs**:
1. Go to `chrome://extensions/`
2. Find "Groww to ChatGPT Stock Analyzer"
3. Click "Inspect views: service worker"
4. Check Console tab

**Popup Logs**:
1. Right-click extension icon
2. Select "Inspect"
3. Console tab shows popup.js logs

**Content Script Logs** (Groww):
1. Visit a Groww stock page
2. Press F12
3. Console shows logs from content-groww.js
4. Look for: "Groww content script loaded"

**Content Script Logs** (ChatGPT):
1. Open ChatGPT after clicking Analyze
2. Press F12
3. Console shows logs from content-chatgpt.js
4. Look for: "🤖 Groww analysis detected!"

### Check Storage

To see what data is stored:
1. Open Chrome DevTools (F12) on any page
2. Go to Application tab → Storage → Chrome Extension → Local Storage
3. Select your extension ID
4. Should see `growwStockData` and related keys

Or use code in console:
```javascript
chrome.storage.local.get(null, (data) => console.log(data));
```

---

## 📊 Expected Output

### Extracted JSON Structure
```json
{
  "timestamp": "2024-11-13T...",
  "url": "https://groww.in/stocks/...",
  "stockName": "Hindustan Aeronautics Ltd",
  "symbol": "hindustan-aeronautics-ltd",
  "currentPrice": "₹4,255.50",
  "dayChange": "+2.5% (+102.25)",
  "marketCap": "₹2.85 Lakh Cr",
  "peRatio": "32.5",
  "bookValue": "₹245.30",
  "dividendYield": "0.85%",
  "roe": "42.5%",
  "roce": "38.2%",
  "eps": "₹130.50",
  "revenue": "₹24,500 Cr",
  "profit": "₹6,200 Cr",
  "debtToEquity": "0.15",
  "week52High": "₹5,675.00",
  "week52Low": "₹2,890.00",
  "about": "Hindustan Aeronautics Limited is...",
  "pros": ["Market leader in...", "Strong order book..."],
  "cons": ["High valuation...", "Government dependency..."],
  "allTables": [...]
}
```

### ChatGPT Analysis Prompt
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

```json
{... stock data ...}
```
```

---

## ✅ Success Criteria

Your extension is working correctly when:

1. ✅ Popup opens on Groww stock pages
2. ✅ Stock name is displayed in popup
3. ✅ "Extract & Copy" copies JSON to clipboard
4. ✅ "Analyze with ChatGPT" opens new tab
5. ✅ Data is auto-pasted into ChatGPT
6. ✅ ChatGPT provides analysis (auto-submit or manual)
7. ✅ No console errors in any component
8. ✅ Works across different stock pages

---

## 🔄 Reload After Changes

If you modify the code:

**Auto-Reload** (no action needed):
- Popup HTML/CSS/JS changes

**Manual Reload Required**:
1. Go to `chrome://extensions/`
2. Find your extension
3. Click the reload icon 🔄

**Full Reload Required** (for manifest changes):
1. Remove the extension
2. Load unpacked again

---

## 📞 Need Help?

If you're still having issues:

1. **Check the README.md** for detailed documentation
2. **Review claude.md** for implementation details
3. **Check browser console** for error messages
4. **Verify all files exist** using the file list below

### Complete File List
```
groww-extension/
├── manifest.json
├── background.js
├── README.md
├── INSTALLATION.md (this file)
├── claude.md
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── scripts/
│   ├── dom-extractor.js
│   ├── content-groww.js
│   └── content-chatgpt.js
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## 🎉 You're All Set!

If all tests pass, you're ready to analyze stocks with AI!

**Enjoy using the extension!** 🚀📊🤖
