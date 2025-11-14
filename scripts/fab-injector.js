// Floating Action Button (FAB) for Groww Pages
// Provides quick access to AI analysis from any Groww stock page

console.log('Stock Analyzerr FAB: Initializing...');

// Check if FAB already exists
if (document.getElementById('groww-ai-fab')) {
  console.log('Stock Analyzerr FAB: Already exists, skipping');
} else {
  createFloatingActionButton();
}

function createFloatingActionButton() {
  // Create FAB container
  const fab = document.createElement('div');
  fab.id = 'groww-ai-fab';
  fab.innerHTML = `
    <div class="fab-button" id="fab-button" title="Analyze with AI">
      <span class="fab-icon">🤖</span>
    </div>
    <div class="fab-toast" id="fab-toast"></div>
  `;

  // Add styles
  const style = document.createElement('style');
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
  `;

  document.head.appendChild(style);
  document.body.appendChild(fab);

  // Add click handler
  const fabButton = document.getElementById('fab-button');
  fabButton.addEventListener('click', handleFABClick);

  console.log('Stock Analyzerr FAB: Created successfully');

  // Optional: Add subtle pulse animation on first load
  setTimeout(() => {
    fabButton.classList.add('pulse');
    setTimeout(() => {
      fabButton.classList.remove('pulse');
    }, 4000);
  }, 1000);
}

async function handleFABClick() {
  const fabButton = document.getElementById('fab-button');

  // Prevent multiple clicks
  if (fabButton.classList.contains('loading')) {
    return;
  }

  try {
    // Show loading state
    fabButton.classList.add('loading');
    showToast('Extracting stock data...', 'info');

    // Send message to background script to perform extraction
    // (Content scripts can't use chrome.tabs or chrome.scripting APIs)
    const response = await chrome.runtime.sendMessage({
      action: 'extractFromFAB'
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Extraction failed');
    }

    const result = response.result;

    // Check for validation errors
    if (result.error) {
      throw new Error(result.message);
    }

    const stockData = result.data;

    // Get user preferences from storage
    const { autoSubmit, tempChat } = await chrome.storage.local.get(['autoSubmit', 'tempChat']);

    // Store data in chrome.storage
    await chrome.storage.local.set({
      growwStockData: stockData,
      growwAnalysisRequest: true,
      autoSubmit: autoSubmit !== false, // Default true
      tempChat: tempChat === true, // Default false
      lastExtracted: Date.now()
    });

    showToast('✓ Opening ChatGPT...', 'success');

    // Build ChatGPT URL
    let chatGPTUrl = 'https://chatgpt.com/?groww_analysis=true';
    if (tempChat) {
      chatGPTUrl += '&temporary-chat=true';
    }

    // Open ChatGPT in a new tab
    window.open(chatGPTUrl, '_blank');

    // Success feedback
    setTimeout(() => {
      fabButton.classList.remove('loading');
      fabButton.classList.add('pulse');
      setTimeout(() => {
        fabButton.classList.remove('pulse');
      }, 1000);
    }, 500);

  } catch (error) {
    console.error('FAB click error:', error);
    showToast(`❌ ${error.message || 'Extraction failed'}`, 'error');
    fabButton.classList.remove('loading');

    // Remove loading state after error
    setTimeout(() => {
      fabButton.classList.remove('loading');
    }, 1000);
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('fab-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = 'fab-toast show ' + type;

  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

console.log('Stock Analyzerr FAB: Script loaded and ready');
