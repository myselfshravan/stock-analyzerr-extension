// Content script for ChatGPT auto-injection
// This script runs on ChatGPT pages and auto-fills the prompt when triggered

console.log('ChatGPT content script loaded');

// Check if this is a Groww analysis request
const urlParams = new URLSearchParams(window.location.search);
const isGrowwAnalysis = urlParams.get('groww_analysis') === 'true';

if (isGrowwAnalysis) {
  console.log('🤖 Groww analysis request detected! Initializing auto-paste...');
  initializeAutoAnalysis();
}

async function initializeAutoAnalysis() {
  try {
    // Get stored stock data
    const { growwStockData, growwAnalysisRequest } = await chrome.storage.local.get([
      'growwStockData',
      'growwAnalysisRequest'
    ]);

    if (!growwStockData) {
      console.error('❌ No stock data found in storage');
      return;
    }

    if (!growwAnalysisRequest) {
      console.log('No analysis request flag found, skipping auto-paste');
      return;
    }

    console.log('✓ Stock data retrieved:', growwStockData);

    // Wait for ChatGPT to be ready
    await waitForChatGPTReady();

    // Fill and submit the prompt
    await fillAndSubmitPrompt(growwStockData);

    // Clean up flags
    await chrome.storage.local.set({
      growwAnalysisRequest: false
    });

    // Clean up URL parameter
    cleanupURL();

  } catch (error) {
    console.error('❌ Auto-analysis error:', error);
  }
}

// Wait for ChatGPT textarea to be available
function waitForChatGPTReady() {
  return new Promise((resolve, reject) => {
    const timeout = 15000; // 15 seconds timeout
    const startTime = Date.now();

    // Possible selectors for ChatGPT textarea (they change frequently)
    const possibleSelectors = [
      '#prompt-textarea',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="Send a message"]',
      'textarea[data-id="root"]',
      'textarea',
      '[contenteditable="true"]'
    ];

    const observer = new MutationObserver((mutations, obs) => {
      // Try all possible selectors
      for (const selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          console.log('✓ ChatGPT input found:', selector);
          obs.disconnect();
          resolve(element);
          return;
        }
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        obs.disconnect();
        reject(new Error('Timeout waiting for ChatGPT input'));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check immediately in case element already exists
    for (const selector of possibleSelectors) {
      const existing = document.querySelector(selector);
      if (existing) {
        console.log('✓ ChatGPT input found immediately:', selector);
        observer.disconnect();
        resolve(existing);
        return;
      }
    }
  });
}

// Fill the prompt and submit
async function fillAndSubmitPrompt(stockData) {
  try {
    // Format the analysis prompt
    const prompt = formatAnalysisPrompt(stockData);

    console.log('📝 Filling prompt with', prompt.length, 'characters');

    // Find textarea again (in case DOM changed)
    const textarea = await findTextarea();

    if (!textarea) {
      console.error('❌ Could not find textarea');
      return;
    }

    // Method 1: Direct value assignment
    textarea.value = prompt;

    // Method 2: For contenteditable divs
    if (textarea.hasAttribute('contenteditable')) {
      textarea.textContent = prompt;
      textarea.innerHTML = prompt.replace(/\n/g, '<br>');
    }

    // Focus the textarea
    textarea.focus();

    // Dispatch multiple events to ensure React/Vue detect the change
    const events = [
      new Event('input', { bubbles: true, cancelable: true }),
      new Event('change', { bubbles: true, cancelable: true }),
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'a' }),
      new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'a' })
    ];

    events.forEach(event => textarea.dispatchEvent(event));

    console.log('✓ Prompt filled, waiting before submit...');

    // Wait for React to process the input
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find and click send button
    const submitted = await clickSendButton();

    if (submitted) {
      console.log('✅ Analysis request submitted successfully!');
    } else {
      console.log('⚠️ Could not auto-submit, but prompt is filled');
    }

  } catch (error) {
    console.error('❌ Error filling prompt:', error);
  }
}

// Find textarea with multiple strategies
async function findTextarea() {
  const selectors = [
    '#prompt-textarea',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Send a message"]',
    'textarea[data-id="root"]',
    'textarea',
    '[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }

  return null;
}

// Click the send button
async function clickSendButton() {
  // Wait a bit to ensure button is enabled
  await new Promise(resolve => setTimeout(resolve, 500));

  // Possible selectors for send button
  const buttonSelectors = [
    'button[data-testid="send-button"]',
    'button[aria-label*="Send"]',
    'button:has(svg path[d*="M.5"])', // Send icon path
    'button[type="submit"]',
    'button svg',
    'form button[type="button"]'
  ];

  for (const selector of buttonSelectors) {
    try {
      const buttons = document.querySelectorAll(selector);

      for (const button of buttons) {
        // Check if button is enabled and visible
        if (!button.disabled &&
            button.offsetParent !== null &&
            !button.hasAttribute('aria-disabled')) {

          console.log('🔘 Clicking send button:', selector);
          button.click();

          return true;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Fallback: Try pressing Enter
  const textarea = await findTextarea();
  if (textarea) {
    console.log('⌨️ Trying Enter key as fallback...');

    const enterEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
      code: 'Enter',
      keyCode: 13
    });

    textarea.dispatchEvent(enterEvent);
    return true;
  }

  return false;
}

// Format the analysis prompt with stock data
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

  // Format the JSON nicely
  const jsonData = JSON.stringify(stockData, null, 2);

  return `${preprompt}\n\n\`\`\`json\n${jsonData}\n\`\`\``;
}

// Clean up URL parameter after successful injection
function cleanupURL() {
  try {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    console.log('✓ URL cleaned up');
  } catch (error) {
    console.log('Could not clean URL:', error);
  }
}

// Listen for messages (in case we need to trigger manually)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillPrompt') {
    fillAndSubmitPrompt(message.data);
    sendResponse({ success: true });
    return true;
  }
});

console.log('ChatGPT content script initialized');
