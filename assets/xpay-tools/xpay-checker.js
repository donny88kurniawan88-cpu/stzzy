(() => {
  "use strict";

  const state = {
    files: { xpay: null, zona: null, admin: null },
    parsed: { xpay: [], zona: [], admin: [] },
    results: {
      zonaMissing: [],
      p2mMissing: [],
      useridDiff: [],
      coinMissing: []
    }
  };

  const configs = {
    xpay: {
      label: "XPAY / LEONPAY",
      aliases: {
        userid: ["MEMBER"],
        nominal: ["RECORD VALUE", "RECORDVALUE"],
        orderid: ["PARTNER ID", "PATNER ID", "PARTNERID", "PATNERID"]
      }
    },
    zona: {
      label: "ZonaMain",
      aliases: {
        userid: ["USER ID", "USERID"],
        nominal: ["JUMLAH", "AMOUNT", "NOMINAL"],
        orderid: ["ORDER ID", "ORDERID"]
      },
      optionalAliases: {
        timestamp: ["TANGGAL", "DATE", "DATETIME", "DATE TIME", "WAKTU"]
      }
    },
    admin: {
      label: "Coin Admin",
      aliases: {
        userid: ["TO", "USER ID", "USERID"],
        nominal: ["COIN", "AMOUNT", "NOMINAL"]
      },
      optionalAliases: {
        timestamp: ["DATE", "TANGGAL", "DATETIME", "DATE TIME", "WAKTU"]
      }
    }
  };

  const resultMeta = {
    zonaMissing: {
      filename: "TIDAK_CETAK_ZONAMAIN.csv",
      sheet: "TIDAK CETAK ZONAMAIN",
      headers: ["USERID", "ORDER ID", "NOMINAL", "STATUS COIN ADMIN"],
      fields: ["useridDisplay", "orderDisplay", "nominal", "adminStatus"]
    },
    p2mMissing: {
      filename: "TIDAK_CETAK_P2M.csv",
      sheet: "TIDAK CETAK P2M",
      headers: ["MEMBER", "PARTNER ID", "RECORD VALUE", "STATUS COIN ADMIN"],
      fields: ["useridDisplay", "orderDisplay", "nominal", "adminStatus"]
    },
    useridDiff: {
      filename: "USERID_SELISIH.csv",
      sheet: "USERID SELISIH",
      headers: [
        "USERID",
        "ORDER ID ZONAMAIN PENYEBAB",
        "TOTAL NOMINAL ORDER",
        "TOTAL COIN ADMIN",
        "TOTAL ZONAMAIN",
        "SELISIH",
        "KETERANGAN"
      ],
      fields: [
        "useridDisplay",
        "orderIds",
        "orderNominalTotal",
        "adminTotal",
        "zonaTotal",
        "difference",
        "note"
      ]
    },
    coinMissing: {
      filename: "TIDAK_LEWAT_KOIN_IDN.csv",
      sheet: "TIDAK LEWAT KOIN IDN",
      headers: ["USERID", "ORDER ID", "NOMINAL", "KETERANGAN"],
      fields: ["useridDisplay", "orderDisplay", "nominal", "note"]
    }
  };

  const $ = (id) => document.getElementById(id);

  const elements = {
    fileXpay: $("fileXpay"),
    fileZona: $("fileZona"),
    fileAdmin: $("fileAdmin"),
    textXpay: $("textXpay"),
    textZona: $("textZona"),
    textAdmin: $("textAdmin"),
    statusXpay: $("statusXpay"),
    statusZona: $("statusZona"),
    statusAdmin: $("statusAdmin"),
    globalStatus: $("globalStatus"),
    btnProcess: $("btnProcess"),
    btnReset: $("btnReset"),
    btnDownloadAll: $("btnDownloadAll"),
    summary: $("summary"),
    results: $("results")
  };

  function normalizeHeader(value) {
    return String(value ?? "")
      .replace(/^\uFEFF/, "")
      .trim()
      .toUpperCase()
      .replace(/[_\-]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[^A-Z0-9 ]/g, "");
  }

  function normalizeText(value) {
    return String(value ?? "")
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase();
  }

  function displayText(value) {
    return String(value ?? "").replace(/^\uFEFF/, "").trim();
  }

  function parseNominal(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    let s = String(value ?? "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/rp/gi, "")
      .replace(/[^\d,.\-]/g, "");

    if (!s || s === "-") return 0;

    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    if (hasComma && hasDot) {
      // Separator terakhir dianggap desimal.
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
        s = s.replace(/\./g, "").replace(",", ".");
      } else {
        s = s.replace(/,/g, "");
      }
    } else if (hasComma) {
      const parts = s.split(",");
      const last = parts[parts.length - 1];
      if (parts.length > 2 || last.length === 3) {
        s = parts.join("");
      } else if (last.length <= 2) {
        s = parts.slice(0, -1).join("") + "." + last;
      } else {
        s = parts.join("");
      }
    } else if (hasDot) {
      const parts = s.split(".");
      const last = parts[parts.length - 1];
      if (parts.length > 2 || last.length === 3) {
        s = parts.join("");
      }
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  function parseDateTime(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.getTime();
    }

    // Excel serial date, misalnya 46226.5.
    if (typeof value === "number" && Number.isFinite(value) && value > 20000) {
      if (window.XLSX?.SSF?.parse_date_code) {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) {
          return new Date(
            parsed.y,
            parsed.m - 1,
            parsed.d,
            parsed.H || 0,
            parsed.M || 0,
            Math.floor(parsed.S || 0)
          ).getTime();
        }
      }
    }

    const s = String(value ?? "").trim();
    if (!s) return null;

    let match = s.match(
      /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/
    );

    if (match) {
      return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6] || 0)
      ).getTime();
    }

    match = s.match(
      /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/
    );

    if (match) {
      return new Date(
        Number(match[3]),
        Number(match[2]) - 1,
        Number(match[1]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6] || 0)
      ).getTime();
    }

    const fallback = Date.parse(s);
    return Number.isNaN(fallback) ? null : fallback;
  }

  function numericKey(value) {
    return (Math.round(Number(value || 0) * 100) / 100).toFixed(2);
  }

  function pairKey(userid, nominal) {
    return `${normalizeText(userid)}|${numericKey(nominal)}`;
  }

  function formatNumber(value) {
    const n = Number(value || 0);
    const hasDecimal = Math.abs(n - Math.round(n)) > 1e-9;
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: 2
    }).format(n);
  }

  function formatInteger(value) {
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value || 0);
  }

  function setSourceStatus(type, message, statusClass = "") {
    const el = type === "xpay"
      ? elements.statusXpay
      : type === "zona"
        ? elements.statusZona
        : elements.statusAdmin;

    el.className = `source-status ${statusClass}`.trim();
    el.textContent = message;
  }

  function setGlobalStatus(message, isError = false) {
    elements.globalStatus.textContent = message;
    elements.globalStatus.style.color = isError ? "#ff8797" : "";
  }

  function findHeaderRow(matrix, config) {
    const maxScan = Math.min(matrix.length, 50);
    const requiredFields = Object.keys(config.aliases);

    for (let r = 0; r < maxScan; r++) {
      const row = Array.isArray(matrix[r]) ? matrix[r] : [];
      const normalized = row.map(normalizeHeader);
      const mapping = {};
      let allFound = true;

      for (const field of requiredFields) {
        const aliases = config.aliases[field].map(normalizeHeader);
        const index = normalized.findIndex(h => aliases.includes(h));
        if (index === -1) {
          allFound = false;
          break;
        }
        mapping[field] = index;
      }

      if (allFound) return { rowIndex: r, mapping };
    }

    throw new Error(
      `Kolom wajib ${config.label} tidak ditemukan. ` +
      `Pastikan judul kolom sesuai: ${Object.values(config.aliases).map(a => a[0]).join(", ")}.`
    );
  }

  function matrixToRecords(matrix, type) {
    const config = configs[type];
    const { rowIndex, mapping } = findHeaderRow(matrix, config);
    const records = [];

    const headerRow = Array.isArray(matrix[rowIndex]) ? matrix[rowIndex] : [];
    const normalizedHeaders = headerRow.map(normalizeHeader);
    let timestampIndex = -1;

    if (config.optionalAliases?.timestamp) {
      const timeAliases = config.optionalAliases.timestamp.map(normalizeHeader);
      timestampIndex = normalizedHeaders.findIndex(header => timeAliases.includes(header));
    }

    for (let r = rowIndex + 1; r < matrix.length; r++) {
      const row = Array.isArray(matrix[r]) ? matrix[r] : [];
      const useridRaw = row[mapping.userid];
      const userid = normalizeText(useridRaw);
      const useridDisplay = displayText(useridRaw);

      // Footer total dengan userid kosong tidak boleh ikut dihitung.
      if (!userid) continue;

      const nominalRaw = row[mapping.nominal];
      const nominal = parseNominal(nominalRaw);
      const timestampRaw = timestampIndex >= 0 ? row[timestampIndex] : "";
      const timestamp = parseDateTime(timestampRaw);

      if (type === "admin") {
        records.push({
          userid,
          useridDisplay,
          nominal,
          timestamp,
          timestampDisplay: displayText(timestampRaw),
          sourceRow: r + 1
        });
        continue;
      }

      const orderRaw = row[mapping.orderid];
      const orderid = normalizeText(orderRaw);
      const orderDisplay = displayText(orderRaw);

      // Baris transaksi tanpa order ID diabaikan agar MATCH tidak terganggu footer/keterangan.
      if (!orderid) continue;

      records.push({
        userid,
        useridDisplay,
        nominal,
        orderid,
        orderDisplay,
        timestamp,
        timestampDisplay: displayText(timestampRaw),
        sourceRow: r + 1
      });
    }

    return {
      records,
      headerRow: rowIndex + 1,
      mapping
    };
  }

  function workbookToMatrix(workbook) {
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("File tidak memiliki worksheet.");

    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      raw: true,
      defval: ""
    });
  }

  async function parseFile(file, type) {
    if (!window.XLSX) {
      throw new Error("Library pembaca Excel gagal dimuat. Pastikan internet aktif saat membuka HTML.");
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {
      type: "array",
      raw: true,
      cellDates: false
    });

    return matrixToRecords(workbookToMatrix(workbook), type);
  }

  function parsePastedText(text, type) {
    if (!window.XLSX) {
      throw new Error("Library pembaca data gagal dimuat. Pastikan internet aktif saat membuka HTML.");
    }

    const workbook = XLSX.read(text, {
      type: "string",
      raw: true
    });

    return matrixToRecords(workbookToMatrix(workbook), type);
  }

  async function loadSource(type) {
    const fileEl = type === "xpay"
      ? elements.fileXpay
      : type === "zona"
        ? elements.fileZona
        : elements.fileAdmin;

    const textEl = type === "xpay"
      ? elements.textXpay
      : type === "zona"
        ? elements.textZona
        : elements.textAdmin;

    const file = fileEl.files?.[0];
    const text = textEl.value.trim();

    if (!file && !text) {
      throw new Error(`Data ${configs[type].label} belum diisi.`);
    }

    setSourceStatus(type, "Sedang membaca data...");

    const parsed = file
      ? await parseFile(file, type)
      : parsePastedText(text, type);

    state.parsed[type] = parsed.records;

    const nominalTotal = parsed.records.reduce((sum, row) => sum + row.nominal, 0);
    const sourceName = file ? file.name : "data tempelan";

    setSourceStatus(
      type,
      `${sourceName}: ${formatInteger(parsed.records.length)} baris, total ${formatNumber(nominalTotal)}. Header baris ${parsed.headerRow}.`,
      "ok"
    );

    return parsed.records;
  }

  function sumByUserid(rows) {
    const map = new Map();

    for (const row of rows) {
      const current = map.get(row.userid) || 0;
      map.set(row.userid, current + row.nominal);
    }

    return map;
  }

  function findReassignedNote(userid, zonaRows, xpayByOrder) {
    const notes = [];
    const seen = new Set();

    for (const zonaRow of zonaRows) {
      if (zonaRow.userid !== userid) continue;

      const xpayRow = xpayByOrder.get(zonaRow.orderid);
      if (!xpayRow || xpayRow.userid === userid) continue;

      const note = `Order ${zonaRow.orderDisplay} sudah diproses ke userid: ${xpayRow.useridDisplay}`;
      if (!seen.has(note)) {
        seen.add(note);
        notes.push(note);
      }
    }

    return notes.slice(0, 3).join(" | ");
  }

  function getUnmatchedZonaOrders(userid, zonaRows, adminRows) {
    const zonaUserRows = zonaRows
      .filter(row => row.userid === userid)
      .map(row => ({ ...row, matched: false }));

    const adminUserRows = adminRows
      .filter(row => row.userid === userid)
      .slice()
      .sort((a, b) => {
        const at = Number.isFinite(a.timestamp) ? a.timestamp : Number.MAX_SAFE_INTEGER;
        const bt = Number.isFinite(b.timestamp) ? b.timestamp : Number.MAX_SAFE_INTEGER;
        return at - bt || a.sourceRow - b.sourceRow;
      });

    for (const adminRow of adminUserRows) {
      const candidates = zonaUserRows.filter(row =>
        !row.matched && numericKey(row.nominal) === numericKey(adminRow.nominal)
      );

      if (!candidates.length) continue;

      let chosen = candidates[0];

      if (Number.isFinite(adminRow.timestamp)) {
        const timed = candidates.filter(row => Number.isFinite(row.timestamp));

        if (timed.length) {
          // Karena Coin Admin biasanya dicatat setelah transaksi ZonaMain,
          // prioritaskan transaksi sebelum/tepat pada waktu admin yang paling dekat.
          const previous = timed.filter(row => row.timestamp <= adminRow.timestamp);

          const pool = previous.length ? previous : timed;
          chosen = pool.reduce((best, row) => {
            const bestDistance = Math.abs(adminRow.timestamp - best.timestamp);
            const rowDistance = Math.abs(adminRow.timestamp - row.timestamp);

            if (rowDistance !== bestDistance) {
              return rowDistance < bestDistance ? row : best;
            }

            return row.sourceRow < best.sourceRow ? row : best;
          }, pool[0]);
        }
      }

      chosen.matched = true;
    }

    return zonaUserRows
      .filter(row => !row.matched)
      .sort((a, b) => {
        const at = Number.isFinite(a.timestamp) ? a.timestamp : Number.MAX_SAFE_INTEGER;
        const bt = Number.isFinite(b.timestamp) ? b.timestamp : Number.MAX_SAFE_INTEGER;
        return at - bt || a.sourceRow - b.sourceRow;
      });
  }

  function calculateResults() {
    const xpay = state.parsed.xpay;
    const zona = state.parsed.zona;
    const admin = state.parsed.admin;

    const xpayOrders = new Set(xpay.map(r => r.orderid));
    const zonaOrders = new Set(zona.map(r => r.orderid));
    const adminPairs = new Set(admin.map(r => pairKey(r.userid, r.nominal)));

    const xpayByOrder = new Map();
    for (const row of xpay) {
      if (!xpayByOrder.has(row.orderid)) xpayByOrder.set(row.orderid, row);
    }

    state.results.zonaMissing = zona
      .filter(row => !xpayOrders.has(row.orderid))
      .map(row => ({
        ...row,
        adminStatus: adminPairs.has(pairKey(row.userid, row.nominal))
          ? "Ada di Coin Admin"
          : "Tidak ada di Coin Admin"
      }));

    state.results.p2mMissing = xpay
      .filter(row => !zonaOrders.has(row.orderid))
      .map(row => ({
        ...row,
        adminStatus: adminPairs.has(pairKey(row.userid, row.nominal))
          ? "Ada di Coin Admin"
          : "Tidak ada di Coin Admin"
      }));

    // Mengikuti =UNIQUE(I:I), jadi daftar userid utama berasal dari Coin Admin.
    const adminTotals = sumByUserid(admin);
    const zonaTotals = sumByUserid(zona);

    const displayByAdminUser = new Map();
    for (const row of admin) {
      if (!displayByAdminUser.has(row.userid)) {
        displayByAdminUser.set(row.userid, row.useridDisplay);
      }
    }

    state.results.useridDiff = [];

    for (const [userid, adminTotal] of adminTotals.entries()) {
      const zonaTotal = zonaTotals.get(userid) || 0;
      const difference = adminTotal - zonaTotal;

      if (Math.abs(difference) < 0.000001) continue;

      let orderRows = [];
      let orderIds = "-";
      let orderNominalTotal = 0;
      let note;

      if (difference < 0) {
        orderRows = getUnmatchedZonaOrders(userid, zona, admin);

        // Fallback jika tidak ada pasangan nominal yang dapat ditentukan.
        if (!orderRows.length) {
          orderRows = zona.filter(row => row.userid === userid);
        }

        orderIds = orderRows.length
          ? orderRows.map(row =>
              `${row.orderDisplay} (${formatNumber(row.nominal)})`
            ).join("\n")
          : "-";

        orderNominalTotal = orderRows.reduce((sum, row) => sum + row.nominal, 0);

        const reassigned = findReassignedNote(userid, orderRows, xpayByOrder);
        note =
          `ZonaMain lebih besar ${formatNumber(Math.abs(difference))}. ` +
          `${formatInteger(orderRows.length)} order ZonaMain belum memiliki pasangan Coin Admin.`;

        if (reassigned) note += ` ${reassigned}`;
      } else {
        note = `Coin Admin lebih besar ${formatNumber(difference)}. Tidak ada Order ID ZonaMain tambahan.`;
      }

      state.results.useridDiff.push({
        userid,
        useridDisplay: displayByAdminUser.get(userid) || userid,
        orderIds,
        orderNominalTotal,
        adminTotal,
        zonaTotal,
        difference,
        note
      });
    }

    state.results.coinMissing = zona
      .filter(row => !adminPairs.has(pairKey(row.userid, row.nominal)))
      .map(row => {
        const xpayRow = xpayByOrder.get(row.orderid);
        let note = "Userid + nominal tidak ditemukan di Coin Admin";

        if (xpayRow && xpayRow.userid !== row.userid) {
          note = `Order sudah diproses ke userid: ${xpayRow.useridDisplay}`;
        } else if (xpayRow) {
          note = "Order ada di XPAY, tetapi userid + nominal tidak ada di Coin Admin";
        }

        return { ...row, note };
      });

    // Sort agar hasil mudah diperiksa.
    state.results.zonaMissing.sort((a,b) => a.userid.localeCompare(b.userid));
    state.results.p2mMissing.sort((a,b) => a.userid.localeCompare(b.userid));
    state.results.useridDiff.sort((a,b) => Math.abs(b.difference) - Math.abs(a.difference));
    state.results.coinMissing.sort((a,b) => a.userid.localeCompare(b.userid));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderOrderIds(value) {
    const orders = String(value ?? "-")
      .split("\n")
      .filter(Boolean);

    return orders
      .map(order => `<span class="order-item">${escapeHtml(order)}</span>`)
      .join("");
  }

  function renderEmpty(containerId) {
    $(containerId).innerHTML = '<div class="empty">Tidak ada data.</div>';
  }

  function renderZonaMissing() {
    const rows = state.results.zonaMissing;
    if (!rows.length) return renderEmpty("tableZonaMissing");

    const body = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.useridDisplay)}</td>
        <td>${escapeHtml(r.orderDisplay)}</td>
        <td class="num">${formatNumber(r.nominal)}</td>
        <td>
          <span class="pill ${r.adminStatus.startsWith("Ada") ? "pill-ok" : "pill-bad"}">
            ${escapeHtml(r.adminStatus)}
          </span>
        </td>
      </tr>`).join("");

    $("tableZonaMissing").innerHTML = `
      <table>
        <thead><tr>
          <th>NO</th><th>USERID</th><th>ORDER ID</th><th class="num">NOMINAL</th><th>STATUS COIN ADMIN</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>`;
  }

  function renderP2MMissing() {
    const rows = state.results.p2mMissing;
    if (!rows.length) return renderEmpty("tableP2MMissing");

    const body = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.useridDisplay)}</td>
        <td>${escapeHtml(r.orderDisplay)}</td>
        <td class="num">${formatNumber(r.nominal)}</td>
        <td>
          <span class="pill ${r.adminStatus.startsWith("Ada") ? "pill-ok" : "pill-bad"}">
            ${escapeHtml(r.adminStatus)}
          </span>
        </td>
      </tr>`).join("");

    $("tableP2MMissing").innerHTML = `
      <table>
        <thead><tr>
          <th>NO</th><th>MEMBER</th><th>PARTNER ID</th><th class="num">RECORD VALUE</th><th>STATUS COIN ADMIN</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>`;
  }

  function renderUseridDiff() {
    const rows = state.results.useridDiff;
    if (!rows.length) return renderEmpty("tableUseridDiff");

    const body = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.useridDisplay)}</td>
        <td class="order-cell">${renderOrderIds(r.orderIds)}</td>
        <td class="num">${formatNumber(r.orderNominalTotal)}</td>
        <td class="num">${formatNumber(r.adminTotal)}</td>
        <td class="num">${formatNumber(r.zonaTotal)}</td>
        <td class="num ${r.difference < 0 ? "diff-negative" : "diff-positive"}">
          ${formatNumber(r.difference)}
        </td>
        <td>${escapeHtml(r.note)}</td>
      </tr>`).join("");

    $("tableUseridDiff").innerHTML = `
      <table>
        <thead><tr>
          <th>NO</th>
          <th>USERID</th>
          <th>ORDER ID ZONAMAIN PENYEBAB</th>
          <th class="num">TOTAL NOMINAL ORDER</th>
          <th class="num">TOTAL COIN ADMIN</th>
          <th class="num">TOTAL ZONAMAIN</th>
          <th class="num">SELISIH</th>
          <th>KETERANGAN</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>`;
  }

  function renderCoinMissing() {
    const rows = state.results.coinMissing;
    if (!rows.length) return renderEmpty("tableCoinMissing");

    const body = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.useridDisplay)}</td>
        <td>${escapeHtml(r.orderDisplay)}</td>
        <td class="num">${formatNumber(r.nominal)}</td>
        <td>${escapeHtml(r.note)}</td>
      </tr>`).join("");

    $("tableCoinMissing").innerHTML = `
      <table>
        <thead><tr>
          <th>NO</th><th>USERID</th><th>ORDER ID</th><th class="num">NOMINAL</th><th>KETERANGAN</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>`;
  }

  function renderResults() {
    $("countZona").textContent = formatInteger(state.results.zonaMissing.length);
    $("countP2M").textContent = formatInteger(state.results.p2mMissing.length);
    $("countUserid").textContent = formatInteger(state.results.useridDiff.length);
    $("countCoin").textContent = formatInteger(state.results.coinMissing.length);

    renderZonaMissing();
    renderP2MMissing();
    renderUseridDiff();
    renderCoinMissing();

    elements.summary.classList.remove("hidden");
    elements.results.classList.remove("hidden");
    elements.btnDownloadAll.disabled = false;
  }

  function rawExportRows(key) {
    const meta = resultMeta[key];
    return state.results[key].map(row => {
      const output = {};
      meta.headers.forEach((header, i) => {
        const field = meta.fields[i];
        output[header] = row[field];
      });
      return output;
    });
  }

  function tsvForResult(key) {
    const meta = resultMeta[key];
    const rows = state.results[key];

    const lines = [meta.headers.join("\t")];

    for (const row of rows) {
      lines.push(meta.fields.map(field => {
        const value = row[field];
        return typeof value === "number" ? String(value) : String(value ?? "");
      }).join("\t"));
    }

    return lines.join("\n");
  }

  async function copyResult(key, button) {
    const text = tsvForResult(key);

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const temp = document.createElement("textarea");
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      temp.remove();
    }

    const old = button.textContent;
    button.textContent = "TERSALIN";
    setTimeout(() => button.textContent = old, 1200);
  }

  function csvEscape(value) {
    const s = String(value ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  }

  function downloadCsv(key) {
    const meta = resultMeta[key];
    const rows = rawExportRows(key);
    const lines = [meta.headers.map(csvEscape).join(",")];

    for (const row of rows) {
      lines.push(meta.headers.map(header => csvEscape(row[header])).join(","));
    }

    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = meta.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadAllXlsx() {
    if (!window.XLSX) {
      alert("Library Excel belum tersedia.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    for (const key of Object.keys(resultMeta)) {
      const meta = resultMeta[key];
      const data = rawExportRows(key);
      const worksheet = XLSX.utils.json_to_sheet(data, { header: meta.headers });

      // Lebar kolom agar hasil Excel langsung nyaman dibaca.
      worksheet["!cols"] = meta.headers.map(header => ({
        wch: Math.max(15, Math.min(55, header.length + 8))
      }));

      XLSX.utils.book_append_sheet(workbook, worksheet, meta.sheet.substring(0, 31));
    }

    XLSX.writeFile(workbook, "HASIL_SELISIH_XPAY_ZONAMAIN_ADMIN.xlsx");
  }

  async function processAll() {
    elements.btnProcess.disabled = true;
    elements.btnDownloadAll.disabled = true;
    elements.summary.classList.add("hidden");
    elements.results.classList.add("hidden");
    setGlobalStatus("Membaca dan menghitung data...");

    try {
      await Promise.all([
        loadSource("xpay"),
        loadSource("zona"),
        loadSource("admin")
      ]);

      calculateResults();
      renderResults();

      const total =
        state.results.zonaMissing.length +
        state.results.p2mMissing.length +
        state.results.useridDiff.length +
        state.results.coinMissing.length;

      setGlobalStatus(`Selesai. Ditemukan ${formatInteger(total)} baris hasil.`);
    } catch (error) {
      console.error(error);
      setGlobalStatus(error.message || "Terjadi kesalahan saat memproses data.", true);
    } finally {
      elements.btnProcess.disabled = false;
    }
  }

  function resetAll() {
    state.files = { xpay: null, zona: null, admin: null };
    state.parsed = { xpay: [], zona: [], admin: [] };
    state.results = {
      zonaMissing: [],
      p2mMissing: [],
      useridDiff: [],
      coinMissing: []
    };

    [
      elements.fileXpay, elements.fileZona, elements.fileAdmin,
      elements.textXpay, elements.textZona, elements.textAdmin
    ].forEach(el => el.value = "");

    setSourceStatus("xpay", "Belum ada data.");
    setSourceStatus("zona", "Belum ada data.");
    setSourceStatus("admin", "Belum ada data.");
    setGlobalStatus("Masukkan tiga sumber data.");

    elements.summary.classList.add("hidden");
    elements.results.classList.add("hidden");
    elements.btnDownloadAll.disabled = true;

    ["tableZonaMissing","tableP2MMissing","tableUseridDiff","tableCoinMissing"]
      .forEach(id => $(id).innerHTML = "");
  }

  // Saat memilih file, beri tanda dan kosongkan textarea agar sumber tidak membingungkan.
  [
    ["xpay", elements.fileXpay, elements.textXpay],
    ["zona", elements.fileZona, elements.textZona],
    ["admin", elements.fileAdmin, elements.textAdmin]
  ].forEach(([type, fileEl, textEl]) => {
    fileEl.addEventListener("change", () => {
      const file = fileEl.files?.[0];
      if (file) {
        textEl.value = "";
        setSourceStatus(type, `File dipilih: ${file.name}`);
      }
    });

    textEl.addEventListener("input", () => {
      if (textEl.value.trim()) {
        fileEl.value = "";
        setSourceStatus(type, "Menggunakan data tempelan.");
      }
    });
  });

  elements.btnProcess.addEventListener("click", processAll);
  elements.btnReset.addEventListener("click", resetAll);
  elements.btnDownloadAll.addEventListener("click", downloadAllXlsx);

  document.addEventListener("click", (event) => {
    const copyKey = event.target?.dataset?.copy;
    const csvKey = event.target?.dataset?.csv;

    if (copyKey) copyResult(copyKey, event.target);
    if (csvKey) downloadCsv(csvKey);
  });
})();