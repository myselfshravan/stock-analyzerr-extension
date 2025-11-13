// Groww Stock Data Extractor
// This script runs in the context of a Groww stock page and extracts all relevant data

window.extractGrowwStockData = function() {
  console.log('Starting Groww stock data extraction...');

  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    extractedAt: new Date().toLocaleString(),

    // Basic Information
    stockName: extractText('h1.usph14Head', 'h1', '[class*="stock-name"]'),
    symbol: extractSymbolFromURL(),
    currentPrice: extractText('span.uht141Pri', '[class*="current-price"]', '[data-testid="price"]'),
    dayChange: extractText('div.uht141Day', '[class*="day-change"]'),

    // Key Metrics
    marketCap: extractKeyValue('Market Cap', 'Mkt cap'),
    peRatio: extractKeyValue('P/E Ratio', 'PE Ratio', 'P/E'),
    bookValue: extractKeyValue('Book Value', 'Book Val'),
    dividendYield: extractKeyValue('Dividend Yield', 'Div Yield'),
    roe: extractKeyValue('ROE', 'Return on Equity'),
    roce: extractKeyValue('ROCE', 'Return on Capital'),
    eps: extractKeyValue('EPS', 'Earnings Per Share'),
    faceValue: extractKeyValue('Face Value'),

    // Price Metrics
    week52High: extractKeyValue('52W High', '52 Week High'),
    week52Low: extractKeyValue('52W Low', '52 Week Low'),
    volume: extractKeyValue('Volume'),
    avgVolume: extractKeyValue('Avg Volume', 'Average Volume'),

    // Financial Metrics
    revenue: extractFinancialData('Revenue', 'Total Revenue'),
    profit: extractFinancialData('Net Profit', 'Profit'),
    sales: extractFinancialData('Sales'),
    debtToEquity: extractKeyValue('Debt to Equity', 'D/E Ratio'),
    currentRatio: extractKeyValue('Current Ratio'),
    promoterHolding: extractKeyValue('Promoter Holding', 'Promoters'),

    // Additional Information
    industry: extractKeyValue('Industry', 'Sector'),
    about: extractAbout(),
    pros: extractList('pros'),
    cons: extractList('cons'),

    // All tables data (fallback to capture everything)
    allTables: extractAllTables()
  };

  console.log('Extraction complete:', data);
  return data;
};

// Helper function to extract text from multiple possible selectors
function extractText(...selectors) {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element && element.innerText) {
        return element.innerText.trim();
      }
    } catch (e) {
      continue;
    }
  }
  return 'N/A';
}

// Extract key-value pairs from the page
function extractKeyValue(...labels) {
  // Strategy 1: Look in all text elements for label
  const allElements = Array.from(document.querySelectorAll('td, div, span, p'));

  for (const label of labels) {
    for (const element of allElements) {
      if (element.innerText && element.innerText.trim() === label) {
        // Found the label, look for value in next sibling or parent's next sibling
        let valueEl = element.nextElementSibling;

        if (!valueEl) {
          // Try parent's next sibling
          valueEl = element.parentElement?.nextElementSibling;
        }

        if (!valueEl) {
          // Try next cell in table
          const parent = element.closest('tr, div');
          if (parent) {
            valueEl = parent.querySelector('td:last-child, span:last-child');
          }
        }

        if (valueEl && valueEl.innerText) {
          return valueEl.innerText.trim();
        }
      }
    }
  }

  // Strategy 2: Look for label in text content (contains)
  for (const label of labels) {
    for (const element of allElements) {
      if (element.innerText && element.innerText.includes(label)) {
        const text = element.innerText;
        // Try to extract value after label
        const parts = text.split(label);
        if (parts.length > 1) {
          const value = parts[1].trim().split(/\s{2,}|\n/)[0];
          if (value) {
            return value;
          }
        }
      }
    }
  }

  return 'N/A';
}

// Extract financial data (might be in tables with multiple columns)
function extractFinancialData(...labels) {
  const tables = document.querySelectorAll('table');

  for (const label of labels) {
    for (const table of tables) {
      const rows = table.querySelectorAll('tr');

      for (const row of rows) {
        const cells = row.querySelectorAll('td, th');
        const firstCell = cells[0];

        if (firstCell && firstCell.innerText.includes(label)) {
          // Get all values from this row
          const values = Array.from(cells).slice(1).map(cell => cell.innerText.trim());
          if (values.length > 0) {
            return values.join(' | '); // Return all yearly data
          }
        }
      }
    }
  }

  return 'N/A';
}

// Extract company description/about
function extractAbout() {
  const selectors = [
    '.gsd23CompProfile',
    '[class*="about"]',
    '[class*="description"]',
    '[class*="company-profile"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText && element.innerText.length > 50) {
      return element.innerText.trim();
    }
  }

  // Fallback: Look for longest paragraph
  const paragraphs = Array.from(document.querySelectorAll('p'));
  const longParagraph = paragraphs.find(p => p.innerText.length > 100);

  if (longParagraph) {
    return longParagraph.innerText.trim();
  }

  return 'N/A';
}

// Extract pros/cons lists
function extractList(type) {
  const selectors = [
    `.${type}`,
    `[class*="${type}"]`,
    `[data-testid="${type}"]`
  ];

  for (const selector of selectors) {
    const container = document.querySelector(selector);
    if (container) {
      const items = container.querySelectorAll('li, p, div');
      const list = Array.from(items)
        .map(item => item.innerText.trim())
        .filter(text => text && text.length > 5);

      if (list.length > 0) {
        return list;
      }
    }
  }

  return [];
}

// Extract symbol from URL
function extractSymbolFromURL() {
  const pathParts = window.location.pathname.split('/');
  const symbol = pathParts[pathParts.length - 1];
  return symbol || 'N/A';
}

// Extract all tables as fallback to ensure we capture all data
function extractAllTables() {
  const tables = document.querySelectorAll('table');
  const tablesData = [];

  tables.forEach((table, index) => {
    const tableData = {
      tableIndex: index,
      rows: []
    };

    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      const rowData = cells.map(cell => cell.innerText.trim());
      if (rowData.some(cell => cell)) { // Only add non-empty rows
        tableData.rows.push(rowData);
      }
    });

    if (tableData.rows.length > 0) {
      tablesData.push(tableData);
    }
  });

  return tablesData;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractGrowwStockData: window.extractGrowwStockData };
}

console.log('Groww DOM Extractor loaded successfully');
