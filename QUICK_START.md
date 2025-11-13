# ⚡ Quick Start Guide

## 🚀 Install in 3 Steps

### 1️⃣ Open Chrome Extensions
```
chrome://extensions/
```
Toggle **Developer mode** ON

### 2️⃣ Load Extension
Click **"Load unpacked"** → Select `groww-extension` folder

### 3️⃣ Test It
Visit: https://groww.in/stocks/hindustan-aeronautics-ltd
Click extension icon → "Analyze with ChatGPT"

## 📖 Documentation

| File | Purpose |
|------|---------|
| [README.md](README.md) | Complete documentation |
| [INSTALLATION.md](INSTALLATION.md) | Detailed setup & testing |
| [claude.md](claude.md) | Technical implementation |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Project overview |

## 🎯 Main Features

✅ Extract stock data from Groww
✅ Copy JSON to clipboard
✅ Auto-analyze in ChatGPT
✅ No manual intervention needed

## 🔧 File Structure

```
groww-extension/
├── manifest.json          # Extension config
├── background.js          # Service worker
├── popup/                 # UI files
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── scripts/               # Core logic
│   ├── dom-extractor.js
│   ├── content-groww.js
│   └── content-chatgpt.js
└── icons/                 # Extension icons
```

## 🧪 Quick Test

1. Load extension in Chrome
2. Visit a Groww stock page
3. Click extension icon
4. Click "Analyze with ChatGPT"
5. Watch auto-analysis happen!

## 🐛 Troubleshooting

**Extension won't load?**
- Check all files exist
- Verify manifest.json is valid
- Enable Developer mode

**Can't extract data?**
- Must be on `groww.in/stocks/*` page
- Check browser console (F12)

**ChatGPT won't auto-submit?**
- Data should still paste
- Just click Send manually
- ChatGPT UI changes frequently

## 📞 Need Help?

Read [INSTALLATION.md](INSTALLATION.md) for detailed troubleshooting.

---

**Ready to analyze stocks with AI? Let's go! 🚀**
