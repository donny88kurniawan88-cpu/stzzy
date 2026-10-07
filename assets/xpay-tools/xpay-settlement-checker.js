(() => {
  const $ = id => document.getElementById(id);

  const filesInput = $('files');
  const btnCheck = $('btnCheck');
  const loader = $('loader');
  const statusEl = $('status');
  const searchEl = $('search');
  const tbody = $('tbody');
  const empty = $('empty');
  const uploadRow = $('uploadRow');
  const dbNote = $('dbNote');
  const hintText = $('hintText');
  const tabCsv = $('tabCsv');
  const tabDb = $('tabDb');

  let mode = 'csv';
  let csvRows = [];
  let resultRows = [];

  const pad = n => String(n).padStart(2,'0');
  const fmtRp = n => 'Rp ' + Math.round(Number(n || 0)).toLocaleString('id-ID');
  const fmtNum = n => Math.round(Number(n || 0)).toLocaleString('id-ID');

  function localDateString(d){
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  function addDays(dateStr, delta){
    const [y,m,d] = dateStr.split('-').map(Number);
    const x = new Date(y,m-1,d);
    x.setDate(x.getDate()+delta);
    return localDateString(x);
  }

  function displayDate(dateStr){
    if(!dateStr) return '';
    const [y,m,d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function parseCSVLine(line, delim){
    const out=[];
    let cur='', quoted=false;
    for(let i=0;i<line.length;i++){
      const c=line[i];
      if(c==='"'){
        if(quoted && line[i+1]==='"'){ cur+='"'; i++; }
        else quoted=!quoted;
      }else if(c===delim && !quoted){
        out.push(cur); cur='';
      }else{
        cur+=c;
      }
    }
    out.push(cur);
    return out;
  }

  // Deteksi delimiter CSV (koma / titik koma / tab) — export Excel daerah
  // kadang memakai ';' sehingga pemisah koma membuat kolom tidak terbaca.
  function detectDelimiter(lines){
    let best=',',bestCount=0;
    for(const line of lines.slice(0,10)){
      for(const d of [',',';','\t']){
        const c=line.split(d).length-1;
        if(c>bestCount){bestCount=c;best=d;}
      }
    }
    return best;
  }

  function normalizeHeader(s){
    return String(s || '').replace(/^\uFEFF/,'').trim().toUpperCase()
      .replace(/[_\-]+/g,' ').replace(/\s+/g,' ');
  }

  // Cari indeks kolom: judul persis dulu, lalu cadangan awalan
  // (mis. "RECORD VALUE (IDR)" tetap terbaca sebagai RECORD VALUE).
  function colIdx(headers, names){
    for(const n of names){
      const i=headers.indexOf(n);
      if(i>=0) return i;
    }
    for(const n of names){
      const i=headers.findIndex(h=>h && h.startsWith(n));
      if(i>=0) return i;
    }
    return -1;
  }

  function mapColumns(headers){
    return {
      id:colIdx(headers,['ID','TRANSACTION ID']),
      payment:colIdx(headers,['PAYMENT','PAYMENT TIME','PAYMENT DATE']),
      settlement:colIdx(headers,['SETTLEMENT','SETTLEMENT DATE']),
      value:colIdx(headers,['RECORD VALUE','VALUE','AMOUNT','NOMINAL']),
      fee:colIdx(headers,['RECORD FEE','FEE']),
      status:colIdx(headers,['STATUS','STATUS EXCEL']),
      member:colIdx(headers,['MEMBER','USER ID','USERID']),
      partner:colIdx(headers,['PARTNER ID','PATNER ID','PARTNERID','ORDER ID','ORDERID'])
    };
  }

  function parseMoney(v){
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const s=String(v ?? '').trim();
    if(!s) return 0;

    // Backend biasanya mengirim angka murni / decimal normal.
    if(/^-?\d+(?:\.\d+)?$/.test(s)){
      const n=Number(s);
      return Number.isFinite(n) ? n : 0;
    }

    // CSV XPay dapat berisi separator pemisah ribuan.
    const neg=s.startsWith('-');
    const digits=s.replace(/[^0-9]/g,'');
    const n=digits ? Number(digits) : 0;
    return neg ? -n : n;
  }

  function parseXpay(text, fileName){
    const lines=text.replace(/\r/g,'').split('\n').filter(x=>x.trim()!=='');
    const delim=detectDelimiter(lines);
    let headerIndex=-1, headers=[], idx=null;

    for(let i=0;i<Math.min(lines.length,15);i++){
      const candidate=parseCSVLine(lines[i],delim).map(normalizeHeader);
      const mapped=mapColumns(candidate);
      if(mapped.payment>=0 && mapped.value>=0 && mapped.fee>=0){
        headerIndex=i;
        headers=candidate;
        idx=mapped;
        break;
      }
    }

    if(headerIndex<0){
      throw new Error(
        `Header XPay tidak ditemukan di ${fileName}. Kolom wajib: PAYMENT, RECORD VALUE, RECORD FEE. `+
        `Baris pertama: "${(lines[0]||'').slice(0,80)}"`
      );
    }

    const data=[];
    let unreadable=0;
    const samples=[];

    for(let i=headerIndex+1;i<lines.length;i++){
      const a=parseCSVLine(lines[i],delim);
      const payment=(a[idx.payment] || '').trim();
      if(!payment) continue;

      // Diagnostik: baris dengan tanggal PAYMENT yang gagal dibaca dihitung
      // dan contohnya ditampilkan agar tidak bungkam lagi dilewati.
      if(!paymentParts(payment)){
        unreadable++;
        if(samples.length<3 && !samples.includes(payment)){
          samples.push(payment.length>24?payment.slice(0,24)+'…':payment);
        }
      }

      data.push({
        transactionId:idx.id>=0 ? (a[idx.id] || '').trim() : '',
        payment,
        settlement:idx.settlement>=0 ? (a[idx.settlement] || '').trim() : '',
        value:parseMoney(a[idx.value]),
        fee:parseMoney(a[idx.fee]),
        status:idx.status>=0 ? (a[idx.status] || '').trim().toUpperCase() : 'SUCCESS',
        member:idx.member>=0 ? (a[idx.member] || '').trim() : '',
        partner:idx.partner>=0 ? (a[idx.partner] || '').trim() : '',
        source:fileName
      });
    }

    return {rows:data, unreadable, samples};
  }

  // ---- Parser tanggal v2 (v3.14.3) ----
  // Export XPay/Excel sangat bervariasi. Semua format berikut kini didukung:
  //   ISO        : 2026-08-13T23:30:01.000+07:00 / 2026-08-13 23:30 / 2026/8/13 23.30
  //   US numeric : 8/13/2026 11:30:01 PM (konvensi kolom tanggal XPay — M/D/Y)
  //   ID numeric : 13/08/2026 23:30 / 13-08-2026 23:30 / 13.08.2026
  //   Nama bulan : 13-Aug-2026 23:30 / Aug 13, 2026 11:30 PM / 05-Sep-25
  //   Serial     : 45905 atau 45905.5 (serial Excel, angka murni atau teks)
  // Zona waktu pada ISO (+07:00 / Z) diabaikan — jam dipakai apa adanya,
  // konsisten dengan logika H-1/H-2 berbasis jam lokal pada file.
  const PC_MONTHS={jan:1,january:1,januari:1,feb:2,february:2,februari:2,mar:3,march:3,maret:3,apr:4,april:4,may:5,mei:5,jun:6,june:6,juni:6,jul:7,july:7,juli:7,aug:8,august:8,agu:8,agt:8,agustus:8,sep:9,september:9,oct:10,october:10,okt:10,oktober:10,nov:11,november:11,dec:12,december:12,des:12,desember:12};

  function pcIsoDate(y,mo,d){
    y=Number(y);mo=Number(mo);d=Number(d);
    if(y<100) y+=(y>=50?1900:2000);
    if(mo<1||mo>12||d<1||d>31||y<1990||y>2100) return null;
    return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  function pcSecOf(h,mi,s,meridiem){
    let H=Number(h)||0;
    const M=Number(mi)||0;
    const S=Number(s)||0;
    const ap=String(meridiem||'').trim().toLowerCase().replace('.','');
    if(ap==='pm'&&H<12) H+=12;
    if(ap==='am'&&H===12) H=0;
    if(H>23||M>59||S>59) return null;
    return H*3600+M*60+S;
  }

  function pcSerialToParts(n){
    if(!Number.isFinite(n)||n<20000||n>80000) return null;
    const dt=new Date(Date.UTC(1899,11,30)+Math.round(n*86400000));
    return {
      date:`${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`,
      sec:dt.getUTCHours()*3600+dt.getUTCMinutes()*60+dt.getUTCSeconds()
    };
  }

  function pcStripDayName(s){
    return s.replace(/^(minggu|ahad|senin|selasa|rabu|kamis|jumat|jum'?at|sabtu|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*,?\s*/i,'').trim();
  }

  // Tanggal numerik ambigu: '/' mengikuti konvensi export XPay (US M/D),
  // '-' dan '.' mengikuti format lokal ID (D/M). Salah satu > 12 selalu menang.
  function pcNumericDate(a,b,y,sep){
    a=Number(a);b=Number(b);
    if(a>12&&b<=12) return pcIsoDate(y,b,a);
    if(b>12&&a<=12) return pcIsoDate(y,a,b);
    return sep==='/' ? pcIsoDate(y,a,b) : pcIsoDate(y,b,a);
  }

  function paymentParts(value){
    let s=String(value ?? '').trim();
    if(!s) return null;

    // Serial Excel murni (5 digit, boleh pecahan) tanpa jam teks.
    if(/^(\d{5})(?:\.(\d+))?$/.test(s)){
      const parts=pcSerialToParts(Number(s));
      if(parts) return parts;
    }

    s=pcStripDayName(s);
    let m;

    // ISO: tahun di depan, pemisah - / atau ., jam opsional dgn detik, ms, zona.
    m=s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:[T\s](\d{1,2})[:.](\d{1,2})(?:[:.](\d{1,2}))?(?:\.\d+)?\s*(?:AM|PM)?\s*(?:[+-]\d{2}:?\d{2}|Z)?)?/i);
    if(m){
      const date=pcIsoDate(m[1],m[2],m[3]);
      if(!date) return null;
      const sec=m[4]!=null?(pcSecOf(m[4],m[5]||0,m[6]||0)??0):0;
      return {date,sec};
    }

    // 13-Aug-2026 23:30 / 13 Aug 26 / 05-Sep-25 (jam opsional, AM/PM opsional)
    m=s.match(/^(\d{1,2})[\s\-\/]([A-Za-z]{3,9})\.?,?(?:[\s\-\/,]+(\d{2,4}))?(?:[T\s]+(\d{1,2})[:.](\d{1,2})(?:[:.](\d{1,2}))?(?:\s*(AM|PM))?)?/i);
    if(m){
      const mo=PC_MONTHS[m[2].toLowerCase()];
      if(mo&&m[3]){
        const date=pcIsoDate(m[3],mo,m[1]);
        if(!date) return null;
        const sec=m[4]!=null?(pcSecOf(m[4],m[5]||0,m[6]||0,m[7])??0):0;
        return {date,sec};
      }
    }

    // Aug 13, 2026 11:30 PM / August 13th, 2026
    m=s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{2,4})(?:[T\s,]+(\d{1,2})[:.](\d{1,2})(?:[:.](\d{1,2}))?(?:\s*(AM|PM))?)?/i);
    if(m){
      const mo=PC_MONTHS[m[1].toLowerCase()];
      if(mo){
        const date=pcIsoDate(m[3],mo,m[2]);
        if(!date) return null;
        const sec=m[4]!=null?(pcSecOf(m[4],m[5]||0,m[6]||0,m[7])??0):0;
        return {date,sec};
      }
    }

    // Numerik: 8/13/2026, 13/08/2026, 13-08-26, 13.08.2026 (jam opsional + AM/PM)
    m=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})(?:[T\s]+(\d{1,2})[:.](\d{1,2})(?:[:.](\d{1,2}))?(?:\s*(AM|PM))?)?/i);
    if(m){
      const sepChar=(m[0].match(/[-\/.]/)||['-'])[0];
      const date=pcNumericDate(m[1],m[2],m[3],sepChar);
      if(!date) return null;
      const sec=m[4]!=null?(pcSecOf(m[4],m[5]||0,m[6]||0,m[7])??0):0;
      return {date,sec};
    }

    return null;
  }

  // Kolom SETTLEMENT → 'YYYY-MM-DD'. Kini mewarisi seluruh format paymentParts
  // (ISO, US M/D/Y, D-M-Y, nama bulan, serial Excel, tahun 2 digit).
  function settlementDateValue(value){
    if(value==null) return '';
    if(typeof value==='number'){
      const p=pcSerialToParts(value);
      return p ? p.date : '';
    }
    const p=paymentParts(value);
    return p ? p.date : '';
  }

  // V26: TANPA API.
  // Semua data XPay disimpan dan dibaca langsung dari IndexedDB browser.
  const LOCAL_DB_NAME = 'TheLastMoonXpayChecker';
  const LOCAL_DB_VERSION = 1;
  const LOCAL_STORE = 'transactions';

  function openLocalDb(){
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(LOCAL_DB_NAME,LOCAL_DB_VERSION);

      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(LOCAL_STORE)){
          const store=db.createObjectStore(LOCAL_STORE,{keyPath:'signature'});
          store.createIndex('paymentDate','paymentDate',{unique:false});
          store.createIndex('transactionId','transactionId',{unique:false});
        }
      };

      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(
        request.error || new Error('IndexedDB tidak dapat dibuka.')
      );
    });
  }

  function hashText(text){
    let h1=0xdeadbeef ^ text.length;
    let h2=0x41c6ce57 ^ text.length;

    for(let i=0;i<text.length;i++){
      const ch=text.charCodeAt(i);
      h1=Math.imul(h1 ^ ch,2654435761);
      h2=Math.imul(h2 ^ ch,1597334677);
    }

    h1=Math.imul(h1 ^ (h1>>>16),2246822507) ^
       Math.imul(h2 ^ (h2>>>13),3266489909);
    h2=Math.imul(h2 ^ (h2>>>16),2246822507) ^
       Math.imul(h1 ^ (h1>>>13),3266489909);

    return (
      (h2>>>0).toString(16).padStart(8,'0')+
      (h1>>>0).toString(16).padStart(8,'0')
    );
  }

  function makeLocalSignature(row){
    const id=String(row.transactionId || '').trim();
    if(id) return `ID:${id}`;

    return 'ROW:'+hashText([
      row.payment || '',
      row.settlement || '',
      row.value || 0,
      row.fee || 0,
      row.status || '',
      row.member || '',
      row.partner || ''
    ].join('|'));
  }

  function paymentDateFromText(payment){
    const p=paymentParts(payment);
    return p ? p.date : '';
  }

  async function saveRowsLocal(rows){
    if(!Array.isArray(rows) || !rows.length){
      return {saved:0};
    }

    const db=await openLocalDb();

    return new Promise((resolve,reject)=>{
      const tx=db.transaction(LOCAL_STORE,'readwrite');
      const store=tx.objectStore(LOCAL_STORE);
      let saved=0;

      tx.oncomplete=()=>{
        db.close();
        resolve({saved});
      };

      tx.onerror=()=>{
        const error=tx.error || new Error('Gagal menyimpan IndexedDB.');
        db.close();
        reject(error);
      };

      for(const row of rows){
        const paymentDate=paymentDateFromText(row.payment);
        if(!paymentDate) continue;

        store.put({
          signature:makeLocalSignature(row),
          transactionId:String(row.transactionId || ''),
          payment:String(row.payment || ''),
          paymentDate,
          settlement:String(row.settlement || ''),
          value:Number(row.value || 0),
          fee:Number(row.fee || 0),
          status:String(row.status || 'SUCCESS').toUpperCase(),
          member:String(row.member || ''),
          partner:String(row.partner || ''),
          source:String(row.source || 'CSV'),
          updatedAt:Date.now()
        });
        saved++;
      }
    });
  }

  async function readRowsLocal(dateFrom,dateTo){
    const db=await openLocalDb();

    return new Promise((resolve,reject)=>{
      const tx=db.transaction(LOCAL_STORE,'readonly');
      const store=tx.objectStore(LOCAL_STORE);
      const index=store.index('paymentDate');
      const range=IDBKeyRange.bound(dateFrom,dateTo);
      const request=index.getAll(range);

      request.onsuccess=()=>{
        db.close();
        resolve(
          (request.result || [])
            .sort((a,b)=>String(a.payment).localeCompare(String(b.payment)))
        );
      };

      request.onerror=()=>{
        const error=request.error || new Error('Gagal membaca IndexedDB.');
        db.close();
        reject(error);
      };
    });
  }

  async function countLocalRows(){
    const db=await openLocalDb();

    return new Promise((resolve,reject)=>{
      const tx=db.transaction(LOCAL_STORE,'readonly');
      const request=tx.objectStore(LOCAL_STORE).count();

      request.onsuccess=()=>{
        db.close();
        resolve(Number(request.result || 0));
      };

      request.onerror=()=>{
        const error=request.error || new Error('Gagal menghitung IndexedDB.');
        db.close();
        reject(error);
      };
    });
  }

  async function fetchLocalTransactions(cairDate){
    const settlementDate=addDays(cairDate,-1);
    const cutoffDate=addDays(cairDate,-2);
    const rows=await readRowsLocal(cutoffDate,settlementDate);

    return {
      success:true,
      source:'indexeddb',
      total:rows.length,
      data:rows
    };
  }

  function normalizeDbRows(payload){
    const list = Array.isArray(payload)
      ? payload
      : (Array.isArray(payload?.data)
          ? payload.data
          : []);

    return list.map(r => {
      const payment=String(r.payment || '').trim();

      return {
        transactionId:String(r.transactionId || r.transaction_id || ''),
        payment,
        settlement:String(r.settlement || ''),
        value:parseMoney(r.value ?? r.record_value ?? 0),
        fee:parseMoney(r.fee ?? r.record_fee ?? 0),
        status:String(r.status || 'SUCCESS').trim().toUpperCase(),
        member:String(r.member || ''),
        partner:String(r.partner || r.partner_id || ''),
        source:'INDEXEDDB'
      };
    }).filter(r => r.payment);
  }

  async function loadFiles(){
    const files=[...filesInput.files];
    if(!files.length){
      csvRows=[];
      $('fileText').textContent='Pilih minimal 2 CSV. Contoh: xpay 13.csv + xpay 14.csv';
      return;
    }

    setBusy(true,'Membaca CSV...');
    try{
      let all=[];
      let unreadTotal=0;
      const warnSamples=[];
      for(let i=0;i<files.length;i++){
        statusEl.textContent=`Membaca ${files[i].name} (${i+1}/${files.length})...`;
        const text=await files[i].text();
        const parsed=parseXpay(text,files[i].name);
        all=all.concat(parsed.rows);
        unreadTotal+=parsed.unreadable;
        for(const s of parsed.samples){
          if(!warnSamples.includes(s)) warnSamples.push(s);
        }
        await new Promise(r=>setTimeout(r,0));
      }
      csvRows=all;
      $('fileText').textContent=files.map(f=>f.name).join(' • ');

      const sync=await saveRowsLocal(csvRows);
      const totalLocal=await countLocalRows();

      let msg=
        `${files.length} file berhasil dimuat • ${csvRows.length.toLocaleString('id-ID')} baris transaksi • `+
        `${sync.saved.toLocaleString('id-ID')} baris disimpan lokal • Total database browser: `+
        `${totalLocal.toLocaleString('id-ID')} baris.`;

      if(unreadTotal>0){
        msg+=` ⚠ ${unreadTotal.toLocaleString('id-ID')} baris tanggal PAYMENT gagal dibaca `+
             `(contoh: ${warnSamples.slice(0,3).join(' | ')}) dan dilewati.`;
      }

      statusEl.textContent=msg;
    }catch(err){
      csvRows=[];
      statusEl.textContent='Error: '+err.message;
      alert(err.message);
    }finally{
      setBusy(false);
    }
  }

  function summarize(list){
    return list.reduce((a,r)=>{
      a.count++;
      a.value+=r.value;
      a.fee+=r.fee;
      a.cair+=r.value-r.fee;
      return a;
    },{count:0,value:0,fee:0,cair:0});
  }

  function calculate(rows, cairDate){
    const settlementDate=addDays(cairDate,-1);
    const cutoffDate=addDays(cairDate,-2);

    // V25:
    // 00:00:00 - 23:29:59 = SETTLEMENT normal pada H-1.
    // 23:30:01 - 23:59:59 = CUTOFF normal pada H-2.
    // Tepat 23:30:00 memakai kolom SETTLEMENT:
    // - SETTLEMENT date == H-1 / settlementDate => SETTLEMENT
    // - SETTLEMENT kosong dan PAYMENT date == H-2 => CUTOFF
    const exact233000=23*3600+30*60;
    const cutoffNormalStart=exact233000+1;
    const dayEnd=23*3600+59*60+59;

    const settlement=[];
    const cutoff=[];

    for(const r of rows){
      if(r.status && r.status!=='SUCCESS') continue;

      const p=paymentParts(r.payment);
      if(!p) continue;

      // Normal settlement H-1.
      if(p.date===settlementDate && p.sec<exact233000){
        settlement.push({...r,type:'SETTLEMENT'});
        continue;
      }

      // Normal cutoff H-2 starts at 23:30:01.
      if(
        p.date===cutoffDate &&
        p.sec>=cutoffNormalStart &&
        p.sec<=dayEnd
      ){
        cutoff.push({...r,type:'CUTOFF'});
        continue;
      }

      // Special case exactly 23:30:00.
      if(p.sec===exact233000){
        const settlementDateInRow=settlementDateValue(r.settlement);

        if(settlementDateInRow===settlementDate){
          settlement.push({...r,type:'SETTLEMENT'});
          continue;
        }

        if(!settlementDateInRow && p.date===cutoffDate){
          cutoff.push({...r,type:'CUTOFF'});
          continue;
        }
      }
    }

    const s=summarize(settlement);
    const c=summarize(cutoff);
    const total={
      count:s.count+c.count,
      value:s.value+c.value,
      fee:s.fee+c.fee,
      cair:s.cair+c.cair
    };

    resultRows=[...settlement,...cutoff]
      .sort((a,b)=>String(a.payment).localeCompare(String(b.payment)));

    $('settlementDateLabel').textContent=`(TGL ${displayDate(settlementDate)})`;
    $('cutoffDateLabel').textContent=`(TGL ${displayDate(cutoffDate)})`;
    $('totalDateLabel').textContent=`(TGL ${cairDate})`;

    putStats('settlement',s);
    putStats('cutoff',c);

    $('totalCount').textContent=total.count.toLocaleString('id-ID');
    $('totalCair').textContent=fmtRp(total.cair);
    $('totalValue').textContent=fmtRp(total.value);
    $('totalFee').textContent=fmtRp(total.fee);
    $('detailCount').textContent=resultRows.length.toLocaleString('id-ID');

    renderTable();

    // Debug info if no results
    if(resultRows.length===0){
      statusEl.textContent=
        `Tidak ada data cocok. Cek: Tanggal Cair=${displayDate(cairDate)}, `+
        `Settlement(H-1)=${displayDate(settlementDate)}, Cutoff(H-2)=${displayDate(cutoffDate)}. `+
        `Total baris dianalisa: ${rows.length}. Pastikan PAYMENT date cocok dengan H-1 atau H-2.`;
    }else{
      statusEl.textContent=
        `${mode==='db' ? 'IndexedDB' : 'CSV'} • V25 • Settlement ${displayDate(settlementDate)} + `+
        `Cutoff ${displayDate(cutoffDate)} → Total Cair ${displayDate(cairDate)}.`;
    }
  }

  async function check(){
    const cairDate=$('dateCair').value;
    if(!cairDate){
      alert('Pilih Tanggal Cair.');
      return;
    }

    if(mode==='csv'){
      if(!csvRows.length){
        alert('Upload file CSV XPay terlebih dahulu.');
        return;
      }

      setBusy(true,'Menghitung CSV...');
      setTimeout(()=>{
        calculate(csvRows,cairDate);
        setBusy(false);
      },30);
      return;
    }

    // MENU CEK SETTLEMENT 23:30
    // Tidak upload CSV lagi. Langsung membaca database upload sebelumnya.
    setBusy(true,'Mengambil data dari database browser...');
    try{
      const payload=await fetchLocalTransactions(cairDate);

      if(payload?.success===false){
        throw new Error(payload?.error || 'Gagal membaca database lokal.');
      }

      const dbRows=normalizeDbRows(payload);

      if(!dbRows.length){
        throw new Error('Database browser kosong untuk tanggal tersebut. Upload CSV XPay terlebih dahulu di browser ini.');
      }

      calculate(dbRows,cairDate);
    }catch(err){
      statusEl.textContent='Error database browser: '+(err.message || String(err));
      alert('Gagal membaca database browser: '+(err.message || String(err)));
    }finally{
      setBusy(false);
    }
  }

  function putStats(prefix,x){
    $(prefix+'Count').textContent=x.count.toLocaleString('id-ID');
    $(prefix+'Cair').textContent=fmtRp(x.cair);
    $(prefix+'Value').textContent=fmtRp(x.value);
    $(prefix+'Fee').textContent=fmtRp(x.fee);
  }

  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g,c=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[c]));
  }

  function renderTable(){
    const q=searchEl.value.trim().toLowerCase();
    const filtered=q
      ? resultRows.filter(r=>`${r.member} ${r.partner} ${r.payment}`.toLowerCase().includes(q))
      : resultRows;

    if(!filtered.length){
      tbody.innerHTML='';
      empty.style.display='block';
      empty.textContent=resultRows.length
        ? 'Tidak ada hasil pencarian.'
        : 'Tidak ada transaksi yang cocok untuk tanggal tersebut.';
      return;
    }

    empty.style.display='none';

    const show=filtered.slice(0,5000);
    tbody.innerHTML=show.map(r=>`<tr>
      <td><span class="badge ${r.type.toLowerCase()}">${r.type}</span></td>
      <td>${esc(r.payment)}</td>
      <td>${esc(r.member)}</td>
      <td>${esc(r.partner)}</td>
      <td>${esc(r.status || 'SUCCESS')}</td>
      <td class="num">${fmtNum(r.value)}</td>
      <td class="num">${fmtNum(r.fee)}</td>
      <td class="num"><b>${fmtNum(r.value-r.fee)}</b></td>
    </tr>`).join('');

    if(filtered.length>5000){
      empty.style.display='block';
      empty.textContent=
        `Menampilkan 5.000 dari ${filtered.length.toLocaleString('id-ID')} baris agar browser tetap ringan. `+
        `Export CSV tetap berisi semua hasil.`;
    }
  }

  function csvEscape(v){
    const s=String(v ?? '');
    return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
  }

  function exportCSV(){
    if(!resultRows.length){
      alert('Belum ada hasil untuk diexport.');
      return;
    }

    const header=['TIPE','PAYMENT','MEMBER','PARTNER ID','STATUS','RECORD VALUE','RECORD FEE','CAIR'];
    const lines=[header.join(',')];

    for(const r of resultRows){
      lines.push([
        r.type,r.payment,r.member,r.partner,r.status||'SUCCESS',
        r.value,r.fee,r.value-r.fee
      ].map(csvEscape).join(','));
    }

    const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`hasil_${mode==='db'?'settlement_2330':'settlement'}_${$('dateCair').value}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function setBusy(on,msg){
    btnCheck.disabled=on;
    loader.style.display=on?'inline-block':'none';
    if(msg) statusEl.textContent=msg;
  }

  function resetResults(){
    resultRows=[];
    putStats('settlement',{count:0,cair:0,value:0,fee:0});
    putStats('cutoff',{count:0,cair:0,value:0,fee:0});
    $('totalCount').textContent='0';
    $('totalCair').textContent='Rp 0';
    $('totalValue').textContent='Rp 0';
    $('totalFee').textContent='Rp 0';
    $('detailCount').textContent='0';
    tbody.innerHTML='';
    empty.style.display='block';
    empty.textContent=mode==='db'
      ? 'Pilih tanggal lalu klik Cek. Data akan dibaca dari database browser (IndexedDB).'
      : 'Upload CSV lalu klik Cek.';
  }

  function updateLabelsOnly(){
    const d=$('dateCair').value;
    if(!d) return;
    $('settlementDateLabel').textContent=`(TGL ${displayDate(addDays(d,-1))})`;
    $('cutoffDateLabel').textContent=`(TGL ${displayDate(addDays(d,-2))})`;
    $('totalDateLabel').textContent=`(TGL ${d})`;
  }

  function setMode(nextMode){
    mode=nextMode;

    tabCsv.classList.toggle('active',mode==='csv');
    tabDb.classList.toggle('active',mode==='db');

    uploadRow.style.display=mode==='csv' ? '' : 'none';
    dbNote.style.display=mode==='db' ? 'flex' : 'none';

    if(mode==='csv'){
      hintText.innerHTML=
        'Tanggal Cair dipakai untuk menentukan otomatis: <b>Settlement = H-1</b> dan <b>Cutoff = H-2</b>. '+
        'Settlement normal <b>00:00:00–23:29:59</b>; Cutoff normal <b>23:30:01–23:59:59</b>. '+
        'Khusus <b>23:30:00</b>, sistem membaca kolom <b>SETTLEMENT</b>: tanggal sama dengan <b>H-1 / tanggal settlement</b> = '+
        '<b>SETTLEMENT</b>; jika kosong pada H-2 = <b>CUTOFF</b>. Hanya STATUS <b>SUCCESS</b>.';
      statusEl.textContent=csvRows.length
        ? `${csvRows.length.toLocaleString('id-ID')} baris CSV sudah dimuat.`
        : 'Belum ada CSV yang dimuat.';
    }else{
      hintText.innerHTML=
        'Menu ini <b>tidak perlu upload CSV lagi</b>. Sistem membaca transaksi yang sudah tersimpan di browser ini (IndexedDB). '+
        'V25: Settlement normal H-1 <b>00:00:00–23:29:59</b>; Cutoff normal H-2 <b>23:30:01–23:59:59</b>. '+
        'Tepat <b>23:30:00</b> ditentukan dari kolom <b>SETTLEMENT</b> yang tersimpan di database.';
      countLocalRows().then(total=>{statusEl.textContent=`Siap membaca database browser • ${total.toLocaleString('id-ID')} baris tersimpan.`;}).catch(()=>{statusEl.textContent='Siap membaca database browser.';});
    }

    resetResults();
    updateLabelsOnly();
  }

  filesInput.addEventListener('change',loadFiles);
  btnCheck.addEventListener('click',check);
  $('dateCair').addEventListener('change',updateLabelsOnly);
  searchEl.addEventListener('input',renderTable);
  $('btnExport').addEventListener('click',exportCSV);

  tabCsv.addEventListener('click',()=>setMode('csv'));
  tabDb.addEventListener('click',()=>setMode('db'));

  updateLabelsOnly();
  setMode('csv');

  countLocalRows()
    .then(total=>{
      if(total>0){
        statusEl.textContent=
          `Database browser siap • ${total.toLocaleString('id-ID')} baris tersimpan.`;
      }
    })
    .catch(()=>{});
})();
