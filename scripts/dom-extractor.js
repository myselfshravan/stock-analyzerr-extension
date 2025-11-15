async function extractFinancialCharts() {
  console.log("📊 Starting financial charts extraction...");

  try {
    const financialData = {};

    const tabs = Array.from(
      document.querySelectorAll(
        'div[role="tab"], button[role="tab"], [class*="Tab"]:not([class*="Table"])'
      )
    ).filter((tab) => {
      const text = tab.textContent?.trim().toLowerCase();
      return text === "revenue" || text === "profit" || text === "net worth";
    });

    if (tabs.length === 0) {
      console.log("⚠️ No financial tabs found");
      return null;
    }

    console.log(`Found ${tabs.length} financial tabs`);

    const financialsSection = document.querySelector("section h2");
    let unit = "All values are in Rs. Cr";

    if (
      financialsSection &&
      financialsSection.textContent?.toLowerCase().includes("financials")
    ) {
      const section = financialsSection.closest("section");
      if (section) {
        const unitElement = Array.from(
          section.querySelectorAll("div, span, p")
        ).find((el) => el.textContent?.match(/\*?all values are in/i));
        if (unitElement) {
          unit = unitElement.textContent.trim().replace(/^\*/, "");
        }
      }
    }

    const toggleButtons = Array.from(
      document.querySelectorAll("div, button")
    ).filter((el) => {
      const text = el.textContent?.trim().toLowerCase();
      return text === "quarterly" || text === "yearly";
    });
    const activeMode = toggleButtons.find(
      (btn) => !btn.className.toLowerCase().includes("disabled")
    );
    const mode = activeMode ? activeMode.textContent.trim() : "Quarterly";

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabName = tab.textContent.trim();

      console.log(`Extracting ${tabName} data...`);

      const isActive =
        tab.getAttribute("aria-selected") === "true" ||
        tab.getAttribute("aria-current") === "true" ||
        !tab.className.toLowerCase().includes("false");

      if (!isActive) {
        tab.click();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const valueElements = Array.from(
        document.querySelectorAll("svg text tspan[style*='fill']")
      );
      const values = valueElements
        .map((el) => el.textContent.trim())
        .filter((text) => /^-?[\d,]+$/.test(text));

      const dateElements = Array.from(
        document.querySelectorAll('svg text[text-anchor="middle"] tspan')
      ).filter((el) => {
        const text = el.textContent.trim();
        return text.match(/^(20\d{2}|FY\s?\d{2}|\w{3}\s['\']?\d{2})$/);
      });
      const dates = dateElements.map((el) => el.textContent.trim());

      const dataPoints = values.map((val, idx) => ({
        date: dates[idx] || "",
        value: val,
      }));

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

    stockName: extractStockName(),
    symbol: extractSymbolFromURL(),
    currentPrice: extractCurrentPrice(),
    dayChange: extractDayChange(),

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

    week52High: extractKeyValue("52W High", "52 Week High", "52WH"),
    week52Low: extractKeyValue("52W Low", "52 Week Low", "52WL"),
    avgVolume: extractKeyValue("Avg Volume", "Average Volume"),

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

    industry: extractKeyValue("Industry", "Sector"),
    about: extractAbout(),
    pros: extractList("pros"),
    cons: extractList("cons"),

    allTables: extractAllTables(),
    shareholdingPattern: extractShareholdingPattern(),
  };

  if (options.extractFinancials) {
    console.log("📊 Financial charts extraction enabled");
    const financialCharts = await extractFinancialCharts();
    if (financialCharts) {
      data.financialCharts = financialCharts;
    }
  }

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

function extractStockName() {
  const h1 = document.querySelector("h1");
  if (h1 && h1.innerText && h1.innerText.length > 2) {
    return h1.innerText.trim();
  }

  const titleEl = document.querySelector("[title]");
  if (titleEl) {
    const title = titleEl.getAttribute("title");
    if (title && title.length > 3) {
      return title.trim();
    }
  }

  const metaTitle = document.querySelector('meta[property="og:title"]');
  if (metaTitle) {
    const content = metaTitle.getAttribute("content");
    if (content) {
      return content.replace(/ - Groww| Share Price| Stock Price/gi, "").trim();
    }
  }

  return "N/A";
}

function extractCurrentPrice() {
  console.log("🔍 Extracting current price...");

  const topText = document.body.innerText.substring(0, 3000);
  const pricePattern = /₹\s*([0-9,]+\.?[0-9]*)/g;
  const matches = [...topText.matchAll(pricePattern)];

  if (matches.length > 0) {
    const price = matches[0][1];
    console.log("✓ Found price via pattern:", price);
    return "₹" + price;
  }

  const allDivs = Array.from(document.querySelectorAll("div"));
  for (const div of allDivs.slice(0, 100)) {
    const text = div.innerText?.trim();
    if (text && text.startsWith("₹") && /^₹\s*[0-9,]+\.?[0-9]*$/.test(text)) {
      console.log("✓ Found price via div scan:", text);
      return text;
    }
  }

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

function extractDayChange() {
  const pageText = document.body.innerText;
  const changePattern = /([+\-]?\s*[0-9]+\.?[0-9]*\s*\([0-9]+\.?[0-9]*%\))/g;
  const matches = pageText.match(changePattern);

  if (matches && matches.length > 0) {
    return matches[0].trim();
  }

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

function extractKeyValue(...labels) {
  const allElements = Array.from(
    document.querySelectorAll("td, div, span, p, th, label")
  );

  for (const label of labels) {
    for (const element of allElements) {
      const elementText = element.innerText?.trim();

      if (
        elementText === label ||
        elementText?.toLowerCase() === label.toLowerCase()
      ) {
        let valueEl = element.nextElementSibling;
        if (valueEl && valueEl.innerText && valueEl.innerText.trim()) {
          return valueEl.innerText.trim();
        }

        valueEl = element.parentElement?.nextElementSibling;
        if (valueEl && valueEl.innerText && valueEl.innerText.trim()) {
          return valueEl.innerText.trim();
        }

        const row = element.closest("tr");
        if (row) {
          const cells = Array.from(row.querySelectorAll("td, th"));
          const labelIndex = cells.indexOf(element);
          if (labelIndex >= 0 && cells[labelIndex + 1]) {
            return cells[labelIndex + 1].innerText.trim();
          }
          if (cells.length >= 2) {
            return cells[cells.length - 1].innerText.trim();
          }
        }

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

  const pageText = document.body.innerText;
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:\\-]?\\s*([^\n]+)`, "i");
    const match = pageText.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim().split(/\s{2,}/)[0];
      if (value && value.length < 100) {
        return value;
      }
    }
  }

  return "N/A";
}

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
          const values = Array.from(cells)
            .slice(1)
            .map((cell) => cell.innerText.trim())
            .filter((v) => v);
          if (values.length > 0) {
            return values.join(" | ");
          }
        }
      }
    }
  }

  return "N/A";
}

function extractAbout() {
  const aboutHeading = Array.from(
    document.querySelectorAll("h1, h2, h3, h4")
  ).find((h) => h.innerText && h.innerText.toLowerCase().includes("about"));

  if (aboutHeading) {
    const section = aboutHeading.closest("section, div");
    if (section) {
      const fullTextSpan = section.querySelector(
        '[class*="static"] span, [class*="expanded"] span'
      );
      if (
        fullTextSpan &&
        fullTextSpan.innerText &&
        fullTextSpan.innerText.length > 100
      ) {
        let text = fullTextSpan.innerText.trim();
        text = text.replace(/\.\.\.Read more$/i, "").trim();
        return text;
      }

      const textElements = Array.from(section.querySelectorAll("span, p, div"))
        .filter((el) => {
          const text = el.innerText?.trim();
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

  const aboutSection = document.querySelector(
    '[class*="about"], [class*="company"], section'
  );
  if (aboutSection) {
    const fullText = aboutSection.querySelector(
      '[class*="static"] span, [class*="expanded"] span'
    );
    if (fullText && fullText.innerText && fullText.innerText.length > 100) {
      let text = fullText.innerText.trim();
      text = text.replace(/\.\.\.Read more$/i, "").trim();
      return text;
    }

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

  const textElements = Array.from(document.querySelectorAll("span, p, div"))
    .filter((el) => {
      const text = el.innerText?.trim();
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

function extractList(type) {
  const allElements = Array.from(document.querySelectorAll("*"));

  for (const el of allElements) {
    const text = el.innerText?.toLowerCase();
    if (text && text.includes(type)) {
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

function extractSymbolFromURL() {
  const pathParts = window.location.pathname.split("/");
  const symbol = pathParts[pathParts.length - 1];
  return symbol || "N/A";
}

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
        tableData.rows.push(rowData);
      }
    });

    if (tableData.rows.length > 0) {
      tablesData.push(tableData);
    }
  });

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

function extractShareholdingPattern() {
  console.log("📊 Extracting Shareholding Pattern...");

  // Find the Shareholding Pattern heading
  const heading = Array.from(
    document.querySelectorAll("h1, h2, h3, div, span")
  ).find((el) => el.innerText?.trim().toLowerCase() === "shareholding pattern");

  if (!heading) {
    console.warn("⚠️ Shareholding Pattern heading not found");
    return null;
  }

  // The section containing entries
  const container =
    heading.parentElement?.parentElement || heading.closest("section, div");

  if (!container) {
    console.warn("⚠️ Could not locate Shareholding Pattern container");
    return null;
  }

  // All immediate children that look like rows
  const rowBlocks = Array.from(container.querySelectorAll("div")).filter(
    (block) => {
      const text = block.innerText?.trim();
      if (!text) return false;

      // exclude date row
      if (text.match(/(Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*'\d{2}/)) {
        return false;
      }

      // must contain one label and one value
      const parts = text.split("\n").map((t) => t.trim());
      return parts.length === 2 && parts[1].includes("%");
    }
  );

  if (rowBlocks.length === 0) {
    console.warn("⚠️ No shareholding rows found");
    return null;
  }

  const result = {};

  rowBlocks.forEach((block) => {
    const parts = block.innerText.split("\n").map((t) => t.trim());
    if (parts.length === 2) {
      const [key, val] = parts;
      result[key] = val;
    }
  });

  console.log("✅ Extracted Shareholding Pattern:", result);
  return result;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { extractGrowwStockData: window.extractGrowwStockData };
}

console.log("✅ Robust Groww DOM Extractor loaded successfully");
