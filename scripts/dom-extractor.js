// Groww Stock Data Extractor - Robust Version
// Uses semantic HTML, text matching, and structure instead of auto-generated CSS classes

// === FINANCIAL CHARTS EXTRACTION (INTERACTIVE TABS) ===
// Extracts Revenue, Profit, and Net Worth charts by clicking tabs
async function extractFinancialCharts() {
  console.log("📊 Starting financial charts extraction...");

  try {
    const financialData = {};

    // Find all financial tabs (Revenue, Profit, Net Worth)
    const tabs = Array.from(document.querySelectorAll(".stkF56TabDiv"));

    if (tabs.length === 0) {
      console.log("⚠️ No financial tabs found");
      return null;
    }

    console.log(`Found ${tabs.length} financial tabs`);

    // Get the currency/unit note
    const unitElement = document.querySelector(".stkF56InfoDiv");
    const unit = unitElement
      ? unitElement.textContent.trim().replace("*", "")
      : "All values are in Rs. Cr";

    // Get the active mode (Quarterly vs Yearly)
    const activeMode = document.querySelector(".stkF56ToggleActive");
    const mode = activeMode ? activeMode.textContent.trim() : "Quarterly";

    // Extract data from each tab
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabName = tab.textContent.trim(); // "Revenue", "Profit", "Net Worth"

      console.log(`Extracting ${tabName} data...`);

      // Click tab if not already active
      if (!tab.classList.contains("contentAccent")) {
        tab.click();
        // Wait for chart to render (500ms should be enough)
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Extract values from SVG chart
      const valueElements = Array.from(
        document.querySelectorAll(
          "svg text.contentPrimary.bodySmall tspan[style*='fill']"
        )
      );
      const values = valueElements
        .map((el) => el.textContent.trim())
        .filter((text) => /^[\d,]+$/.test(text)); // Only numeric values like "6,521"

      // Extract date labels from x-axis
      const dateElements = Array.from(
        document.querySelectorAll(".visx-axis-bottom tspan")
      );
      const dates = dateElements.map((el) => el.textContent.trim());

      // Create data points array combining dates and values
      const dataPoints = values.map((val, idx) => ({
        date: dates[idx] || "",
        value: val,
      }));

      // Store data for this tab
      financialData[tabName] = {
        values: values,
        dates: dates,
        dataPoints: dataPoints,
      };

      console.log(
        `✓ Extracted ${values.length} data points for ${tabName}:`,
        dataPoints
      );
    }

    // Add metadata
    financialData._metadata = {
      unit: unit,
      mode: mode,
      extractedAt: new Date().toISOString(),
    };

    console.log("✅ Financial charts extraction complete:", financialData);
    return financialData;
  } catch (error) {
    console.error("❌ Financial charts extraction error:", error);
    return null;
  }
}

window.extractGrowwStockData = async function (options = {}) {
  console.log("🔍 Starting robust Groww stock data extraction...");

  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    extractedAt: new Date().toLocaleString(),

    // Basic Information (using robust extraction)
    stockName: extractStockName(),
    symbol: extractSymbolFromURL(),
    currentPrice: extractCurrentPrice(),
    dayChange: extractDayChange(),

    // Stock Performance Metrics (Open, Close, Volume, Circuits)
    open: extractKeyValue("Open"),
    previousClose: extractKeyValue(
      "Prev. Close",
      "Prev Close",
      "Previous Close"
    ),
    volume: extractKeyValue("Volume"),
    totalTradedValue: extractKeyValue(
      "Total traded value",
      "Total Traded Value",
      "Traded Value"
    ),
    upperCircuit: extractKeyValue("Upper Circuit"),
    lowerCircuit: extractKeyValue("Lower Circuit"),

    // Key Metrics (using text-based key-value extraction)
    marketCap: extractKeyValue(
      "Market Cap",
      "Mkt cap",
      "Market Capitalisation"
    ),
    peRatio: extractKeyValue(
      "P/E Ratio",
      "PE Ratio",
      "P/E",
      "Price to Earnings"
    ),
    bookValue: extractKeyValue("Book Value", "Book Val"),
    dividendYield: extractKeyValue("Dividend Yield", "Div Yield"),
    roe: extractKeyValue("ROE", "Return on Equity"),
    roce: extractKeyValue("ROCE", "Return on Capital"),
    eps: extractKeyValue("EPS", "Earnings Per Share"),
    faceValue: extractKeyValue("Face Value"),

    // Price Metrics
    week52High: extractKeyValue("52W High", "52 Week High", "52WH"),
    week52Low: extractKeyValue("52W Low", "52 Week Low", "52WL"),
    avgVolume: extractKeyValue("Avg Volume", "Average Volume"),

    // Financial Metrics
    revenue: extractFinancialData("Revenue", "Total Revenue"),
    profit: extractFinancialData("Net Profit", "Profit"),
    sales: extractFinancialData("Sales"),
    debtToEquity: extractKeyValue("Debt to Equity", "D/E Ratio", "Debt/Equity"),
    currentRatio: extractKeyValue("Current Ratio"),
    promoterHolding: extractKeyValue(
      "Promoter Holding",
      "Promoters",
      "Promoter %"
    ),

    // Additional Information
    industry: extractKeyValue("Industry", "Sector"),
    about: extractAbout(),
    pros: extractList("pros"),
    cons: extractList("cons"),

    // All tables data (fallback to capture everything)
    allTables: extractAllTables(),
  };

  // EXTRACT FINANCIAL CHARTS (if enabled)
  if (options.extractFinancials) {
    console.log("📊 Financial charts extraction enabled");
    const financialCharts = await extractFinancialCharts();
    if (financialCharts) {
      data.financialCharts = financialCharts;
    }
  }

  // VALIDATE MANDATORY FIELDS
  const mandatoryFields = {
    stockName: data.stockName,
    currentPrice: data.currentPrice,
  };

  const missingFields = [];
  for (const [field, value] of Object.entries(mandatoryFields)) {
    if (!value || value === "N/A" || value.trim() === "") {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    console.error("❌ Mandatory fields missing:", missingFields);
    return {
      error: true,
      message: `Could not extract: ${missingFields.join(
        ", "
      )}. Please check if you're on a Groww stock page.`,
      missingFields: missingFields,
      partialData: data,
    };
  }

  console.log("✅ Extraction complete with all mandatory fields:", data);
  return { error: false, data };
};

// === ROBUST EXTRACTION FUNCTIONS (NO CSS CLASSES) ===

// Extract stock name from h1 tag (semantic HTML)
function extractStockName() {
  // Strategy 1: First h1 on page
  const h1 = document.querySelector("h1");
  if (h1 && h1.innerText && h1.innerText.length > 2) {
    return h1.innerText.trim();
  }

  // Strategy 2: Element with title attribute
  const titleEl = document.querySelector("[title]");
  if (titleEl) {
    const title = titleEl.getAttribute("title");
    if (title && title.length > 3) {
      return title.trim();
    }
  }

  // Strategy 3: Look for company name pattern in meta tags
  const metaTitle = document.querySelector('meta[property="og:title"]');
  if (metaTitle) {
    const content = metaTitle.getAttribute("content");
    if (content) {
      // Remove common suffixes
      return content.replace(/ - Groww| Share Price| Stock Price/gi, "").trim();
    }
  }

  return "N/A";
}

// Extract current price using multiple strategies
function extractCurrentPrice() {
  console.log("🔍 Extracting current price...");

  // Strategy 1: Find by rupee symbol pattern in first 3000 characters
  const topText = document.body.innerText.substring(0, 3000);
  const pricePattern = /₹\s*([0-9,]+\.?[0-9]*)/g;
  const matches = [...topText.matchAll(pricePattern)];

  if (matches.length > 0) {
    // First match is usually the current price
    const price = matches[0][1];
    console.log("✓ Found price via pattern:", price);
    return "₹" + price;
  }

  // Strategy 2: Find largest font size with rupee symbol
  const allDivs = Array.from(document.querySelectorAll("div"));
  for (const div of allDivs.slice(0, 100)) {
    // Check first 100 divs
    const text = div.innerText?.trim();
    if (text && text.startsWith("₹") && /^₹\s*[0-9,]+\.?[0-9]*$/.test(text)) {
      console.log("✓ Found price via div scan:", text);
      return text;
    }
  }

  // Strategy 3: Look for price in data attributes
  const priceEl = document.querySelector("[data-price], [data-current-price]");
  if (priceEl) {
    const price =
      priceEl.getAttribute("data-price") ||
      priceEl.getAttribute("data-current-price");
    if (price) {
      console.log("✓ Found price via data attribute:", price);
      return price;
    }
  }

  console.warn("⚠️ Could not extract current price");
  return "N/A";
}

// Extract day change
function extractDayChange() {
  // Look for patterns like "+6.36 (4.84%)" or "-2.5 (1.2%)"
  const pageText = document.body.innerText;
  const changePattern = /([+\-]?\s*[0-9]+\.?[0-9]*\s*\([0-9]+\.?[0-9]*%\))/g;
  const matches = pageText.match(changePattern);

  if (matches && matches.length > 0) {
    // First match is usually the day change
    return matches[0].trim();
  }

  // Fallback: Look for green/red text with percentage
  const allSpans = Array.from(document.querySelectorAll("span, div"));
  for (const span of allSpans.slice(0, 50)) {
    const text = span.innerText?.trim();
    if (
      text &&
      text.includes("%") &&
      text.includes("(") &&
      text.includes(")")
    ) {
      return text;
    }
  }

  return "N/A";
}

// Extract key-value pairs by searching for label text
function extractKeyValue(...labels) {
  // Get all text-containing elements
  const allElements = Array.from(
    document.querySelectorAll("td, div, span, p, th, label")
  );

  for (const label of labels) {
    for (const element of allElements) {
      const elementText = element.innerText?.trim();

      // Check for exact match or contains
      if (
        elementText === label ||
        elementText?.toLowerCase() === label.toLowerCase()
      ) {
        // Strategy 1: Next sibling
        let valueEl = element.nextElementSibling;
        if (valueEl && valueEl.innerText && valueEl.innerText.trim()) {
          return valueEl.innerText.trim();
        }

        // Strategy 2: Parent's next sibling
        valueEl = element.parentElement?.nextElementSibling;
        if (valueEl && valueEl.innerText && valueEl.innerText.trim()) {
          return valueEl.innerText.trim();
        }

        // Strategy 3: Next cell in table row
        const row = element.closest("tr");
        if (row) {
          const cells = Array.from(row.querySelectorAll("td, th"));
          const labelIndex = cells.indexOf(element);
          if (labelIndex >= 0 && cells[labelIndex + 1]) {
            return cells[labelIndex + 1].innerText.trim();
          }
          // Or just get last cell
          if (cells.length >= 2) {
            return cells[cells.length - 1].innerText.trim();
          }
        }

        // Strategy 4: Value in same div (colon-separated)
        if (elementText.includes(":")) {
          const parts = elementText.split(":");
          if (
            parts.length >= 2 &&
            parts[0].trim().toLowerCase() === label.toLowerCase()
          ) {
            return parts.slice(1).join(":").trim();
          }
        }
      }
    }
  }

  // Strategy 5: Text pattern search
  const pageText = document.body.innerText;
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:\\-]?\\s*([^\n]+)`, "i");
    const match = pageText.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim().split(/\s{2,}/)[0]; // Take first word/phrase
      if (value && value.length < 100) {
        // Reasonable length
        return value;
      }
    }
  }

  return "N/A";
}

// Extract financial data from tables
function extractFinancialData(...labels) {
  const tables = document.querySelectorAll("table");

  for (const label of labels) {
    for (const table of tables) {
      const rows = table.querySelectorAll("tr");

      for (const row of rows) {
        const cells = row.querySelectorAll("td, th");
        const firstCell = cells[0];

        if (
          firstCell &&
          firstCell.innerText.toLowerCase().includes(label.toLowerCase())
        ) {
          // Get all values from this row (multiple years of data)
          const values = Array.from(cells)
            .slice(1)
            .map((cell) => cell.innerText.trim())
            .filter((v) => v);
          if (values.length > 0) {
            return values.join(" | "); // Return all yearly data
          }
        }
      }
    }
  }

  return "N/A";
}

// Extract company description/about
function extractAbout() {
  // Strategy 1: Find "About" heading and extract from nested structure
  const aboutHeading = Array.from(
    document.querySelectorAll("h1, h2, h3, h4")
  ).find((h) => h.innerText && h.innerText.toLowerCase().includes("about"));

  if (aboutHeading) {
    // Get parent section if exists
    const section = aboutHeading.closest("section");
    if (section) {
      // Look for text in .rah-static span (full text container)
      const fullTextSpan = section.querySelector(
        '.rah-static span, [class*="rah-static"] span'
      );
      if (
        fullTextSpan &&
        fullTextSpan.innerText &&
        fullTextSpan.innerText.length > 100
      ) {
        // Remove "Read more" button text if present
        let text = fullTextSpan.innerText.trim();
        text = text.replace(/\.\.\.Read more$/i, "").trim();
        return text;
      }

      // Fallback: Find any span/p with substantial text in this section
      const textElements = Array.from(section.querySelectorAll("span, p, div"))
        .filter((el) => {
          const text = el.innerText?.trim();
          // Must have text > 100 chars and not contain child elements with lots of text (avoid containers)
          return text && text.length > 100 && !el.querySelector("table");
        })
        .sort((a, b) => b.innerText.length - a.innerText.length);

      if (textElements.length > 0) {
        let text = textElements[0].innerText.trim();
        text = text.replace(/\.\.\.Read more$/i, "").trim();
        return text;
      }
    }
  }

  // Strategy 2: Look for aboutCompany_summary or similar class patterns
  const aboutSection = document.querySelector(
    '[class*="aboutCompany"], [class*="about-company"], [class*="company-summary"]'
  );
  if (aboutSection) {
    // Try .rah-static span first (full text)
    const fullText = aboutSection.querySelector(
      '.rah-static span, [class*="rah-static"] span'
    );
    if (fullText && fullText.innerText && fullText.innerText.length > 100) {
      let text = fullText.innerText.trim();
      text = text.replace(/\.\.\.Read more$/i, "").trim();
      return text;
    }

    // Fallback: longest span in this section
    const spans = Array.from(aboutSection.querySelectorAll("span")).filter(
      (s) => s.innerText && s.innerText.length > 100
    );
    if (spans.length > 0) {
      spans.sort((a, b) => b.innerText.length - a.innerText.length);
      let text = spans[0].innerText.trim();
      text = text.replace(/\.\.\.Read more$/i, "").trim();
      return text;
    }
  }

  // Strategy 3: Look for longest span or paragraph (expanded beyond just <p>)
  const textElements = Array.from(document.querySelectorAll("span, p, div"))
    .filter((el) => {
      const text = el.innerText?.trim();
      // Filter: meaningful length, not a container with tables/lists
      return text && text.length > 150 && !el.querySelector("table, ul, ol");
    })
    .sort((a, b) => b.innerText.length - a.innerText.length);

  if (textElements.length > 0) {
    let text = textElements[0].innerText.trim();
    text = text.replace(/\.\.\.Read more$/i, "").trim();
    return text;
  }

  return "N/A";
}

// Extract pros/cons lists
function extractList(type) {
  // Look for headings with pros/cons
  const allElements = Array.from(document.querySelectorAll("*"));

  for (const el of allElements) {
    const text = el.innerText?.toLowerCase();
    if (text && text.includes(type)) {
      // Look for list items nearby
      const parent = el.closest("div, section");
      if (parent) {
        const listItems = parent.querySelectorAll("li, p");
        if (listItems.length > 0) {
          return Array.from(listItems)
            .map((item) => item.innerText.trim())
            .filter((text) => text && text.length > 5);
        }
      }
    }
  }

  return [];
}

// Extract symbol from URL
function extractSymbolFromURL() {
  const pathParts = window.location.pathname.split("/");
  const symbol = pathParts[pathParts.length - 1];
  return symbol || "N/A";
}

// Extract all tables as fallback
function extractAllTables() {
  const tables = document.querySelectorAll("table");
  const tablesData = [];

  tables.forEach((table, index) => {
    const tableData = {
      tableIndex: index,
      rows: [],
    };

    const rows = table.querySelectorAll("tr");
    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll("td, th"));
      const rowData = cells.map((cell) => cell.innerText.trim());
      if (rowData.some((cell) => cell)) {
        // Only add non-empty rows
        tableData.rows.push(rowData);
      }
    });

    if (tableData.rows.length > 0) {
      tablesData.push(tableData);
    }
  });
  // remove the last table if the first row first column contains "COMPANY"
  if (tablesData.length > 0) {
    const lastTable = tablesData[tablesData.length - 1];
    if (
      lastTable.rows.length > 0 &&
      lastTable.rows[0][0]?.toLowerCase().includes("company")
    ) {
      tablesData.pop();
    }
  }

  return tablesData;
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = { extractGrowwStockData: window.extractGrowwStockData };
}

console.log("✅ Robust Groww DOM Extractor loaded successfully");
