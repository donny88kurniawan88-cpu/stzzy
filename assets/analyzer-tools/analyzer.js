document.getElementById('userEmail').textContent = authToken ? authToken + '@aura.os' : 'user';

    let p2mData = [], zonaData = [], reportData = [], filteredOutData = [];

    // 1. SMART LINE SPLITTER
    function splitSmart(line, delimiter) {
      let result = [], current = '', inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        let char = line[i], next = line[i+1] || '';
        if (char === '"') { if (inQuotes && next === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; } }
        else if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ''; }
        else { current += char; }
      }
      result.push(current.trim());
      return result;
    }

    // 2. PARSER NOMINAL
    const MAX_DAILY_DEPOSIT = 1000000000; 

    function parseNumP2M(val) {
      if (!val) return 0;
      let s = String(val).trim();
      let parts = s.split(/[.,]/);
      s = parts[0]; 
      let cleaned = s.replace(/[^\d-]/g, '');
      let num = parseInt(cleaned, 10);
      if (isNaN(num)) return 0;
      if (num > MAX_DAILY_DEPOSIT) return 0; 
      return num;
    }

    function parseNumZona(val) {
      if (!val) return 0;
      let s = String(val).trim().replace(/Rp\.?/gi, '').replace(/[\(\)]/g, '').replace(/\s/g, '').trim();
      let isNeg = s.startsWith('-');
      if (isNeg) s = s.substring(1).trim();
      
      let lastComma = s.lastIndexOf(',');
      let lastDot = s.lastIndexOf('.');
      if (lastComma > -1 && lastDot > -1) {
        if (lastComma > lastDot) { s = s.replace(/\./g, '').replace(',', '.'); } else { s = s.replace(/,/g, ''); }
      } else if (lastComma > -1) {
        let afterComma = s.substring(lastComma + 1);
        if (afterComma.length <= 2 && afterComma !== '00') s = s.replace(',', '.');
        else s = s.replace(/,/g, ''); 
      } else if (lastDot > -1) {
        let afterDot = s.substring(lastDot + 1);
        if (afterDot.length <= 2 && afterDot !== '00') { /* Titik desimal */ }
        else s = s.replace(/\./g, ''); 
      }
      
      let num = parseFloat(s);
      if (isNaN(num)) return 0;
      num = Math.round(num);
      if (isNeg) num = -num;
      if (Math.abs(num) > MAX_DAILY_DEPOSIT) return 0; 
      return num;
    }

    function cleanId(val) { if (!val) return ''; return String(val).replace(/['"]/g, '').trim(); }

    function formatRp(n) { return new Intl.NumberFormat('id-ID').format(n || 0); }

    // 3. UI HELPERS
    function showToast(msg, type) {
      const t = document.getElementById('toast');
      t.className = 'toast show ' + type;
      t.textContent = msg;
      setTimeout(() => t.classList.remove('show'), 3500);
    }

    function showLoading(show) {
      document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
      if (show) {
        let p = 0;
        const iv = setInterval(() => {
          p = Math.min(p + Math.random() * 25, 90);
          document.getElementById('loadingProgress').style.width = p + '%';
          if (p >= 90) clearInterval(iv);
        }, 200);
      } else {
        document.getElementById('loadingProgress').style.width = '100%';
      }
    }

    // 4. FILE UPLOAD HANDLER — SUPPORT SEMUA FORMAT
    const EXCEL_EXT = ['xlsx', 'xls', 'xlsm', 'xlsb'];

    function getExt(name) {
      return (name.split('.').pop() || '').toLowerCase();
    }

    function handleFileUpload(inputElement, type) {
      const file = inputElement.files[0];
      if (!file) return;
      const ext = getExt(file.name);

      // ROUTE 1: FILE EXCEL → parse via SheetJS
      if (EXCEL_EXT.includes(ext)) {
        if (typeof XLSX === 'undefined') return showToast('Library Excel belum termuat', 'error');
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const wb = XLSX.read(e.target.result, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
            const text = rows.map(r => r.join('\t')).join('\n').trim();
            finishUpload(type, text, file, 'Excel');
          } catch (err) {
            showToast('Gagal membaca Excel: ' + err.message, 'error');
          }
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      // ROUTE 2: JSON → convert ke tab-delimited
      if (ext === 'json') {
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const arr = JSON.parse(e.target.result);
            if (!Array.isArray(arr) || !arr.length) throw new Error('JSON bukan array data');
            const headers = Object.keys(arr[0]);
            const lines = [headers.join('\t')];
            arr.forEach(o => lines.push(headers.map(h => o[h] ?? '').join('\t')));
            finishUpload(type, lines.join('\n'), file, 'JSON');
          } catch (err) {
            showToast('Gagal membaca JSON: ' + err.message, 'error');
          }
        };
        reader.readAsText(file);
        return;
      }

      // ROUTE 3: HTML table
      if (ext === 'html' || ext === 'htm') {
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const doc = new DOMParser().parseFromString(e.target.result, 'text/html');
            const table = doc.querySelector('table');
            if (!table) throw new Error('Tidak ada <table> di file HTML');
            const lines = [...table.querySelectorAll('tr')].map(tr =>
              [...tr.querySelectorAll('th,td')].map(td => td.textContent.trim()).join('\t')
            );
            finishUpload(type, lines.join('\n'), file, 'HTML');
          } catch (err) {
            showToast('Gagal membaca HTML: ' + err.message, 'error');
          }
        };
        reader.readAsText(file);
        return;
      }

      // ROUTE 4 (DEFAULT): txt / csv / tsv / dat / prn / xml / lainnya
      const reader = new FileReader();
      reader.onload = function(e) {
        const text = e.target.result.replace(/^\uFEFF/, '').trim();
        finishUpload(type, text, file, ext.toUpperCase() || 'TXT');
      };
      reader.readAsText(file);
    }

    // Pemrosesan akhir setelah file jadi text
    function finishUpload(type, text, file, srcLabel) {
      if (type === 'p2m') { p2mData = parseP2M(text); document.getElementById('p2mCount').textContent = p2mData.length + ' lines'; }
      else if (type === 'zona') { zonaData = parseZonamain(text); document.getElementById('zonaCount').textContent = zonaData.length + ' lines'; }
      else if (type === 'report') { reportData = parseReport(text); document.getElementById('reportCount').textContent = reportData.length + ' lines'; }
      showFileInfo(type, file);
      const count = type === 'p2m' ? p2mData.length : type === 'zona' ? zonaData.length : reportData.length;
      showToast(file.name + ' [' + srcLabel + '] loaded — ' + count + ' lines', count > 0 ? 'success' : 'warning');
      if (count === 0) showToast('File terbaca tapi 0 baris — cek format kolom/header', 'warning');
    }

    function showFileInfo(type, file) {
      document.getElementById(type + 'FileInfo').style.display = 'block';
      document.getElementById(type + 'FileName').textContent = file.name;
      document.getElementById(type + 'FileDate').textContent = new Date().toLocaleDateString('id-ID');
      document.getElementById(type + 'FileSize').textContent = (file.size / 1024).toFixed(2) + ' KB';
    }

    // 5. FILE PARSERS
    function parseP2M(text) {
      const lines = text.split('\n');
      let data = [], headers = [], startIdx = 0, delimiter = ',';
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        let line = lines[i].trim(); if(!line) continue;
        let tabC = (line.match(/\t/g) || []).length, comC = (line.match(/,/g) || []).length, pipC = (line.match(/\|/g) || []).length;
        delimiter = comC >= tabC && comC >= pipC ? ',' : (tabC >= pipC ? '\t' : '|');
        let cols = splitSmart(line, delimiter), low = cols.map(c => c.toLowerCase().replace(/\uFEFF/g, '').trim());
        if (low.includes('order id') || low.includes('merchant name')) { headers = low; startIdx = i + 1; break; }
      }
      for (let i = startIdx; i < lines.length; i++) {
        let line = lines[i].trim(); if(!line) continue;
        let cols = splitSmart(line, delimiter);
        let r = { orderId:'', nominal:0, fee:0, net:0, userId:'', date:'', uuid:'' };
        for(let j=0; j<headers.length; j++) {
          let h=headers[j], v=cols[j]||'';
          if(h.includes('order id')) r.orderId=cleanId(v);
          else if(h.includes('amount') && !h.includes('fee')) r.nominal=parseNumP2M(v);
          else if(h.includes('fee') && !h.includes('by')) r.fee=parseNumP2M(v);
          else if(h.includes('total') || h.includes('net')) r.net=parseNumP2M(v);
          else if(h.includes('paid at')) r.date=v;
          else if(h.includes('rrn')) r.uuid=cleanId(v);
          else if(h.includes('memo') || h.includes('checked by')) r.userId = v.includes('||') ? v.split('||')[0].trim() : v.trim();
        }
        if(r.orderId || r.nominal>0) data.push(r);
      }
      return data;
    }

    function parseZonamain(text) {
      const lines = text.split('\n');
      let data = [], headers = [], startIdx = 0, delimiter = '|';
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        let line = lines[i].trim(); if(!line) continue;
        let tabC = (line.match(/\t/g) || []).length, comC = (line.match(/,/g) || []).length, pipC = (line.match(/\|/g) || []).length;
        delimiter = pipC >= tabC && pipC >= comC ? '|' : (tabC >= comC ? '\t' : ',');
        let cols = splitSmart(line, delimiter).map(c => c.toLowerCase().replace(/\uFEFF/g, '').trim());
        if (cols.includes('tanggal') || cols.includes('order id')) { headers = cols; startIdx = i + 1; break; }
      }
      if(headers.length === 0) return [];
      for (let i = startIdx; i < lines.length; i++) {
        let line = lines[i].trim(); 
        if(!line || line.startsWith('*') || line.toLowerCase().startsWith('head') || line.toLowerCase().includes('jumlah') || line.toLowerCase().includes('ppn')) continue; 
        let cols = splitSmart(line, delimiter);
        let r = { orderId:'', nominal:0, fee:0, net:0, userId:'', date:'', uuid:'' };
        for(let j=0; j<headers.length; j++) {
          let h=headers[j], v=cols[j]||'';
          if(h.includes('tanggal') || h.includes('date')) r.date=v;
          else if(h.includes('order id')) r.orderId=cleanId(v);
          else if(h.includes('rrn')) r.uuid=cleanId(v);
          else if(h.includes('user id') || h === 'user') r.userId=cleanId(v);
          else if(h.includes('jumlah') || (h.includes('amount') && !h.includes('fee'))) r.nominal=parseNumZona(v);
          else if(h.includes('ppn') || h.includes('fee')) r.fee=parseNumZona(v);
          else if(h.includes('total') || h.includes('net')) r.net=parseNumZona(v);
        }
        if(r.orderId || r.nominal>0) data.push(r);
      }
      return data;
    }

    function parseReport(text) {
      const lines = text.split('\n');
      let data = [], headers = [], startIdx = 0, delimiter = '|';
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        let line = lines[i].trim(); if(!line) continue;
        let tabC = (line.match(/\t/g) || []).length, comC = (line.match(/,/g) || []).length, pipC = (line.match(/\|/g) || []).length;
        delimiter = pipC >= tabC && pipC >= comC ? '|' : (tabC >= comC ? '\t' : ',');
        let cols = splitSmart(line, delimiter).map(c => c.toLowerCase().replace(/\uFEFF/g, '').trim());
        if (cols.includes('date') && (cols.includes('info') || cols.includes('coin'))) { headers = cols; startIdx = i + 1; break; }
      }
      
      let coinIndex = -1, userIndex = -1, dateIndex = -1;
      for(let j=0; j<headers.length; j++) {
        let h = headers[j];
        if (h === 'coin') coinIndex = j; 
        else if (h === 'to' || h.includes('user1')) userIndex = j;
        else if (h.includes('date')) dateIndex = j;
      }

      if (coinIndex === -1 && headers.length >= 5) {
        dateIndex = 0; userIndex = 2; coinIndex = 4;
      }

      for (let i = startIdx; i < lines.length; i++) {
        let line = lines[i].trim(); if(!line) continue;
        let cols = splitSmart(line, delimiter);
        let r = { userId:'', nominal:0, date:'', user1:'' };
        
        if (dateIndex !== -1 && cols[dateIndex]) r.date = cols[dateIndex];
        if (userIndex !== -1 && cols[userIndex]) r.user1 = cleanId(cols[userIndex]);
        if (coinIndex !== -1 && cols[coinIndex]) r.nominal = parseNumZona(cols[coinIndex]); 
        
        r.userId = r.user1;
        if(r.userId || r.nominal!==0) data.push(r);
      }
      return data;
    }

    // 6. COPY DATA FUNCTION
    function copyData(elementId) {
      const el = document.getElementById(elementId);
      if (!el || !el.value.trim()) return showToast('No data to copy', 'warning');
      el.select();
      el.setSelectionRange(0, 999999);
      navigator.clipboard ? navigator.clipboard.writeText(el.value).then(() => showToast('Data copied to clipboard!', 'success')).catch(() => fallbackCopy(el)) : fallbackCopy(el);
    }
    function fallbackCopy(el) { document.execCommand('copy'); showToast('Data copied to clipboard!', 'success'); }

    // 7. FILTER & ANALYZE LOGIC
    function toggleFilter() {
      const isOn = document.getElementById('filterToggle').checked;
      document.getElementById('filterStatus').textContent = isOn ? 'Filter: ON' : 'Filter: OFF';
      document.getElementById('filterStatus').style.background = isOn ? 'rgba(16, 185, 129, 0.15)' : 'var(--accent-warning-light)';
      document.getElementById('filterStatus').style.color = isOn ? 'var(--accent-success)' : 'var(--accent-warning)';
    }

    function applyFilters(data) {
      const isFilterOn = document.getElementById('filterToggle').checked;
      if (!isFilterOn) return { filtered: data, excluded: [] };
      const excludePhones = document.getElementById('filterPhoneNumbers').checked;
      const excludeMonths = document.getElementById('filterMonthPattern').checked;
      const customExcl = document.getElementById('customExclusions').value.trim().split('\n').map(e=>e.trim().toLowerCase()).filter(e=>e);
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      const filtered = [], excluded = [];
      data.forEach(item => {
        let exc = false; const id = (item.userId || '').toLowerCase();
        if (excludePhones && /^0\d+/.test(id)) exc = true;
        if (excludeMonths && months.some(m => id.includes(m))) exc = true;
        if (customExcl.includes(id)) exc = true;
        exc ? excluded.push(item) : filtered.push(item);
      });
      return { filtered, excluded };
    }

    function testFilter() {
      if (p2mData.length === 0) return showToast('Upload P2M first', 'warning');
      const res = applyFilters(p2mData);
      document.getElementById('filterPreview').style.display = 'block';
      document.getElementById('previewTotal').textContent = p2mData.length;
      document.getElementById('previewFiltered').textContent = res.excluded.length;
      document.getElementById('previewRemaining').textContent = res.filtered.length;
    }

    function clearFilter() {
      document.getElementById('filterPhoneNumbers').checked = true;
      document.getElementById('filterMonthPattern').checked = true;
      document.getElementById('customExclusions').value = '';
      document.getElementById('filterToggle').checked = false;
      toggleFilter(); document.getElementById('filterPreview').style.display = 'none';
    }

    function clearAllFiles() {
      p2mData = []; zonaData = []; reportData = []; filteredOutData = [];
      document.getElementById('p2mCount').textContent = '0 lines';
      document.getElementById('zonaCount').textContent = '0 lines';
      document.getElementById('reportCount').textContent = '0 lines';
      document.getElementById('p2mFileInfo').style.display = 'none';
      document.getElementById('zonaFileInfo').style.display = 'none';
      document.getElementById('reportFileInfo').style.display = 'none';
      document.getElementById('analysisSection').style.display = 'none';
      document.getElementById('resultsSection').style.display = 'none';
      showToast('All files cleared!', 'success');
    }

    // 8. MAIN ANALYZE FUNCTION
    function processUploadedFiles() {
      if (p2mData.length === 0 && zonaData.length === 0 && reportData.length === 0) return showToast('Upload files first', 'error');
      showLoading(true);
      setTimeout(() => {
        try {
          const p2mRes = applyFilters(p2mData);
          const activeP2M = p2mRes.filtered; filteredOutData = p2mRes.excluded;

          let totalP2M = p2mData.reduce((s,i) => s+i.nominal, 0);
          let totalZona = zonaData.reduce((s,i) => s+i.nominal, 0);
          let totalReport = reportData.reduce((s,i) => s+i.nominal, 0);

          document.getElementById('overallP2M').textContent = formatRp(totalP2M);
          document.getElementById('overallReport').textContent = formatRp(totalReport);
          document.getElementById('overallDifference').textContent = formatRp(totalP2M - totalReport);

          const p2mIds = new Set(activeP2M.filter(d=>d.orderId).map(d => d.orderId.toLowerCase()));
          const zonaIds = new Set(zonaData.filter(d=>d.orderId).map(d => d.orderId.toLowerCase()));
          
          let p2mNotZona = activeP2M.filter(d => d.orderId && !zonaIds.has(d.orderId.toLowerCase()));
          let zonaNotP2M = zonaData.filter(d => d.orderId && !p2mIds.has(d.orderId.toLowerCase()));
          let nomP2MNotZona = p2mNotZona.reduce((s,i) => s+i.nominal, 0);
          let nomZonaNotP2M = zonaNotP2M.reduce((s,i) => s+i.nominal, 0);

          document.getElementById('p2mTotal').textContent = formatRp(totalP2M);
          document.getElementById('reportTotal').textContent = formatRp(totalReport);
          document.getElementById('calculatedDiff').textContent = formatRp(totalP2M - totalReport);
          document.getElementById('diffP2MReportValue').textContent = formatRp(totalP2M - totalReport);

          document.getElementById('p2mMissingCount').textContent = p2mNotZona.length;
          document.getElementById('p2mMissingNominal').textContent = '+' + formatRp(nomP2MNotZona);
          document.getElementById('p2mMissingValue').textContent = '+' + formatRp(nomP2MNotZona);

          document.getElementById('zonaMissingCount').textContent = zonaNotP2M.length;
          document.getElementById('zonaMissingNominal').textContent = '-' + formatRp(nomZonaNotP2M);
          document.getElementById('zonaMissingValue').textContent = '-' + formatRp(nomZonaNotP2M);

          let actualDiff = nomP2MNotZona - nomZonaNotP2M;
          document.getElementById('expectedDiff').textContent = formatRp(totalP2M - totalZona);
          document.getElementById('actualDiff').textContent = formatRp(actualDiff);
          document.getElementById('balanceStatus').textContent = actualDiff === 0 ? 'BALANCED' : 'IMBALANCE';
          document.getElementById('balanceStatus').style.color = actualDiff === 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
          document.getElementById('balanceResult').textContent = actualDiff === 0 ? 'Balanced ✓' : 'Imbalance ✗';
          document.getElementById('balanceResult').style.color = actualDiff === 0 ? 'var(--accent-success)' : 'var(--accent-danger)';

          document.getElementById('p2mNotZona').value = p2mNotZona.map(d => `${d.date || '-'}\t${d.orderId || '-'}\t${d.userId || '-'}\t${formatRp(d.nominal)}`).join('\n');
          document.getElementById('p2mNotZonaBadge').textContent = p2mNotZona.length;
          document.getElementById('p2mNotZonaTotal').textContent = '+' + formatRp(nomP2MNotZona);

          document.getElementById('zonaNotP2M').value = zonaNotP2M.map(d => `${d.date || '-'}\t${d.orderId || '-'}\t${d.userId || '-'}\t${formatRp(d.nominal)}`).join('\n');
          document.getElementById('zonaNotP2MBadge').textContent = zonaNotP2M.length;
          document.getElementById('zonaNotP2MTotal').textContent = '-' + formatRp(nomZonaNotP2M);

          // USER DIFF (ZONAMAIN X REPORT)
          const zonaUserSums = new Map();
          zonaData.forEach(item => {
            const id = (item.userId || '').toLowerCase().trim();
            if (id) zonaUserSums.set(id, (zonaUserSums.get(id) || 0) + item.nominal);
          });

          const reportUserSums = new Map();
          reportData.forEach(item => {
            const id = (item.userId || '').toLowerCase().trim();
            if (id) reportUserSums.set(id, (reportUserSums.get(id) || 0) + item.nominal);
          });

          const allUserIdsZR = new Set([...zonaUserSums.keys(), ...reportUserSums.keys()]);
          let diffZonaReportLines = [], nomDiffZonaReport = 0, countZonaReportDiff = 0;
          allUserIdsZR.forEach(id => {
            const z = zonaUserSums.get(id) || 0;
            const r = reportUserSums.get(id) || 0;
            if (z !== r) {
              diffZonaReportLines.push(`${id}\t${formatRp(z)}\t${formatRp(r)}\t${formatRp(z - r)}`);
              nomDiffZonaReport += (z - r); countZonaReportDiff++;
            }
          });
          document.getElementById('diffZonaReport').value = diffZonaReportLines.join('\n');
          document.getElementById('diffZonaReportBadge').textContent = countZonaReportDiff;
          document.getElementById('diffZonaReportTotal').textContent = formatRp(nomDiffZonaReport);

          // USER DIFF (P2M X REPORT)
          const p2mUserSums = new Map();
          activeP2M.forEach(item => {
            const id = (item.userId || '').toLowerCase().trim();
            if (id) p2mUserSums.set(id, (p2mUserSums.get(id) || 0) + item.nominal);
          });

          const allUserIdsPR = new Set([...p2mUserSums.keys(), ...reportUserSums.keys()]);
          let diffP2MReportLines = [], nomDiffP2MReport = 0, countP2MReportDiff = 0;
          allUserIdsPR.forEach(id => {
            const p = p2mUserSums.get(id) || 0;
            const r = reportUserSums.get(id) || 0;
            if (p !== r) {
              diffP2MReportLines.push(`${id}\t${formatRp(p)}\t${formatRp(r)}\t${formatRp(p - r)}`);
              nomDiffP2MReport += (p - r); countP2MReportDiff++;
            }
          });
          document.getElementById('diffP2MReport').value = diffP2MReportLines.join('\n');
          document.getElementById('diffP2MReportBadge').textContent = countP2MReportDiff;
          document.getElementById('diffP2MReportTotal').textContent = formatRp(totalP2M - totalReport);

          // FILTERED DATA
          if (filteredOutData.length > 0) {
            document.getElementById('filteredData').value = filteredOutData.map(d => `${d.date || '-'}\t${d.orderId || '-'}\t${d.userId || '-'}\t${formatRp(d.nominal)}`).join('\n');
            document.getElementById('filteredBadge').textContent = filteredOutData.length;
            document.getElementById('filteredTotal').textContent = '-' + formatRp(filteredOutData.reduce((s,i) => s+i.nominal, 0));
            document.getElementById('filteredDataCard').style.display = 'flex';
          } else {
            document.getElementById('filteredDataCard').style.display = 'none';
          }

          document.getElementById('analysisSection').style.display = 'block';
          document.getElementById('resultsSection').style.display = 'block';
          showLoading(false);
          showToast('Analysis complete!', 'success');
        } catch (err) {
          showLoading(false);
          showToast('Error: ' + err.message, 'error');
        }
      }, 400);
    }

    // 9. EXPORT MODULE — SEMUA FORMAT FILE
    const EXPORT_FORMATS = [
      { key: 'xlsx', label: 'Excel (.xlsx)',  icon: 'fa-file-excel' },
      { key: 'csv',  label: 'CSV (.csv)',     icon: 'fa-file-csv' },
      { key: 'tsv',  label: 'TSV (.tsv)',     icon: 'fa-table-cells' },
      { key: 'json', label: 'JSON (.json)',   icon: 'fa-code' },
      { key: 'xml',  label: 'XML (.xml)',     icon: 'fa-file-code' },
      { key: 'html', label: 'HTML (.html)',   icon: 'fa-html5' },
      { key: 'txt',  label: 'Text (.txt)',    icon: 'fa-file-lines' },
      { key: 'pdf',  label: 'PDF (.pdf)',     icon: 'fa-file-pdf' }
    ];

    const EXPORT_HEADERS = {
      p2mNotZona:      ['Date', 'Order ID', 'User ID', 'Nominal'],
      zonaNotP2M:      ['Date', 'Order ID', 'User ID', 'Nominal'],
      diffZonaReport:  ['User ID', 'Zona Total', 'Report Total', 'Difference'],
      diffP2MReport:   ['User ID', 'P2M Total', 'Report Total', 'Difference'],
      filteredData:    ['Date', 'Order ID', 'User ID', 'Nominal']
    };

    const exportTitles = {};

    function stamp() {
      const d = new Date(), p = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
    }

    function safeName(t) {
      return String(t).replace(/[❌✗✓\/\\?%*:|"<>\x00-\x1f]/g, '').replace(/\s+/g, '_');
    }

    function getExportRows(elementId) {
      const el = document.getElementById(elementId);
      const raw = (el ? el.value : '').trim();
      if (!raw) return null;
      return raw.split('\n').map(line => line.split('\t').map(c => c.trim()));
    }

    function headersFor(id, firstRow) {
      const h = EXPORT_HEADERS[id];
      return (h && h.length === firstRow.length) ? h : firstRow.map((_, i) => 'Column ' + (i + 1));
    }

    function toNumber(cell) {
      const s = String(cell);
      if (!/\d/.test(s)) return cell;
      const n = parseInt(s.replace(/[^\d-]/g, ''), 10);
      return isNaN(n) ? cell : n;
    }

    function downloadFile(content, filename, mime) {
      const blob = new Blob(['\uFEFF' + content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
    }

    function fmtDelim(rows, headers, delim) {
      const esc = v => { v = String(v); return (delim === ',' && /[",\n]/.test(v)) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      return [headers, ...rows].map(r => r.map(esc).join(delim)).join('\n');
    }

    function fmtJSON(rows, headers) {
      return JSON.stringify(rows.map(r => {
        const o = {};
        headers.forEach((h, i) => o[h] = (i === headers.length - 1) ? toNumber(r[i]) : r[i]);
        return o;
      }), null, 2);
    }

    function fmtXML(rows, headers) {
      const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const tg = h => h.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const items = rows.map(r => '  <row>\n' + headers.map((h, i) => `    <${tg(h)}>${esc(r[i])}</${tg(h)}>`).join('\n') + '\n  </row>').join('\n');
      return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${items}\n</data>`;
    }

    function fmtHTML(rows, headers, title) {
      const th = headers.map(h => `<th>${h}</th>`).join('');
      const tr = rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('');
      return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:'Inter',Arial;background:#0a0a0f;color:#f1f5f9;padding:40px}h1{color:#3b82f6;font-family:'JetBrains Mono',monospace}table{border-collapse:collapse;width:100%;margin-top:20px}th{background:#1a1a24;color:#3b82f6;padding:10px;text-align:left;border-bottom:2px solid #6366f1}td{padding:8px 10px;border-bottom:1px solid #1a1a24}tr:hover{background:#1a1a24}</style></head><body><h1>AURA.OS — ${title}</h1><p>Generated: ${new Date().toLocaleString('id-ID')}</p><table><tr>${th}</tr>${tr}</table></body></html>`;
    }

    function buildSheetAOA(elementId) {
      const rows = getExportRows(elementId);
      if (!rows) return null;
      const headers = headersFor(elementId, rows[0]);
      const body = rows.map(r => r.map((c, i) => (i === r.length - 1) ? toNumber(c) : c));
      return [headers, ...body];
    }

    function exportXLSX(elementId, title) {
      if (typeof XLSX === 'undefined') return showToast('Library Excel gagal dimuat — coba CSV', 'error');
      const aoa = buildSheetAOA(elementId);
      if (!aoa) return showToast('No data to export', 'warning');
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = aoa[0].map(() => ({ wch: 20 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, `AURA_${safeName(title)}_${stamp()}.xlsx`);
      showToast('Excel berhasil diexport!', 'success');
    }

    function exportPDF(elementId, title) {
      if (!window.jspdf) return showToast('Library PDF gagal dimuat', 'error');
      const rows = getExportRows(elementId);
      if (!rows) return showToast('No data to export', 'warning');
      const headers = headersFor(elementId, rows[0]);
      const body = rows.map(r => r.map((c, i) => (i === r.length - 1) ? toNumber(c) : c));
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      doc.setFontSize(16); doc.setTextColor(59, 102, 241);
      doc.text('AURA.OS — ' + title, 40, 40);
      doc.setFontSize(9); doc.setTextColor(130);
      doc.text('Generated: ' + new Date().toLocaleString('id-ID'), 40, 58);
      doc.autoTable({
        head: [headers], body, startY: 75,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [59, 102, 241], textColor: 255 },
        alternateRowStyles: { fillColor: [241, 243, 250] }
      });
      doc.save(`AURA_${safeName(title)}_${stamp()}.pdf`);
      showToast('PDF berhasil diexport!', 'success');
    }

    function exportData(elementId, format) {
      const title = exportTitles[elementId] || elementId;
      const rows = getExportRows(elementId);
      if (!rows) return showToast('No data to export', 'warning');
      const headers = headersFor(elementId, rows[0]);
      const base = `AURA_${safeName(title)}_${stamp()}`;

      switch (format) {
        case 'xlsx': exportXLSX(elementId, title); break;
        case 'pdf':  exportPDF(elementId, title); break;
        case 'csv':  downloadFile(fmtDelim(rows, headers, ','),  base + '.csv',  'text/csv;charset=utf-8'); showToast('CSV exported!', 'success'); break;
        case 'tsv':  downloadFile(fmtDelim(rows, headers, '\t'), base + '.tsv', 'text/tab-separated-values;charset=utf-8'); showToast('TSV exported!', 'success'); break;
        case 'txt':  downloadFile([headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n'), base + '.txt', 'text/plain;charset=utf-8'); showToast('TXT exported!', 'success'); break;
        case 'json': downloadFile(fmtJSON(rows, headers), base + '.json', 'application/json'); showToast('JSON exported!', 'success'); break;
        case 'xml':  downloadFile(fmtXML(rows, headers),  base + '.xml',  'application/xml');  showToast('XML exported!', 'success'); break;
        case 'html': downloadFile(fmtHTML(rows, headers, title), base + '.html', 'text/html;charset=utf-8'); showToast('HTML exported!', 'success'); break;
      }
    }

    function exportAllXLSX() {
      if (typeof XLSX === 'undefined') return showToast('Library Excel gagal dimuat', 'error');
      const cards = [...document.querySelectorAll('.result-card')].filter(c => {
        if (c.id === 'filteredDataCard' && c.style.display === 'none') return false;
        const ta = c.querySelector('textarea.result-field');
        return ta && ta.value.trim();
      });
      if (!cards.length) return showToast('Belum ada hasil — jalankan Analyze dulu', 'warning');

      const wb = XLSX.utils.book_new();
      const summary = [
        ['AURA.OS — Data Comparison Analyzer'],
        ['Generated', new Date().toLocaleString('id-ID')],
        [],
        ['Metric', 'Value'],
        ['Total P2M', document.getElementById('overallP2M').textContent],
        ['Total Report', document.getElementById('overallReport').textContent],
        ['Overall Difference', document.getElementById('overallDifference').textContent]
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

      cards.forEach(c => {
        const id = c.querySelector('textarea.result-field').id;
        const aoa = buildSheetAOA(id);
        if (!aoa) return;
        const name = (exportTitles[id] || id).replace(/[❌✗✓\/\\?%*:\[\]"<>]/g, '').trim().substring(0, 28) || 'Data';
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);
      });

      XLSX.writeFile(wb, `AURA_Analyzer_Full_${stamp()}.xlsx`);
      showToast('Semua hasil diexport (multi-sheet)!', 'success');
    }

    // ===== AUTO-INJECT TOMBOL EXPORT =====
    function injectExportUI() {
      document.querySelectorAll('.result-card').forEach(card => {
        const ta = card.querySelector('textarea.result-field');
        const header = card.querySelector('.result-header');
        if (!ta || !header) return;

        exportTitles[ta.id] = (card.querySelector('.result-title')?.textContent || ta.id).trim();

        const wrap = document.createElement('div');
        wrap.className = 'export-wrap';
        wrap.innerHTML = `
          <button class="copy-btn export-toggle"><i class="fas fa-download"></i> Export</button>
          <div class="export-menu">
            ${EXPORT_FORMATS.map(f => `<button onclick="exportData('${ta.id}','${f.key}')"><i class="fas ${f.icon}"></i> ${f.label}</button>`).join('')}
          </div>`;
        const copyBtn = header.querySelector('.copy-btn');
        header.insertBefore(wrap, copyBtn);

        wrap.querySelector('.export-toggle').addEventListener('click', e => {
          e.stopPropagation();
          const menu = wrap.querySelector('.export-menu');
          document.querySelectorAll('.export-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
          menu.classList.toggle('open');
        });
      });

      document.addEventListener('click', () => {
        document.querySelectorAll('.export-menu.open').forEach(m => m.classList.remove('open'));
      });
    }
    document.addEventListener('DOMContentLoaded', injectExportUI);