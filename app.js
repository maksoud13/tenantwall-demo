// ═══════════════════════ CONFIG ═══════════════════════
// ⚠️ استبدل ده بالـ URL الحقيقي بتاع Codespace
const API_URL = "https://platforms-raise-architectural-fairly.trycloudflare.com";

// ═══════════════════════ EXAMPLES ═══════════════════════
const EXAMPLES = {
    simple: {
        sql: "SELECT * FROM orders WHERE total > 100",
        dialect: "mysql"
    },
    join: {
        sql: "SELECT o.id, o.total, c.name FROM orders o INNER JOIN customers c ON c.id = o.customer_id WHERE o.total > 100",
        dialect: "mysql"
    },
    union: {
        sql: "SELECT name FROM users WHERE age > 18 UNION SELECT name FROM users WHERE age < 5",
        dialect: "mysql"
    },
    cte: {
        sql: "WITH ranked AS (\n  SELECT id, contract_id, total,\n    ROW_NUMBER() OVER (PARTITION BY contract_id ORDER BY id DESC) AS rn\n  FROM orders\n)\nSELECT * FROM ranked WHERE rn = 1",
        dialect: "oracle"
    },
    subquery: {
        sql: "SELECT * FROM orders WHERE total > (SELECT AVG(total) FROM orders)",
        dialect: "mysql"
    }
};

// ═══════════════════════ DOM ELEMENTS ═══════════════════════
const sqlInput = document.getElementById("sqlInput");
const columnInput = document.getElementById("columnInput");
const valueInput = document.getElementById("valueInput");
const dialectInput = document.getElementById("dialectInput");
const processBtn = document.getElementById("processBtn");
const result = document.getElementById("result");
const engineInfo = document.getElementById("engineInfo");
const engineBadge = document.getElementById("engineBadge");
const engineTime = document.getElementById("engineTime");
const engineCached = document.getElementById("engineCached");
const copyBtn = document.getElementById("copyBtn");
const tabs = document.querySelectorAll(".tab");

// ═══════════════════════ STATE ═══════════════════════
let currentTab = "simple";
let currentResult = "";

// ═══════════════════════ INIT ═══════════════════════
function loadExample(name) {
    const ex = EXAMPLES[name];
    if (!ex) return;
    sqlInput.value = ex.sql;
    dialectInput.value = ex.dialect;
    processBtn.focus();
}

// ═══════════════════════ PROCESS SQL ═══════════════════════
async function processSql() {
    const sql = sqlInput.value.trim();
    const column = columnInput.value.trim();
    const value = valueInput.value.trim();
    const dialect = dialectInput.value;

    if (!sql) {
        showError("Please enter a SQL query");
        return;
    }
    if (!column || !value) {
        showError("Please enter filter column and value");
        return;
    }

    processBtn.disabled = true;
    processBtn.innerHTML = '<span class="spinner"></span> Processing...';
    result.innerHTML = '<div class="placeholder">Sending query...</div>';
    engineInfo.classList.add("hidden");

    try {
        const response = await fetch(`${API_URL}/api/modify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sql, column, value, dialect })
        });

        const data = await response.json();

        if (data.success) {
            currentResult = data.result;
            showResult(sql, data.result, column);
            showEngine(data.engine, data.timeMs, data.cached);
        } else {
            showError(data.error || "Unknown error");
        }
    } catch (e) {
        showError(`Network error: ${e.message}`);
    } finally {
        processBtn.disabled = false;
        processBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Process Query';
    }
}

// ═══════════════════════ RENDER ═══════════════════════
function showResult(original, modified, column) {
    const escaped = escapeHtml(modified);
    const colRegex = new RegExp(`(${escapeRegex(column)}\\s*=\\s*'[^']*')`, "g");
    const highlighted = escaped.replace(colRegex, '<span class="highlight">$1</span>');

    result.innerHTML = `
        <span class="label">Input</span>
        <div style="opacity:0.6;margin-bottom:16px;">${escapeHtml(original)}</div>
        <span class="label">Output</span>
        <div>${highlighted}</div>
    `;
}

function showEngine(engine, timeMs, cached) {
    engineInfo.classList.remove("hidden");
    
    if (engine === "python") {
        engineBadge.textContent = "🐍 Python Engine";
        engineBadge.classList.add("python");
    } else {
        engineBadge.textContent = "⚡ Local Engine";
        engineBadge.classList.remove("python");
    }
    
    engineTime.textContent = `${timeMs} ms`;
    
    if (cached) {
        engineCached.classList.remove("hidden");
    } else {
        engineCached.classList.add("hidden");
    }
}

function showError(msg) {
    result.innerHTML = `<span class="error">❌ ${escapeHtml(msg)}</span>`;
}

// ═══════════════════════ UTILITIES ═══════════════════════
function escapeHtml(s) {
    if (!s) return "";
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ═══════════════════════ EVENT LISTENERS ═══════════════════════
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentTab = tab.dataset.tab;
        loadExample(currentTab);
    });
});

processBtn.addEventListener("click", processSql);

sqlInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        processSql();
    }
});

copyBtn.addEventListener("click", () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(currentResult);
    copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    setTimeout(() => {
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    }, 2000);
});

// Initial load
loadExample("simple");