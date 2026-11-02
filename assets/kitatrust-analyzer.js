/* ============================================================
   KITATRUST ANALYZER v1.0.0 (Task 43 — v3.14.8)
   ------------------------------------------------------------
   Logic senada XPAY Analyzer (assets/xpay-tools/xpay-checker.js):
   import file -> deteksi baris judul via alias -> normalisasi ->
   analisis -> kartu ringkasan + tabel temuan -> COPY / CSV / XLSX.
   Yang berbeda: tampilan (tema terang) + format data Kitatrust
   (Status, Settled, Created At, Paid At, Merchant Group Name,
   Merchant Name, RRN, Amount, Total Payment, Reference ID,
   Merchant Ref ID, Settled At — tanggal M/D/YYYY, RRN bisa
   notasi ilmiah Excel seperti 6.11019E+11).

   Tabel hasil:
   1. BELUM SETTLE        : SUCCESS tapi flag Settled != TRUE
   2. STATUS BERMASALAH   : Status selain SUCCESS
   3. DUPLIKAT REFERENCE  : Reference ID / Merchant Ref ID ganda
   4. FEE TIDAK BIASA     : fee menyimpang dari rasio mayoritas
   5. REKAP MERCHANT      : total per Merchant Name
   6. REKAP TANGGAL       : total per tanggal Settled At
   + DETAIL TRANSAKSI (filter pencarian & status)

   Semua pemrosesan lokal di browser. Helper murni diekspos ke
   window.KitatrustAnalyzer untuk pengujian otomatis.
   ============================================================ */
(() => {
  "use strict";

  const KTA_VERSION = "1.0.0";
  const DETAIL_MAX = 300;

  const state = {
    file: null,
    parsed: [],
    results: null,
    filter: { q: "", status: "all" }
  };

  /* ===== ALIAS KOLOM (dinormalisasi via normalizeHeader) =====
     Sengaja EXACT-match saja: "Settled" vs "Settled At" berbahaya
     bila pakai pencocokan prefix (prefix "SETTLED" akan menangkap
     kolom "SETTLED AT"). Format export Kitatrust tetap, jadi
     exact-match + normalisasi spasi/huruf sudah cukup dan aman. */
  const KT_FIELDS = {
    required: {
      status:       ["STATUS"],
      settled:      ["SETTLED", "IS SETTLED"],
      amount:       ["AMOUNT", "NOMINAL"],
      totalPayment: ["TOTAL PAYMENT", "TOTALPAYMENT", "TOTAL PAYEMENT"],
      referenceId:  ["REFERENCE ID", "REFERENCEID", "REF ID", "REFID"]
    },
    optional: {
      createdAt:     ["CREATED AT", "CREATEDAT", "CREATED DATE"],
      paidAt:        ["PAID AT", "PAIDAT", "PAID DATE"],
      merchantGroup: ["MERCHANT GROUP NAME", "MERCHANT GROUP", "MERCHANTGROUPNAME"],
      merchantName:  ["MERCHANT NAME", "MERCHANTNAME"],
      rrn:           ["RRN", "RRN NUMBER"],
      merchantRefId: ["MERCHANT REF ID", "MERCHANTREFID", "MERCHANT REFERENCE ID"],
      settledAt:     ["SETTLED AT", "SETTLEDAT", "SETTLEMENT DATE", "SETTLEMENT AT"]
    }
  };

  const resultMeta = {
    unsettled: {
      filename: "KITATRUST_BELUM_SETTLE.csv",
      sheet: "BELUM SETTLE",
      headers: ["CREATED AT", "MERCHANT", "RRN", "AMOUNT", "TOTAL PAYMENT", "REFERENCE ID", "KETERANGAN"],
      fields: ["createdAt", "merchantLabel", "rrn", "amount", "totalPayment", "referenceId", "note"]
    },
    failed: {
      filename: "KITATRUST_STATUS_BERMASALAH.csv",
      sheet: "STATUS BERMASALAH",
      headers: ["CREATED AT", "STATUS", "MERCHANT", "RRN", "AMOUNT", "TOTAL PAYMENT", "REFERENCE ID"],
      fields: ["createdAt", "status", "merchantLabel", "rrn", "amount", "totalPayment", "referenceId"]
    },
    duplicates: {
      filename: "KITATRUST_DUPLIKAT_REFERENCE.csv",
      sheet: "DUPLIKAT REFERENCE",
      headers: ["CREATED AT", "MERCHANT", "AMOUNT", "TOTAL PAYMENT", "REFERENCE ID", "MERCHANT REF ID", "KETERANGAN"],
      fields: ["createdAt", "merchantLabel", "amount", "totalPayment", "referenceId", "merchantRefId", "dupNote"]
    },
    feeOdd: {
      filename: "KITATRUST_FEE_TIDAK_BIASA.csv",
      sheet: "FEE TIDAK BIASA",
      headers: ["CREATED AT", "MERCHANT", "RRN", "AMOUNT", "TOTAL PAYMENT", "FEE", "FEE PERSEN", "STANDAR PERSEN"],
      fields: ["createdAt", "merchantLabel", "rrn", "amount", "totalPayment", "fee", "feePctLabel", "stdPctLabel"]
    },
    byMerchant: {
      filename: "KITATRUST_REKAP_MERCHANT.csv",
      sheet: "REKAP MERCHANT",
      headers: ["MERCHANT", "TRANSAKSI", "TOTAL AMOUNT", "TOTAL DITERIMA", "TOTAL FEE"],
      fields: ["label", "count", "amount", "payment", "fee"]
    },
    byDate: {
      filename: "KITATRUST_REKAP_TANGGAL.csv",
      sheet: "REKAP TANGGAL",
      headers: ["TANGGAL SETTLEMENT", "TRANSAKSI", "TOTAL AMOUNT", "TOTAL DITERIMA", "TOTAL FEE"],
      fields: ["label", "count", "amount", "payment", "fee"]
    }
  };

  /* ================= HELPER MURNI ================= */

  function normalizeHeader(value) {
    return String(value == null ? "" : value)
      .replace(/^\uFEFF/, "")
      .trim()
      .toUpperCase()
      .replace(/[_\-]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[^A-Z0-9 ]/g, "");
  }

  function normalizeText(value) {
    return String(value == null ? "" : value)
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase();
  }

  function displayText(value) {
    return String(value == null ? "" : value).replace(/^\uFEFF/, "").trim();
  }

  /* Nominal: dukung "27000", "27.000", "27,000.5", "Rp 27.000" —
     logika sama dengan XPAY (pemisah terakhir dianggap desimal). */
  function parseNominal(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    let s = String(value == null ? "" : value)
      .trim()
      .replace(/\s+/g, "")
      .replace(/rp/gi, "")
      .replace(/[^\d,.\-]/g, "");

    if (!s || s === "-") return 0;

    const hasComma = s.indexOf(",") !== -1;
    const hasDot = s.indexOf(".") !== -1;

    if (hasComma && hasDot) {
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

  const KT_MONTHS = {
    jan: 1, january: 1, januari: 1,
    feb: 2, february: 2, februari: 2,
    mar: 3, march: 3, maret: 3,
    apr: 4, april: 4,
    may: 5, mei: 5,
    jun: 6, june: 6, juni: 6,
    jul: 7, july: 7, juli: 7,
    aug: 8, august: 8, agu: 8, agt: 8, agustus: 8,
    sep: 9, september: 9,
    oct: 10, october: 10, okt: 10, oktober: 10,
    nov: 11, november: 11,
    dec: 12, december: 12, des: 12, desember: 12
  };

  function ktYear(y) {
    y = Number(y);
    if (y < 100) y += y >= 50 ? 1900 : 2000;
    return y;
  }

  /* Tanggal Kitatrust berformat US M/D/YYYY (contoh resmi user:
     11/1/2026 23:50 dibuat, 11/2/2026 5:36 settle = D+1).
     DEFAULT bulan-lebih-dulu; bila angka pertama jelas > 12
     (mis. 13/11/2026) balik ke hari-lebih-dulu. */
  function ktParseDateTime(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.getTime();
    }

    if (typeof value === "number" && Number.isFinite(value) && value > 20000) {
      if (typeof window !== "undefined" && window.XLSX && window.XLSX.SSF && window.XLSX.SSF.parse_date_code) {
        const parsed = window.XLSX.SSF.parse_date_code(value);
        if (parsed) {
          return new Date(
            parsed.y, parsed.m - 1, parsed.d,
            parsed.H || 0, parsed.M || 0, Math.floor(parsed.S || 0)
          ).getTime();
        }
      }
      return null;
    }

    let s = String(value == null ? "" : value).trim();
    if (!s) return null;

    s = s.replace(
      /^(minggu|ahad|senin|selasa|rabu|kamis|jumat|jum'?at|sabtu|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*,?\s*/i,
      ""
    ).trim();

    // ISO yyyy-mm-dd (dengan /) — tidak ambigu.
    let match = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (match) {
      return new Date(
        Number(match[1]), Number(match[2]) - 1, Number(match[3]),
        Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0)
      ).getTime();
    }

    // M/D/YYYY (default Kitatrust) — dengan pengaman hari > 12.
    match = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (match) {
      let a = Number(match[1]);
      let b = Number(match[2]);
      let month = a;
      let day = b;
      if (a > 12 && b <= 12) { month = b; day = a; }
      return new Date(
        ktYear(match[3]), month - 1, day,
        Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0)
      ).getTime();
    }

    // 05-Sep-2025 23:30 / 5 Sep 25
    match = s.match(/^(\d{1,2})[\s\/\-]([A-Za-z]{3,9})\.?,?(?:[\s\/\-,]+(\d{2,4}))?(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (match) {
      const month = KT_MONTHS[match[2].toLowerCase()];
      if (month && match[3]) {
        return new Date(
          ktYear(match[3]), month - 1, Number(match[1]),
          Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0)
        ).getTime();
      }
    }

    // Sep 5, 2025 23:30
    match = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{2,4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/i);
    if (match) {
      const month = KT_MONTHS[match[1].toLowerCase()];
      if (month) {
        return new Date(
          ktYear(match[3]), month - 1, Number(match[2]),
          Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0)
        ).getTime();
      }
    }

    const fallback = Date.parse(s);
    return Number.isNaN(fallback) ? null : fallback;
  }

  /* RRN sering rusak oleh Excel menjadi notasi ilmiah.
     "6.11019E+11" -> "611019000000"; "1trg2ol03714" tetap. */
  function ktRrnDisplay(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(Math.round(value));
    }
    const s = displayText(value);
    if (/^[+-]?\d+(?:\.\d+)?[eE]\+\d+$/.test(s)) {
      const n = Number(s);
      if (Number.isFinite(n)) return String(Math.round(n));
    }
    return s;
  }

  function ktParseBool(value) {
    const s = normalizeText(value);
    if (s === "true" || s === "1" || s === "yes" || s === "ya") return true;
    if (s === "false" || s === "0" || s === "no" || s === "tidak") return false;
    return null;
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  /* ===== CSV/TSV SENDERI (quote-aware + deteksi pemisah) ===== */

  function countOutsideQuotes(line, delim) {
    let inQuote = false;
    let count = 0;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (!inQuote && ch === delim) count++;
    }
    return count;
  }

  function detectDelimiter(text) {
    const sample = String(text || "").replace(/^\uFEFF/, "").slice(0, 8000);
    const lines = sample.split(/\r?\n/).filter(l => l.trim()).slice(0, 20);
    const candidates = [",", ";", "\t", "|"];
    let best = ",";
    let bestScore = -1;

    for (const d of candidates) {
      const counts = lines.map(l => countOutsideQuotes(l, d));
      const max = Math.max.apply(null, counts.concat([0]));
      if (max <= 0) continue;
      const consistent = counts.filter(c => c === max).length / counts.length;
      const score = max * consistent;
      if (score > bestScore) { bestScore = score; best = d; }
    }
    return best;
  }

  function splitDelimitedLine(line, delim) {
    const out = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuote = !inQuote; }
        continue;
      }
      if (!inQuote && ch === delim) { out.push(cur); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur);
    return out;
  }

  function splitDelimited(text) {
    const clean = String(text == null ? "" : text).replace(/^\uFEFF/, "");
    const delim = detectDelimiter(clean);
    const lines = clean.split(/\r?\n/);
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    return lines.map(line => splitDelimitedLine(line, delim));
  }

  /* ================= PEMBACAAN DATA ================= */

  function findHeaderRow(matrix) {
    const maxScan = Math.min(matrix.length, 50);
    const required = KT_FIELDS.required;

    for (let r = 0; r < maxScan; r++) {
      const row = Array.isArray(matrix[r]) ? matrix[r] : [];
      const normalized = row.map(normalizeHeader);
      const mapping = {};
      let allFound = true;

      for (const field of Object.keys(required)) {
        const aliases = required[field].map(normalizeHeader);
        const index = normalized.findIndex(h => h && aliases.indexOf(h) !== -1);
        if (index === -1) { allFound = false; break; }
        mapping[field] = index;
      }

      if (allFound) {
        // Kolom opsional dipetakan bila ada.
        for (const field of Object.keys(KT_FIELDS.optional)) {
          const aliases = KT_FIELDS.optional[field].map(normalizeHeader);
          const idx = normalized.findIndex(h => h && aliases.indexOf(h) !== -1);
          mapping[field] = idx; // -1 bila tidak ada
        }
        return { rowIndex: r, mapping };
      }
    }

    const sampleRow = Array.isArray(matrix[0]) ? matrix[0] : [];
    const sample = sampleRow.slice(0, 8)
      .map(h => `"${displayText(h)}"`)
      .filter(x => x !== '""')
      .join(", ");

    throw new Error(
      "Kolom wajib Kitatrust tidak ditemukan. Pastikan judul kolom mencakup: " +
      "Status, Settled, Amount, Total Payment, Reference ID. " +
      "Judul terbaca di baris pertama: " + (sample || "(kosong)") + "."
    );
  }

  function matrixToRecords(matrix) {
    const { rowIndex, mapping } = findHeaderRow(matrix);
    const records = [];

    for (let r = rowIndex + 1; r < matrix.length; r++) {
      const row = Array.isArray(matrix[r]) ? matrix[r] : [];
      const at = i => (typeof i === "number" && i >= 0 ? row[i] : "");

      const statusRaw = at(mapping.status);
      const settledRaw = at(mapping.settled);
      const amount = parseNominal(at(mapping.amount));
      const totalPayment = parseNominal(at(mapping.totalPayment));
      const referenceRaw = at(mapping.referenceId);
      const rrnRaw = at(mapping.rrn);
      const merchantRefRaw = at(mapping.merchantRefId);

      const referenceId = displayText(referenceRaw);
      const merchantRefId = displayText(merchantRefRaw);
      const rrn = ktRrnDisplay(rrnRaw);

      // Baris tanpa identitas transaksi (footer TOTAL / baris kosong) dilewati.
      if (!normalizeText(referenceId) && !normalizeText(merchantRefId) && !normalizeText(rrn)) continue;

      const createdAtRaw = at(mapping.createdAt);
      const paidAtRaw = at(mapping.paidAt);
      const settledAtRaw = at(mapping.settledAt);
      const merchantGroup = displayText(at(mapping.merchantGroup));
      const merchantName = displayText(at(mapping.merchantName));

      const fee = amount - totalPayment;

      records.push({
        status: displayText(statusRaw).toUpperCase() || "(KOSONG)",
        statusNorm: normalizeText(statusRaw),
        settled: displayText(settledRaw).toUpperCase(),
        settledBool: ktParseBool(settledRaw),
        createdAt: displayText(createdAtRaw),
        createdAtMs: ktParseDateTime(createdAtRaw),
        paidAt: displayText(paidAtRaw),
        paidAtMs: ktParseDateTime(paidAtRaw),
        merchantGroup,
        merchantName,
        merchantKey: normalizeText(merchantName),
        rrn,
        amount,
        totalPayment,
        fee,
        feePct: amount > 0 ? round2(fee / amount * 100) : null,
        referenceId,
        refKey: normalizeText(referenceId),
        merchantRefId,
        merchantRefKey: normalizeText(merchantRefId),
        settledAt: displayText(settledAtRaw),
        settledAtMs: ktParseDateTime(settledAtRaw),
        sourceRow: r + 1
      });
    }

    return { records, headerRow: rowIndex + 1, mapping };
  }

  // Coba SEMUA worksheet — export Excel kadang menyimpan data di sheet kedua.
  function recordsFromWorkbook(workbook) {
    if (!workbook.SheetNames.length) throw new Error("File tidak memiliki worksheet.");
    const errors = [];
    for (const sheetName of workbook.SheetNames) {
      const matrix = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1, raw: true, defval: ""
      });
      try {
        return matrixToRecords(matrix);
      } catch (error) {
        errors.push(error.message);
      }
    }
    throw new Error(errors[0] || "Tidak ada worksheet yang dapat dibaca.");
  }

  async function parseFile(file) {
    const name = String(file.name || "").toLowerCase();

    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      if (!window.XLSX) {
        throw new Error("Library pembaca Excel gagal dimuat. Pastikan internet aktif saat membuka halaman.");
      }
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: "array", raw: true, cellDates: false });
      return recordsFromWorkbook(workbook);
    }

    // CSV / TSV / TXT — parser sendiri (quote-aware, deteksi pemisah).
    const text = await file.text();
    return matrixToRecords(splitDelimited(text));
  }

  function parsePastedText(text) {
    if (!String(text || "").trim()) throw new Error("Data tempelan kosong.");
    return matrixToRecords(splitDelimited(text));
  }

  /* ================= ANALISIS (MURNI) ================= */

  function ktFmtDateLabel(ms) {
    const d = new Date(ms);
    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
  }

  function computeResults(records) {
    const successRows = records.filter(r => r.statusNorm === "success");
    const settledRows = successRows.filter(r => r.settledBool === true);

    const sum = (rows, key) => rows.reduce((s, r) => s + (r[key] || 0), 0);

    const totals = {
      count: records.length,
      successCount: successRows.length,
      settledCount: settledRows.length,
      amount: sum(successRows, "amount"),
      payment: sum(successRows, "totalPayment")
    };
    totals.fee = totals.amount - totals.payment;
    totals.feePct = totals.amount > 0 ? round2(totals.fee / totals.amount * 100) : null;

    const merchantLabelOf = r => r.merchantName || r.merchantGroup || "(TANPA MERCHANT)";

    /* --- 1. BELUM SETTLE --- */
    const unsettled = successRows
      .filter(r => r.settledBool !== true)
      .map(r => ({
        createdAt: r.createdAt,
        merchantLabel: merchantLabelOf(r),
        rrn: r.rrn,
        amount: r.amount,
        totalPayment: r.totalPayment,
        referenceId: r.referenceId,
        note: r.settledBool === false ? "Flag Settled FALSE" : "Flag Settled kosong / tidak dikenal",
        _ts: r.createdAtMs,
        _row: r.sourceRow
      }))
      .sort((a, b) => ((a._ts == null ? Infinity : a._ts) - (b._ts == null ? Infinity : b._ts)) || (a._row - b._row))
      .map(({ _ts, _row, ...rest }) => rest);

    /* --- 2. STATUS BERMASALAH --- */
    const failed = records
      .filter(r => r.statusNorm && r.statusNorm !== "success")
      .map(r => ({
        createdAt: r.createdAt,
        status: r.status,
        merchantLabel: merchantLabelOf(r),
        rrn: r.rrn,
        amount: r.amount,
        totalPayment: r.totalPayment,
        referenceId: r.referenceId,
        _ts: r.createdAtMs,
        _row: r.sourceRow
      }))
      .sort((a, b) => ((a._ts == null ? Infinity : a._ts) - (b._ts == null ? Infinity : b._ts)) || (a._row - b._row))
      .map(({ _ts, _row, ...rest }) => rest);

    /* --- 3. DUPLIKAT REFERENCE --- */
    const refCount = new Map();
    const mrefCount = new Map();
    for (const r of records) {
      if (r.refKey) refCount.set(r.refKey, (refCount.get(r.refKey) || 0) + 1);
      if (r.merchantRefKey) mrefCount.set(r.merchantRefKey, (mrefCount.get(r.merchantRefKey) || 0) + 1);
    }
    const duplicates = records
      .filter(r => (r.refKey && refCount.get(r.refKey) > 1) || (r.merchantRefKey && mrefCount.get(r.merchantRefKey) > 1))
      .map(r => {
        const parts = [];
        if (r.refKey && refCount.get(r.refKey) > 1) parts.push("Reference ID muncul " + refCount.get(r.refKey) + "x");
        if (r.merchantRefKey && mrefCount.get(r.merchantRefKey) > 1) parts.push("Merchant Ref ID muncul " + mrefCount.get(r.merchantRefKey) + "x");
        return {
          createdAt: r.createdAt,
          merchantLabel: merchantLabelOf(r),
          amount: r.amount,
          totalPayment: r.totalPayment,
          referenceId: r.referenceId,
          merchantRefId: r.merchantRefId,
          dupNote: parts.join(" + "),
          _ts: r.createdAtMs,
          _row: r.sourceRow
        };
      })
      .sort((a, b) => ((a._ts == null ? Infinity : a._ts) - (b._ts == null ? Infinity : b._ts)) || (a._row - b._row))
      .map(({ _ts, _row, ...rest }) => rest);

    /* --- 4. FEE TIDAK BIASA --- */
    const pctCount = new Map();
    for (const r of successRows) {
      if (r.feePct !== null) pctCount.set(r.feePct, (pctCount.get(r.feePct) || 0) + 1);
    }
    let stdPct = null;
    let stdN = 0;
    pctCount.forEach((n, pct) => {
      if (n > stdN) { stdN = n; stdPct = pct; }
    });
    const feeOdd = stdPct === null ? [] : successRows
      .filter(r => r.feePct !== null && r.feePct !== stdPct)
      .map(r => ({
        createdAt: r.createdAt,
        merchantLabel: merchantLabelOf(r),
        rrn: r.rrn,
        amount: r.amount,
        totalPayment: r.totalPayment,
        fee: r.fee,
        feePctLabel: r.feePct + "%",
        stdPctLabel: stdPct + "%",
        _ts: r.createdAtMs,
        _row: r.sourceRow
      }))
      .sort((a, b) => ((a._ts == null ? Infinity : a._ts) - (b._ts == null ? Infinity : b._ts)) || (a._row - b._row))
      .map(({ _ts, _row, ...rest }) => rest);

    /* --- 5. REKAP MERCHANT --- */
    const merchMap = new Map();
    for (const r of successRows) {
      const key = r.merchantKey || r.merchantGroup.toLowerCase() || "(tanpa merchant)";
      const cur = merchMap.get(key) || { label: merchantLabelOf(r), count: 0, amount: 0, payment: 0, fee: 0 };
      cur.count += 1;
      cur.amount += r.amount;
      cur.payment += r.totalPayment;
      cur.fee += r.fee;
      merchMap.set(key, cur);
    }
    const byMerchant = Array.from(merchMap.values())
      .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label));

    /* --- 6. REKAP TANGGAL SETTLEMENT --- */
    const dateMap = new Map();
    for (const r of successRows) {
      const key = Number.isFinite(r.settledAtMs) ? "d" + ktFmtDateLabel(r.settledAtMs) : "zz-belum";
      const label = Number.isFinite(r.settledAtMs) ? ktFmtDateLabel(r.settledAtMs) : "BELUM SETTLE";
      const cur = dateMap.get(key) || { label, count: 0, amount: 0, payment: 0, fee: 0 };
      cur.count += 1;
      cur.amount += r.amount;
      cur.payment += r.totalPayment;
      cur.fee += r.fee;
      dateMap.set(key, cur);
    }
    const byDate = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(entry => entry[1]);

    return {
      totals,
      feeStd: { pct: stdPct, count: stdN },
      unsettled,
      failed,
      duplicates,
      feeOdd,
      byMerchant,
      byDate
    };
  }

  /* ================= FORMAT TAMPILAN ================= */

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

  function formatPct(p) {
    const n = Number(p);
    if (p === null || p === undefined || !Number.isFinite(n)) return "\u2013";
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n) + "%";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const $ = id => document.getElementById(id);

  function setSourceStatus(message, statusClass) {
    const el = $("statusKt");
    if (el) { el.className = ("source-status " + (statusClass || "")).trim(); el.textContent = message; }
  }

  function setGlobalStatus(message, isError) {
    const el = $("globalStatus");
    if (el) { el.textContent = message; el.style.color = isError ? "#be123c" : ""; }
  }

  /* ================= RENDER ================= */

  function statusPill(status) {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESS") return '<span class="pill pill-success">SUCCESS</span>';
    if (!s || s === "(KOSONG)") return '<span class="pill pill-muted">(kosong)</span>';
    return '<span class="pill pill-fail">' + escapeHtml(s) + "</span>";
  }

  function settledPill(record) {
    if (record.settledBool === true) return '<span class="pill pill-settled">TRUE</span>';
    if (record.settledBool === false) return '<span class="pill pill-fail">FALSE</span>';
    return '<span class="pill pill-muted">' + escapeHtml(record.settled || "(kosong)") + "</span>";
  }

  function renderTable(containerId, headers, rowsHtml, emptyKind) {
    const el = $(containerId);
    if (!el) return;
    if (!rowsHtml || !rowsHtml.length) {
      el.innerHTML = '<div class="' + (emptyKind === "ok" ? "empty-ok" : "empty") + '">' +
        (emptyKind === "ok" ? "Tidak ada temuan \u2014 kondisi aman." : "Tidak ada data.") + "</div>";
      return;
    }
    el.innerHTML =
      "<table><thead><tr>" +
      headers.map(h => '<th' + (h.num ? ' class="num"' : "") + ">" + h.label + "</th>").join("") +
      '</tr></thead><tbody>' + rowsHtml.join("") + "</tbody></table>";
  }

  function renderFindings() {
    const R = state.results;

    renderTable("tableUnsettled",
      [{ label: "NO" }, { label: "CREATED AT" }, { label: "MERCHANT" }, { label: "RRN" },
       { label: "AMOUNT", num: true }, { label: "DITERIMA", num: true }, { label: "REFERENCE ID" }, { label: "KETERANGAN" }],
      R.unsettled.map((r, i) =>
        "<tr><td>" + (i + 1) + "</td><td>" + escapeHtml(r.createdAt) + "</td><td>" + escapeHtml(r.merchantLabel) +
        '</td><td class="mono">' + escapeHtml(r.rrn) + '</td><td class="num">' + formatNumber(r.amount) +
        '</td><td class="num">' + formatNumber(r.totalPayment) + '</td><td><span class="ref-cell" title="' +
        escapeHtml(r.referenceId) + '">' + escapeHtml(r.referenceId) + "</span></td><td>" + escapeHtml(r.note) + "</td></tr>"
      ), "ok");

    renderTable("tableFailed",
      [{ label: "NO" }, { label: "CREATED AT" }, { label: "STATUS" }, { label: "MERCHANT" }, { label: "RRN" },
       { label: "AMOUNT", num: true }, { label: "DITERIMA", num: true }, { label: "REFERENCE ID" }],
      R.failed.map((r, i) =>
        "<tr><td>" + (i + 1) + "</td><td>" + escapeHtml(r.createdAt) + "</td><td>" + statusPill(r.status) +
        "</td><td>" + escapeHtml(r.merchantLabel) + '</td><td class="mono">' + escapeHtml(r.rrn) +
        '</td><td class="num">' + formatNumber(r.amount) + '</td><td class="num">' + formatNumber(r.totalPayment) +
        '</td><td><span class="ref-cell" title="' + escapeHtml(r.referenceId) + '">' + escapeHtml(r.referenceId) + "</span></td></tr>"
      ), "ok");

    renderTable("tableDup",
      [{ label: "NO" }, { label: "CREATED AT" }, { label: "MERCHANT" }, { label: "AMOUNT", num: true },
       { label: "DITERIMA", num: true }, { label: "REFERENCE ID" }, { label: "MERCHANT REF ID" }, { label: "KETERANGAN" }],
      R.duplicates.map((r, i) =>
        "<tr><td>" + (i + 1) + "</td><td>" + escapeHtml(r.createdAt) + "</td><td>" + escapeHtml(r.merchantLabel) +
        '</td><td class="num">' + formatNumber(r.amount) + '</td><td class="num">' + formatNumber(r.totalPayment) +
        '</td><td><span class="ref-cell" title="' + escapeHtml(r.referenceId) + '">' + escapeHtml(r.referenceId) +
        '</span></td><td><span class="ref-cell" title="' + escapeHtml(r.merchantRefId) + '">' + escapeHtml(r.merchantRefId) +
        "</span></td><td>" + escapeHtml(r.dupNote) + "</td></tr>"
      ), "ok");

    renderTable("tableFee",
      [{ label: "NO" }, { label: "CREATED AT" }, { label: "MERCHANT" }, { label: "RRN" },
       { label: "AMOUNT", num: true }, { label: "DITERIMA", num: true }, { label: "FEE", num: true },
       { label: "FEE %", num: true }, { label: "STANDAR %", num: true }],
      R.feeOdd.map((r, i) =>
        "<tr><td>" + (i + 1) + "</td><td>" + escapeHtml(r.createdAt) + "</td><td>" + escapeHtml(r.merchantLabel) +
        '</td><td class="mono">' + escapeHtml(r.rrn) + '</td><td class="num">' + formatNumber(r.amount) +
        '</td><td class="num">' + formatNumber(r.totalPayment) + '</td><td class="num">' + formatNumber(r.fee) +
        '</td><td class="num fee-odd">' + escapeHtml(r.feePctLabel) + '</td><td class="num fee-std">' +
        escapeHtml(r.stdPctLabel) + "</td></tr>"
      ), "ok");
  }

  function renderRekap() {
    const R = state.results;

    renderTable("tableMerchant",
      [{ label: "MERCHANT" }, { label: "TRANSAKSI", num: true }, { label: "TOTAL AMOUNT", num: true },
       { label: "TOTAL DITERIMA", num: true }, { label: "TOTAL FEE", num: true }],
      R.byMerchant.map(r =>
        "<tr><td>" + escapeHtml(r.label) + '</td><td class="num">' + formatInteger(r.count) +
        '</td><td class="num">' + formatNumber(r.amount) + '</td><td class="num">' + formatNumber(r.payment) +
        '</td><td class="num">' + formatNumber(r.fee) + "</td></tr>"
      ));

    renderTable("tableDate",
      [{ label: "TANGGAL SETTLEMENT" }, { label: "TRANSAKSI", num: true }, { label: "TOTAL AMOUNT", num: true },
       { label: "TOTAL DITERIMA", num: true }, { label: "TOTAL FEE", num: true }],
      R.byDate.map(r =>
        "<tr><td>" + escapeHtml(r.label) + '</td><td class="num">' + formatInteger(r.count) +
        '</td><td class="num">' + formatNumber(r.amount) + '</td><td class="num">' + formatNumber(r.payment) +
        '</td><td class="num">' + formatNumber(r.fee) + "</td></tr>"
      ));
  }

  function detailFiltered() {
    const q = state.filter.q.trim().toLowerCase();
    const statusMode = state.filter.status;
    return state.parsed.filter(r => {
      if (statusMode === "success" && r.statusNorm !== "success") return false;
      if (statusMode === "bermasalah" && r.statusNorm === "success") return false;
      if (!q) return true;
      return (
        r.referenceId.toLowerCase().indexOf(q) !== -1 ||
        r.merchantRefId.toLowerCase().indexOf(q) !== -1 ||
        r.rrn.toLowerCase().indexOf(q) !== -1 ||
        r.merchantName.toLowerCase().indexOf(q) !== -1 ||
        r.merchantGroup.toLowerCase().indexOf(q) !== -1 ||
        r.status.toLowerCase().indexOf(q) !== -1
      );
    });
  }

  function renderDetail() {
    const rows = detailFiltered();
    const capped = rows.slice(0, DETAIL_MAX);
    const info = $("detailInfo");
    if (info) {
      info.textContent = "Menampilkan " + formatInteger(capped.length) + " dari " +
        formatInteger(rows.length) + " baris" +
        (rows.length > DETAIL_MAX ? " (dibatasi " + DETAIL_MAX + " baris \u2014 gunakan pencarian)" : "") +
        " \u2022 total data terbaca: " + formatInteger(state.parsed.length) + ".";
    }

    renderTable("tableDetail",
      [{ label: "NO" }, { label: "CREATED AT" }, { label: "STATUS" }, { label: "SETTLED" },
       { label: "MERCHANT" }, { label: "RRN" }, { label: "AMOUNT", num: true },
       { label: "DITERIMA", num: true }, { label: "FEE", num: true }, { label: "SETTLED AT" }, { label: "REFERENCE ID" }],
      capped.map((r, i) =>
        "<tr><td>" + (i + 1) + "</td><td>" + escapeHtml(r.createdAt) + "</td><td>" + statusPill(r.status) +
        "</td><td>" + settledPill(r) + "</td><td>" + escapeHtml(r.merchantName || r.merchantGroup || "-") +
        '</td><td class="mono">' + escapeHtml(r.rrn) + '</td><td class="num">' + formatNumber(r.amount) +
        '</td><td class="num">' + formatNumber(r.totalPayment) + '</td><td class="num">' + formatNumber(r.fee) +
        "</td><td>" + escapeHtml(r.settledAt || "-") + '</td><td><span class="ref-cell" title="' +
        escapeHtml(r.referenceId) + '">' + escapeHtml(r.referenceId) + "</span></td></tr>"
      ));
  }

  function renderResults() {
    const R = state.results;
    const T = R.totals;

    $("statCount").textContent = formatInteger(T.count);
    $("statAmount").textContent = formatNumber(T.amount);
    $("statPayment").textContent = formatNumber(T.payment);
    $("statFee").textContent = formatNumber(T.fee);
    $("statSub").textContent =
      formatInteger(T.successCount) + " SUCCESS \u2022 " + formatInteger(T.settledCount) +
      " settled \u2022 " + formatInteger(R.failed.length) + " bermasalah \u2022 fee tercatat " +
      formatPct(T.feePct) + " dari amount";

    $("countUnsettled").textContent = formatInteger(R.unsettled.length);
    $("countFailed").textContent = formatInteger(R.failed.length);
    $("countDup").textContent = formatInteger(R.duplicates.length);
    $("countFee").textContent = formatInteger(R.feeOdd.length);

    const feeStdEl = $("feeStd");
    if (feeStdEl) {
      feeStdEl.textContent = R.feeStd.pct === null
        ? "Rasio fee standar belum terdeteksi (tidak ada transaksi SUCCESS dengan amount > 0)."
        : "Rasio fee yang menyimpang dari fee standar terdeteksi " + formatPct(R.feeStd.pct) +
          " (dari " + formatInteger(R.feeStd.count) + " transaksi).";
    }

    renderFindings();
    renderRekap();
    renderDetail();

    $("findings").classList.remove("hidden");
    $("rekap").classList.remove("hidden");
    $("detail").classList.remove("hidden");
    $("btnDownloadAll").disabled = false;
  }

  /* ================= EXPORT (COPY / CSV / XLSX) ================= */

  function rawExportRows(key) {
    const meta = resultMeta[key];
    return state.results[key].map(row => {
      const output = {};
      meta.headers.forEach((header, i) => { output[header] = row[meta.fields[i]]; });
      return output;
    });
  }

  function tsvForResult(key) {
    const meta = resultMeta[key];
    const lines = [meta.headers.join("\t")];
    for (const row of state.results[key]) {
      lines.push(meta.fields.map(f => {
        const v = row[f];
        return typeof v === "number" ? String(v) : String(v == null ? "" : v);
      }).join("\t"));
    }
    return lines.join("\n");
  }

  async function copyResult(key, button) {
    const text = tsvForResult(key);
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const temp = document.createElement("textarea");
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      temp.remove();
    }
    const old = button.textContent;
    button.textContent = "TERSALIN";
    setTimeout(() => { button.textContent = old; }, 1200);
  }

  function csvEscape(value) {
    return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  }

  function downloadCsv(key) {
    const meta = resultMeta[key];
    const lines = [meta.headers.map(csvEscape).join(",")];
    for (const row of rawExportRows(key)) {
      lines.push(meta.headers.map(h => csvEscape(row[h])).join(","));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = meta.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function ringkasanRows() {
    const R = state.results;
    const T = R.totals;
    return [
      ["METRIK", "NILAI"],
      ["Total transaksi", T.count],
      ["Status SUCCESS", T.successCount],
      ["Settled TRUE", T.settledCount],
      ["Total amount (SUCCESS)", T.amount],
      ["Total diterima (SUCCESS)", T.payment],
      ["Total fee (SUCCESS)", T.fee],
      ["Fee tercatat (%)", T.feePct == null ? "-" : T.feePct],
      ["Fee standar terdeteksi (%)", R.feeStd.pct == null ? "-" : R.feeStd.pct],
      ["Belum settle", R.unsettled.length],
      ["Status bermasalah", R.failed.length],
      ["Duplikat reference", R.duplicates.length],
      ["Fee tidak biasa", R.feeOdd.length]
    ];
  }

  function downloadAllXlsx() {
    if (!window.XLSX) { alert("Library Excel belum tersedia."); return; }
    if (!state.results) return;

    const workbook = window.XLSX.utils.book_new();

    const ringkasan = window.XLSX.utils.aoa_to_sheet(ringkasanRows());
    ringkasan["!cols"] = [{ wch: 30 }, { wch: 22 }];
    window.XLSX.utils.book_append_sheet(workbook, ringkasan, "RINGKASAN");

    for (const key of Object.keys(resultMeta)) {
      const meta = resultMeta[key];
      const data = rawExportRows(key);
      const worksheet = window.XLSX.utils.json_to_sheet(data, { header: meta.headers });
      worksheet["!cols"] = meta.headers.map(h => ({ wch: Math.max(14, Math.min(52, h.length + 10)) }));
      window.XLSX.utils.book_append_sheet(workbook, worksheet, meta.sheet.substring(0, 31));
    }

    window.XLSX.writeFile(workbook, "HASIL_ANALISIS_KITATRUST.xlsx");
  }

  /* ================= ALUR UTAMA ================= */

  async function processAll() {
    const btn = $("btnProcess");
    const fileEl = $("fileKt");
    const textEl = $("textKt");

    const file = fileEl && fileEl.files && fileEl.files[0];
    const text = textEl ? textEl.value.trim() : "";

    if (!file && !text) {
      setGlobalStatus("Belum ada data \u2014 pilih file atau tempel data Kitatrust dulu.", true);
      return;
    }

    btn.disabled = true;
    $("btnDownloadAll").disabled = true;
    $("findings").classList.add("hidden");
    $("rekap").classList.add("hidden");
    $("detail").classList.add("hidden");
    setGlobalStatus("Membaca dan menghitung data...");

    try {
      const parsed = file ? await parseFile(file) : parsePastedText(text);
      state.parsed = parsed.records;

      if (!state.parsed.length) {
        throw new Error("Tidak ada baris data yang terbaca dari sumber. Pastikan file berisi transaksi di bawah baris judul.");
      }

      const nominalTotal = state.parsed.reduce((s, r) => s + r.amount, 0);
      const sourceName = file ? file.name : "data tempelan";
      setSourceStatus(
        sourceName + ": " + formatInteger(state.parsed.length) + " baris, total amount " +
        formatNumber(nominalTotal) + ". Header di baris " + parsed.headerRow + ".",
        "ok"
      );

      state.results = computeResults(state.parsed);
      renderResults();

      const temuan = state.results.unsettled.length + state.results.failed.length +
        state.results.duplicates.length + state.results.feeOdd.length;
      setGlobalStatus("Selesai. " + formatInteger(state.parsed.length) + " transaksi dianalisis, " +
        formatInteger(temuan) + " baris temuan.");
    } catch (error) {
      console.error(error);
      setSourceStatus(error.message || "Gagal membaca data.", "err");
      setGlobalStatus(error.message || "Terjadi kesalahan saat memproses data.", true);
    } finally {
      btn.disabled = false;
    }
  }

  function resetAll() {
    state.file = null;
    state.parsed = [];
    state.results = null;
    state.filter = { q: "", status: "all" };

    const fileEl = $("fileKt");
    const textEl = $("textKt");
    if (fileEl) fileEl.value = "";
    if (textEl) textEl.value = "";
    const search = $("detailSearch");
    const statusSel = $("detailStatus");
    if (search) search.value = "";
    if (statusSel) statusSel.value = "all";

    setSourceStatus("Belum ada data.", "");
    setGlobalStatus("Masukkan data Kitatrust untuk memulai.");
    $("findings").classList.add("hidden");
    $("rekap").classList.add("hidden");
    $("detail").classList.add("hidden");
    $("btnDownloadAll").disabled = true;
  }

  /* ================= WIRING (HANYA DI BROWSER) ================= */

  function onFilePicked(file) {
    const textEl = $("textKt");
    if (textEl) textEl.value = "";
    state.file = file || null;
    setSourceStatus(file ? "File dipilih: " + file.name : "Belum ada data.", "");
  }

  function initDom() {
    const fileEl = $("fileKt");
    const textEl = $("textKt");
    const dropZone = $("dropZone");
    if (!fileEl || !$("btnProcess")) return;

    fileEl.addEventListener("change", () => {
      const f = fileEl.files && fileEl.files[0];
      if (f) onFilePicked(f);
    });

    if (dropZone) {
      ["dragenter", "dragover"].forEach(ev =>
        dropZone.addEventListener(ev, e => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add("dragover");
        })
      );
      ["dragleave", "drop"].forEach(ev =>
        dropZone.addEventListener(ev, e => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove("dragover");
        })
      );
      dropZone.addEventListener("drop", e => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length) {
          try { fileEl.files = dt.files; } catch (err) { /* beberapa browser lama */ }
          onFilePicked(dt.files[0]);
        }
      });
    }

    if (textEl) {
      textEl.addEventListener("input", () => {
        if (textEl.value.trim()) {
          fileEl.value = "";
          state.file = null;
          setSourceStatus("Menggunakan data tempelan.", "");
        }
      });
    }

    $("btnProcess").addEventListener("click", processAll);
    $("btnReset").addEventListener("click", resetAll);
    $("btnDownloadAll").addEventListener("click", downloadAllXlsx);

    const search = $("detailSearch");
    if (search) search.addEventListener("input", () => {
      state.filter.q = search.value;
      renderDetail();
    });

    const statusSel = $("detailStatus");
    if (statusSel) statusSel.addEventListener("change", () => {
      state.filter.status = statusSel.value;
      renderDetail();
    });

    document.addEventListener("click", event => {
      const target = event.target;
      if (!target || !target.dataset) return;
      if (target.dataset.copy) copyResult(target.dataset.copy, target);
      if (target.dataset.csv) downloadCsv(target.dataset.csv);
    });
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initDom);
    } else {
      initDom();
    }
  }

  /* Helper murni diekspos untuk pengujian otomatis & debugging. */
  if (typeof window !== "undefined") {
    window.KitatrustAnalyzer = {
      version: KTA_VERSION,
      detailMax: DETAIL_MAX,
      normalizeHeader,
      normalizeText,
      displayText,
      parseNominal,
      ktParseDateTime,
      ktRrnDisplay,
      ktParseBool,
      detectDelimiter,
      splitDelimited,
      matrixToRecords,
      computeResults,
      resultMeta
    };
  }
})();
