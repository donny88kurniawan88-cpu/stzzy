
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];

  let transactionRows = [];
  let settlementRows = [];
  let settlementDates = [];
  let disbursementRows = [];
  let balanceRows = [];
  let allTransactions = [];
  let selectedMarkIds = new Set();

  const today = new Date();
  const isoToday = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  ['checkDate','compareDate','balanceDate','disbDate','markDate'].forEach(id => { if ($(id)) $(id).value = isoToday; });

  function fmtRp(value){
    return 'Rp ' + Math.round(Number(value || 0)).toLocaleString('id-ID');
  }
  function fmtNum(value){
    return Math.round(Number(value || 0)).toLocaleString('id-ID');
  }
  function esc(value=''){
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function toast(message,type='ok'){
    const el=document.createElement('div');
    el.className=`toast ${type}`;
    el.textContent=message;
    $('toastHost').appendChild(el);
    setTimeout(()=>el.remove(),3500);
  }
  function status(id,message,type=''){
    const el=$(id);
    el.textContent=message;
    el.className='status'+(type?' '+type:'');
  }
  function setBusy(button,on,text='Memproses...'){
    if(!button) return;
    if(on){
      button.dataset.old=button.textContent;
      button.disabled=true;
      button.textContent=text;
    }else{
      button.disabled=false;
      if(button.dataset.old) button.textContent=button.dataset.old;
    }
  }
  const LOCAL_DB_NAME = 'TheLastMoonXpayV31';
  const LOCAL_DB_VERSION = 1;

  function openLocalDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(LOCAL_DB_NAME,LOCAL_DB_VERSION);

      req.onupgradeneeded=()=>{
        const db=req.result;

        if(!db.objectStoreNames.contains('transactions')){
          const s=db.createObjectStore('transactions',{keyPath:'id',autoIncrement:true});
          s.createIndex('signature','signature',{unique:true});
          s.createIndex('batchId','batchId',{unique:false});
          s.createIndex('settlementDate','settlementDate',{unique:false});
          s.createIndex('paymentDate','paymentDate',{unique:false});
          s.createIndex('partnerId','partnerId',{unique:false});
        }

        if(!db.objectStoreNames.contains('upload_history')){
          db.createObjectStore('upload_history',{keyPath:'batchId'});
        }

        if(!db.objectStoreNames.contains('settlement_files')){
          const s=db.createObjectStore('settlement_files',{keyPath:'id',autoIncrement:true});
          s.createIndex('settlementDate','settlementDate',{unique:false});
        }

        if(!db.objectStoreNames.contains('settlement_details')){
          const s=db.createObjectStore('settlement_details',{keyPath:'id',autoIncrement:true});
          s.createIndex('fileId','fileId',{unique:false});
          s.createIndex('settlementDate','settlementDate',{unique:false});
          s.createIndex('partnerId','partnerId',{unique:false});
        }

        if(!db.objectStoreNames.contains('comparison_results')){
          const s=db.createObjectStore('comparison_results',{keyPath:'key'});
          s.createIndex('settlementDate','settlementDate',{unique:false});
        }

        if(!db.objectStoreNames.contains('disbursements')){
          const s=db.createObjectStore('disbursements',{keyPath:'id',autoIncrement:true});
          s.createIndex('refId','refId',{unique:true});
          s.createIndex('batchId','batchId',{unique:false});
          s.createIndex('dateDisbursement','dateDisbursement',{unique:false});
        }

        if(!db.objectStoreNames.contains('disbursement_logs')){
          const s=db.createObjectStore('disbursement_logs',{keyPath:'id',autoIncrement:true});
          s.createIndex('refId','refId',{unique:false});
          s.createIndex('disbursementId','disbursementId',{unique:false});
        }

        if(!db.objectStoreNames.contains('balance_history')){
          const s=db.createObjectStore('balance_history',{keyPath:'id',autoIncrement:true});
          s.createIndex('signature','signature',{unique:true});
          s.createIndex('batchId','batchId',{unique:false});
          s.createIndex('dateCreated','dateCreated',{unique:false});
        }
      };

      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('IndexedDB tidak dapat dibuka.'));
    });
  }

  function idbRequest(req){
    return new Promise((resolve,reject)=>{
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('IndexedDB error.'));
    });
  }

  async function withStore(names,mode,fn){
    const db=await openLocalDb();
    try{
      return await new Promise((resolve,reject)=>{
        const list=Array.isArray(names)?names:[names];
        const tx=db.transaction(list,mode);
        const stores={};
        list.forEach(name=>stores[name]=tx.objectStore(name));

        let result;
        let failed=false;

        Promise.resolve()
          .then(()=>fn(stores,tx))
          .then(value=>{result=value;})
          .catch(error=>{
            failed=true;
            try{tx.abort();}catch(_){}
            reject(error);
          });

        tx.oncomplete=()=>{if(!failed)resolve(result);};
        tx.onerror=()=>{if(!failed)reject(tx.error||new Error('IndexedDB transaction gagal.'));};
        tx.onabort=()=>{if(!failed)reject(tx.error||new Error('IndexedDB transaction dibatalkan.'));};
      });
    }finally{
      db.close();
    }
  }

  async function storeAll(name){
    const db=await openLocalDb();
    try{
      const tx=db.transaction(name,'readonly');
      return await idbRequest(tx.objectStore(name).getAll());
    }finally{db.close();}
  }

  async function storeIndexAll(name,index,key){
    const db=await openLocalDb();
    try{
      const tx=db.transaction(name,'readonly');
      return await idbRequest(tx.objectStore(name).index(index).getAll(key));
    }finally{db.close();}
  }

  function localHash(text){
    let h1=0xdeadbeef ^ text.length;
    let h2=0x41c6ce57 ^ text.length;
    for(let i=0;i<text.length;i++){
      const ch=text.charCodeAt(i);
      h1=Math.imul(h1^ch,2654435761);
      h2=Math.imul(h2^ch,1597334677);
    }
    h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
    h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
    return (h2>>>0).toString(16).padStart(8,'0')+(h1>>>0).toString(16).padStart(8,'0');
  }

  function localHistoryRow(batchId,filename,fileType,totalRecords,totalAmount){
    return {
      batchId, filename, fileType,
      totalRecords:Number(totalRecords||0),
      totalAmount:Number(totalAmount||0),
      uploadedBy:'LOCAL',
      uploadedAt:Date.now()
    };
  }

  async function localRunComparison(settlementDate){
    const transactions=await storeIndexAll('transactions','settlementDate',settlementDate);
    const details=await storeIndexAll('settlement_details','settlementDate',settlementDate);

    const expected=new Map();
    for(const row of transactions){
      const key=row.partnerId||'';
      const cur=expected.get(key)||{total:0,count:0};
      cur.total+=Number(row.recordValue||0); cur.count++;
      expected.set(key,cur);
    }

    const actual=new Map();
    for(const row of details){
      const key=row.partnerId||'';
      const cur=actual.get(key)||{total:0,count:0};
      cur.total+=Number(row.amount||0); cur.count++;
      actual.set(key,cur);
    }

    const partners=[...new Set([...expected.keys(),...actual.keys()])];
    const rows=[];
    let match=0,missingBank=0,missingSystem=0;

    for(const partner of partners){
      const e=expected.get(partner);
      const a=actual.get(partner);
      const expectedAmount=Number(e?.total||0);
      const actualAmount=Number(a?.total||0);
      const difference=expectedAmount-actualAmount;
      let state='';

      if(!e){state='MISSING_IN_SYSTEM';missingSystem++;}
      else if(!a){state='MISSING_IN_BANK';missingBank++;}
      else if(Math.abs(difference)<0.01){state='MATCH';match++;}
      else state='MISMATCH';

      rows.push({
        key:`${settlementDate}|${partner}`,
        settlementDate,partnerId:partner,
        expectedAmount,actualAmount,difference,
        status:state,transactionCount:Number(e?.count||0)
      });
    }

    await withStore('comparison_results','readwrite',async stores=>{
      const s=stores.comparison_results;
      const old=await idbRequest(s.index('settlementDate').getAll(settlementDate));
      old.forEach(row=>s.delete(row.key));
      rows.forEach(row=>s.put(row));
    });

    return {rows,match,missingBank,missingSystem};
  }

  async function api(action,{method='GET',params={},body=null}={}){
    switch(action){
      case 'summary': {
        const rows=await storeAll('transactions');
        return {
          success:true,
          summary:rows.reduce((s,r)=>{
            s.total++;
            s.total_value+=Number(r.recordValue||0);
            s.total_fee+=Number(r.recordFee||0);
            s.total_net+=Number(r.netAmount||0);
            return s;
          },{total:0,total_value:0,total_fee:0,total_net:0})
        };
      }

      case 'upload_transactions_chunk': {
        const rows=Array.isArray(body?.rows)?body.rows:[];
        let saved=0,totalNet=0;

        await withStore(['transactions','upload_history'],'readwrite',async stores=>{
          const txs=stores.transactions;
          const hist=stores.upload_history;

          for(const item of rows){
            const paymentTime=String(item.paymentTime||'').trim();
            const info=settlementInfo(paymentTime);
            const parts=paymentParts(paymentTime);
            if(!info||!parts||!uuid(item.partnerId)) continue;

            const recordValue=Number(item.recordValue||0);
            const recordFee=Number(item.recordFee||0);
            const netAmount=recordValue-recordFee;
            const signature='TX:'+localHash([
              body.batchId,item.sourceFile||body.filename,item.rowNo,
              item.transactionId||'',paymentTime,item.partnerId||''
            ].join('|'));

            const exists=await idbRequest(txs.index('signature').get(signature));
            if(exists) continue;

            txs.add({
              signature,batchId:body.batchId,
              transactionId:item.transactionId||'',
              recordDate:item.recordDate||'',
              recordValue,recordFee,netAmount,
              merchant:item.merchant||'',
              member:item.member||'',
              paymentTime,paymentDate:parts.date,paymentSec:parts.sec,
              settlementRaw:item.settlementRaw||'',
              settlementType:info.type,
              settlementDate:info.settlementDate,
              partnerId:item.partnerId||'',
              vendorId:item.vendorId||'',
              statusExcel:item.statusExcel||'',
              ticket:item.ticket||'',
              source:item.sourceFile||body.filename||'',
              createdAt:Date.now()
            });

            saved++; totalNet+=netAmount;
          }

          const old=await idbRequest(hist.get(body.batchId));
          if(old){
            old.totalRecords=Number(old.totalRecords||0)+saved;
            old.totalAmount=Number(old.totalAmount||0)+totalNet;
            hist.put(old);
          }else{
            hist.put(localHistoryRow(body.batchId,body.filename||'','TRANSACTION',saved,totalNet));
          }
        });

        return {success:true,saved,totalNet};
      }

      case 'get_batches': {
        const rows=(await storeAll('upload_history'))
          .sort((a,b)=>Number(b.uploadedAt||0)-Number(a.uploadedAt||0))
          .map(r=>({
            batch_id:r.batchId,filename:r.filename,file_type:r.fileType,
            total_records:r.totalRecords,total_amount:r.totalAmount,
            uploaded_by:r.uploadedBy,uploaded_at:r.uploadedAt
          }));
        return {success:true,batches:rows};
      }

      case 'delete_batch': {
        const batchId=body?.batchId||'';
        const type=String(body?.fileType||'').toUpperCase();
        let deleted=0;

        if(type==='TRANSACTION'){
          const rows=await storeIndexAll('transactions','batchId',batchId);
          await withStore(['transactions','upload_history'],'readwrite',stores=>{
            rows.forEach(row=>{stores.transactions.delete(row.id);deleted++;});
            stores.upload_history.delete(batchId);
          });
        }else if(type==='DISBURSEMENT'){
          return api('delete_disbursement_batch',{method:'POST',body:{batchId}});
        }else{
          await withStore('upload_history','readwrite',stores=>stores.upload_history.delete(batchId));
        }

        return {success:true,deleted};
      }

      case 'check_settlement': {
        const date=params?.date||'';
        const tx=await storeIndexAll('transactions','settlementDate',date);
        const settlement=tx.filter(r=>r.settlementType==='SETTLEMENT');
        const cutoff=tx.filter(r=>r.settlementType==='CUTOFF');

        const sum=rows=>rows.reduce((s,r)=>{
          s.value+=Number(r.recordValue||0);
          s.fee+=Number(r.recordFee||0);
          s.net+=Number(r.netAmount||0);
          return s;
        },{value:0,fee:0,net:0});

        const s=sum(settlement),c=sum(cutoff);
        const sourceYesterday=addDays(date,-1);
        const cutoffToday=(await storeIndexAll('transactions','paymentDate',sourceYesterday))
          .filter(r=>r.settlementType==='CUTOFF');
        const ct=sum(cutoffToday);

        const formatRow=r=>({
          payment_date:displayDate(r.paymentDate),
          payment_time:r.paymentTime,
          merchant:r.merchant,
          member:r.member,
          partner_id:r.partnerId,
          record_value_formatted:fmtRp(r.recordValue),
          record_fee_formatted:fmtRp(r.recordFee),
          net_amount_formatted:fmtRp(r.netAmount),
          settlement_type:r.settlementType
        });

        return {
          success:true,target_date:date,
          settlement_source_date:displayDate(addDays(date,-1)),
          cutoff_source_date:displayDate(addDays(date,-2)),
          settlement_count:settlement.length,
          settlement_amount:s.net,settlement_amount_formatted:fmtRp(s.net),
          settlement_fee:s.fee,settlement_fee_formatted:fmtRp(s.fee),
          settlement_value:s.value,settlement_value_formatted:fmtRp(s.value),
          cutoff_count:cutoff.length,
          cutoff_amount:c.net,cutoff_amount_formatted:fmtRp(c.net),
          cutoff_fee:c.fee,cutoff_fee_formatted:fmtRp(c.fee),
          cutoff_value:c.value,cutoff_value_formatted:fmtRp(c.value),
          cutoff_today_count:cutoffToday.length,
          cutoff_today_amount:ct.net,cutoff_today_amount_formatted:fmtRp(ct.net),
          cutoff_today_fee:ct.fee,cutoff_today_fee_formatted:fmtRp(ct.fee),
          cutoff_today_value:ct.value,cutoff_today_value_formatted:fmtRp(ct.value),
          cutoff_today_date:sourceYesterday,
          cutoff_today_cair_date:displayDate(addDays(date,1)),
          total_count:settlement.length+cutoff.length,
          total_amount:s.net+c.net,total_amount_formatted:fmtRp(s.net+c.net),
          total_fee:s.fee+c.fee,total_fee_formatted:fmtRp(s.fee+c.fee),
          total_value:s.value+c.value,total_value_formatted:fmtRp(s.value+c.value),
          transactions:[...settlement,...cutoff].map(formatRow)
        };
      }

      case 'get_transactions': {
        const rows=(await storeAll('transactions'))
          .sort((a,b)=>String(b.paymentTime).localeCompare(String(a.paymentTime)))
          .map(r=>({
            batch_id:r.batchId,transaction_id:r.transactionId,
            record_date:r.recordDate,record_value:r.recordValue,
            record_fee:r.recordFee,net_amount:r.netAmount,
            merchant:r.merchant,member:r.member,payment_time:r.paymentTime,
            settlement_type:r.settlementType,settlement_date:r.settlementDate,
            payment_date:r.paymentDate,partner_id:r.partnerId,
            vendor_id:r.vendorId,status_excel:r.statusExcel,ticket:r.ticket
          }));
        return {success:true,data:rows};
      }

      case 'upload_settlement_start': {
        const date=body?.settlementDate||'';
        const oldDetails=await storeIndexAll('settlement_details','settlementDate',date);
        const oldFiles=await storeIndexAll('settlement_files','settlementDate',date);

        let fileId=0;
        const db=await openLocalDb();
        try{
          await new Promise((resolve,reject)=>{
            const tx=db.transaction(['settlement_details','settlement_files'],'readwrite');
            const details=tx.objectStore('settlement_details');
            const files=tx.objectStore('settlement_files');
            oldDetails.forEach(row=>details.delete(row.id));
            oldFiles.forEach(row=>files.delete(row.id));

            const req=files.add({
              filename:body.filename||'',
              settlementDate:date,totalRecords:0,totalAmount:0,
              uploadedBy:'LOCAL',uploadedAt:Date.now()
            });
            req.onsuccess=()=>{fileId=req.result;};
            tx.oncomplete=resolve;
            tx.onerror=()=>reject(tx.error||new Error('Gagal membuat settlement lokal.'));
          });
        }finally{db.close();}

        return {success:true,fileId};
      }

      case 'upload_settlement_chunk': {
        const rows=Array.isArray(body?.rows)?body.rows:[];
        const files=await storeAll('settlement_files');
        const file=files.find(x=>Number(x.id)===Number(body.fileId));
        if(!file) throw new Error('Settlement file tidak ditemukan.');

        let saved=0,totalAmount=0;
        await withStore('settlement_details','readwrite',stores=>{
          for(const item of rows){
            const amount=Number(item.amount||0);
            if(!uuid(item.partnerId)||amount<=0) continue;
            stores.settlement_details.add({
              fileId:Number(body.fileId),partnerId:item.partnerId,
              amount,settlementDate:file.settlementDate
            });
            saved++; totalAmount+=amount;
          }
        });

        return {success:true,saved,totalAmount};
      }

      case 'upload_settlement_finish': {
        await withStore(['settlement_files','upload_history'],'readwrite',async stores=>{
          const file=await idbRequest(stores.settlement_files.get(Number(body.fileId)));
          if(file){
            file.totalRecords=Number(body.totalRecords||0);
            file.totalAmount=Number(body.totalAmount||0);
            stores.settlement_files.put(file);
          }
          stores.upload_history.put(localHistoryRow(
            body.batchId,body.filename||'','SETTLEMENT',
            Number(body.totalRecords||0),Number(body.totalAmount||0)
          ));
        });

        const c=await localRunComparison(body.settlementDate);
        return {success:true,comparison:{match:c.match,mismatch:c.rows.filter(r=>r.status!=='MATCH').length}};
      }

      case 'get_comparison': {
        const date=params?.date||'';
        const c=await localRunComparison(date);
        const rows=c.rows.map(r=>({
          settlement_date:r.settlementDate,
          partner_id:r.partnerId,
          expected_amount:r.expectedAmount,
          actual_amount:r.actualAmount,
          difference:r.difference,
          status:r.status,
          transaction_count:r.transactionCount
        }));

        return {
          success:true,data:rows,
          settlement_count:(await storeIndexAll('settlement_details','settlementDate',date)).length,
          summary:{
            match:c.match,
            mismatch:rows.filter(r=>r.status==='MISMATCH').length,
            missing_bank:c.missingBank,
            missing_system:c.missingSystem,
            total_expected:rows.reduce((n,r)=>n+Number(r.expected_amount||0),0),
            total_actual:rows.reduce((n,r)=>n+Number(r.actual_amount||0),0),
            total_diff:rows.reduce((n,r)=>n+Number(r.difference||0),0)
          }
        };
      }

      case 'upload_disbursement_chunk': {
        const rows=Array.isArray(body?.rows)?body.rows:[];
        let inserted=0,updated=0,statusChanged=0,preservedDone=0;

        await withStore(['disbursements','disbursement_logs'],'readwrite',async stores=>{
          const d=stores.disbursements,l=stores.disbursement_logs;

          for(const item of rows){
            const refId=String(item.refId||'').trim();
            if(!refId) continue;

            let vendorStatus=String(item.vendorStatus||'').trim().toLowerCase();
            if(!vendorStatus||vendorStatus==='blank') vendorStatus='pending';
            else if(vendorStatus.includes('failed')||vendorStatus.includes('refund')) vendorStatus='failed - refund';
            else if(vendorStatus==='success') vendorStatus='success';

            const old=await idbRequest(d.index('refId').get(refId));

            if(old){
              updated++;
              if(Number(old.statusDone)===1) preservedDone++;
              if(old.vendorStatus!==vendorStatus){
                statusChanged++;
                l.add({
                  disbursementId:old.id,refId,batchId:body.batchId,
                  actionType:'UPDATE',fieldName:'vendor_status',
                  oldValue:old.vendorStatus,newValue:vendorStatus,
                  changedBy:'LOCAL',changedAt:Date.now()
                });
              }

              d.put({
                ...old,batchId:body.batchId,
                transactionId:item.transactionId||'',
                dateDisbursement:item.dateDisbursement,
                bankCode:item.bankCode||'',bankNo:item.bankNo||'',
                accountName:item.accountName||'',amount:Number(item.amount||0),
                vendorStatus,updatedAt:Date.now()
              });
            }else{
              inserted++;
              const req=d.add({
                batchId:body.batchId,transactionId:item.transactionId||'',
                dateDisbursement:item.dateDisbursement,
                bankCode:item.bankCode||'',bankNo:item.bankNo||'',
                accountName:item.accountName||'',amount:Number(item.amount||0),
                refId,vendorStatus,statusDone:0,updatedBy:'LOCAL',
                createdAt:Date.now(),updatedAt:Date.now()
              });

              req.onsuccess=()=>{
                l.add({
                  disbursementId:req.result,refId,batchId:body.batchId,
                  actionType:'INSERT',fieldName:null,oldValue:null,
                  newValue:vendorStatus,changedBy:'LOCAL',changedAt:Date.now()
                });
              };
            }
          }
        });

        return {success:true,inserted,updated,statusChanged,preservedDone};
      }

      case 'finish_disbursement_upload': {
        await withStore('upload_history','readwrite',stores=>{
          stores.upload_history.put(localHistoryRow(
            body.batchId,body.filename||'','DISBURSEMENT',
            Number(body.totalRecords||0),0
          ));
        });
        return {success:true};
      }

      case 'get_disbursements': {
        let rows=await storeAll('disbursements');
        const date=params?.date||'';
        const state=params?.status||'';
        const done=params?.done;

        if(date) rows=rows.filter(r=>r.dateDisbursement===date);
        if(state&&state!=='all'){
          if(state==='failed') rows=rows.filter(r=>r.vendorStatus==='failed - refund');
          else rows=rows.filter(r=>r.vendorStatus===state);
        }
        if(done!==''&&done!==undefined) rows=rows.filter(r=>Number(r.statusDone)===Number(done));

        const summary={
          total:rows.length,
          pending_count:rows.filter(r=>r.vendorStatus==='pending').length,
          failed_count:rows.filter(r=>r.vendorStatus==='failed - refund').length,
          success_count:rows.filter(r=>r.vendorStatus==='success').length,
          done_count:rows.filter(r=>Number(r.statusDone)===1).length
        };

        return {
          success:true,summary,
          data:rows
            .sort((a,b)=>String(b.dateDisbursement).localeCompare(String(a.dateDisbursement))||Number(b.id)-Number(a.id))
            .map(r=>({
              id:r.id,batch_id:r.batchId,transaction_id:r.transactionId,
              date_disbursement:r.dateDisbursement,
              date_formatted:displayDate(r.dateDisbursement),
              bank_code:r.bankCode,bank_no:r.bankNo,
              account_name:r.accountName,amount:r.amount,
              amount_formatted:fmtRp(r.amount),ref_id:r.refId,
              vendor_status:r.vendorStatus,status_done:r.statusDone
            }))
        };
      }

      case 'get_disbursement_logs': {
        const rows=(await storeIndexAll('disbursement_logs','refId',params?.ref_id||''))
          .sort((a,b)=>Number(b.changedAt)-Number(a.changedAt))
          .map(r=>({
            action_type:r.actionType,field_name:r.fieldName,
            old_value:r.oldValue,new_value:r.newValue,
            changed_by:r.changedBy,
            changed_at_formatted:new Date(r.changedAt).toLocaleString('id-ID',{hour12:false})
          }));
        return {success:true,logs:rows};
      }

      case 'mark_disbursement_done': {
        const ids=new Set((body?.ids||[]).map(Number));
        const actionType=body?.actionType||'mark';
        let changed=0;

        await withStore(['disbursements','disbursement_logs'],'readwrite',async stores=>{
          for(const id of ids){
            const row=await idbRequest(stores.disbursements.get(id));
            if(!row) continue;

            if(actionType==='mark'&&Number(row.statusDone)===0){
              row.statusDone=1;changed++;
              stores.disbursements.put(row);
              stores.disbursement_logs.add({
                disbursementId:id,refId:row.refId,batchId:'',
                actionType:'MARK_DONE',fieldName:'status_done',
                oldValue:'0',newValue:'1',changedBy:'LOCAL',changedAt:Date.now()
              });
            }else if(actionType==='unmark'&&Number(row.statusDone)===1){
              row.statusDone=0;changed++;
              stores.disbursements.put(row);
              stores.disbursement_logs.add({
                disbursementId:id,refId:row.refId,batchId:'',
                actionType:'UNMARK_DONE',fieldName:'status_done',
                oldValue:'1',newValue:'0',changedBy:'LOCAL',changedAt:Date.now()
              });
            }
          }
        });

        return {success:true,changed};
      }

      case 'get_disbursement_batches': {
        const rows=(await storeAll('upload_history'))
          .filter(r=>r.fileType==='DISBURSEMENT')
          .sort((a,b)=>Number(b.uploadedAt)-Number(a.uploadedAt))
          .map(r=>({
            batch_id:r.batchId,filename:r.filename,
            total_records:r.totalRecords,uploaded_by:r.uploadedBy,
            uploaded_at:r.uploadedAt
          }));
        return {success:true,batches:rows};
      }

      case 'delete_disbursement_batch': {
        const batchId=body?.batchId||'';
        const rows=await storeIndexAll('disbursements','batchId',batchId);
        const ids=new Set(rows.map(r=>r.id));

        await withStore(['disbursements','disbursement_logs','upload_history'],'readwrite',async stores=>{
          rows.forEach(row=>stores.disbursements.delete(row.id));
          const logs=await idbRequest(stores.disbursement_logs.getAll());
          logs.forEach(log=>{
            if(ids.has(log.disbursementId)) stores.disbursement_logs.delete(log.id);
          });
          stores.upload_history.delete(batchId);
        });

        return {success:true,deleted:rows.length};
      }

      case 'upload_balance_chunk': {
        const rows=Array.isArray(body?.rows)?body.rows:[];
        let saved=0;

        await withStore('balance_history','readwrite',async stores=>{
          const s=stores.balance_history;

          for(const item of rows){
            const signature='BAL:'+localHash([
              body.batchId,item.rowNo,item.recordId,item.dateCreated
            ].join('|'));

            const exists=await idbRequest(s.index('signature').get(signature));
            if(exists) continue;

            s.add({
              signature,batchId:body.batchId,recordId:item.recordId||'',
              dateCreated:item.dateCreated||'',note:item.note||'',
              credit:Number(item.credit||0),debit:Number(item.debit||0),
              balance:Number(item.balance||0),uploadedBy:'LOCAL',
              uploadedAt:Date.now()
            });
            saved++;
          }
        });

        return {success:true,saved};
      }

      case 'get_balance_history': {
        let rows=await storeAll('balance_history');
        const date=params?.date||'';
        if(date) rows=rows.filter(r=>String(r.dateCreated||'').slice(0,10)===date);
        rows.sort((a,b)=>String(b.dateCreated).localeCompare(String(a.dateCreated)));

        let sumCredit=0,sumDebit=0,countCredit=0,countDebit=0,totalCreditAll=0,totalDebitAll=0;
        const data=rows.map(r=>{
          const credit=Number(r.credit||0),debit=Number(r.debit||0);
          totalCreditAll+=Math.abs(credit); totalDebitAll+=debit;
          const isFee=Math.abs(Math.abs(credit)-1500)<.01&&credit<0;
          const isRefund=Math.abs(debit-1500)<.01&&debit>0;
          if(isFee){sumCredit+=credit;countCredit++;}
          if(isRefund){sumDebit+=debit;countDebit++;}
          return {
            record_id:r.recordId,date_formatted:r.dateCreated,note:r.note,
            credit,credit_formatted:fmtRp(Math.abs(credit)),
            debit,debit_formatted:fmtRp(debit),
            balance:r.balance,balance_formatted:fmtRp(r.balance)
          };
        });

        const totalBiaya=(sumCredit+sumDebit)*-1;

        return {
          success:true,data,
          summary:{
            total_records:data.length,
            sum_credit:sumCredit,sum_credit_formatted:fmtRp(Math.abs(sumCredit)),count_credit:countCredit,
            sum_debit:sumDebit,sum_debit_formatted:fmtRp(sumDebit),count_debit:countDebit,
            total_biaya:totalBiaya,total_biaya_formatted:fmtRp(totalBiaya),
            total_credit_all:totalCreditAll,total_credit_all_formatted:fmtRp(totalCreditAll),
            total_debit_all:totalDebitAll,total_debit_all_formatted:fmtRp(totalDebitAll)
          }
        };
      }

      case 'get_balance_batches': {
        const rows=await storeAll('balance_history');
        const map=new Map();

        for(const r of rows){
          if(!map.has(r.batchId)){
            map.set(r.batchId,{
              batch_id:r.batchId,total_records:0,
              uploaded_by:r.uploadedBy,uploaded_at:r.uploadedAt
            });
          }
          map.get(r.batchId).total_records++;
        }

        return {
          success:true,
          batches:[...map.values()]
            .sort((a,b)=>Number(b.uploaded_at)-Number(a.uploaded_at))
            .map(r=>({...r,uploaded_at_formatted:new Date(r.uploaded_at).toLocaleString('id-ID',{hour12:false})}))
        };
      }

      case 'delete_balance_batch': {
        const rows=await storeIndexAll('balance_history','batchId',body?.batchId||'');
        await withStore('balance_history','readwrite',stores=>{
          rows.forEach(r=>stores.balance_history.delete(r.id));
        });
        return {success:true,deleted:rows.length};
      }
    }

    throw new Error(`Action lokal tidak dikenal: ${action}`);
  }

  function displayDate(date){
    const m=String(date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m?`${m[3]}/${m[2]}/${m[1]}`:String(date||'');
  }

  function updateClock(){
    $('clock').textContent=new Date().toLocaleString('id-ID',{hour12:false});
  }
  updateClock(); setInterval(updateClock,1000);

  function switchMain(id){
    $$('.main-tab').forEach(b=>b.classList.toggle('active',b.dataset.main===id));
    $$('.main-panel').forEach(p=>p.classList.toggle('active',p.id===`main-${id}`));
    if(id==='withdraw') loadDisbursements();
  }
  $$('.main-tab').forEach(b=>b.addEventListener('click',()=>switchMain(b.dataset.main)));

  function switchDepositSub(id){
    $$('[data-deposit-sub]').forEach(b=>b.classList.toggle('active',b.dataset.depositSub===id));
    $$('#main-deposit .sub-panel').forEach(p=>p.classList.toggle('active',p.id===`deposit-${id}`));
    if(id==='batches') loadBatches();
    if(id==='data') loadTransactions();
    if(id==='balance') loadBalance();
  }
  $$('[data-deposit-sub]').forEach(b=>b.addEventListener('click',()=>switchDepositSub(b.dataset.depositSub)));

  function switchWithdrawSub(id){
    $$('[data-withdraw-sub]').forEach(b=>b.classList.toggle('active',b.dataset.withdrawSub===id));
    $$('#main-withdraw .withdraw-panel').forEach(p=>p.classList.toggle('active',p.id===`withdraw-${id}`));
    if(id==='list') loadDisbursements();
    if(id==='mark') loadMarkList();
    if(id==='batches') loadDisbursementBatches();
  }
  $$('[data-withdraw-sub]').forEach(b=>b.addEventListener('click',()=>switchWithdrawSub(b.dataset.withdrawSub)));

  $$('[data-balance-tab]').forEach(b=>b.addEventListener('click',()=>{
    const id=b.dataset.balanceTab;
    $$('[data-balance-tab]').forEach(x=>x.classList.toggle('active',x===b));
    $$('.balance-panel').forEach(p=>p.classList.toggle('active',p.id===`balance-${id}`));
    if(id==='view') loadBalance();
    else loadBalanceBatches();
  }));

  async function readRows(file){
    if(!file) throw new Error('Pilih file terlebih dahulu.');
    if(typeof XLSX==='undefined') throw new Error('Library XLSX belum termuat. Refresh halaman.');
    const buffer=await file.arrayBuffer();
    const workbook=XLSX.read(buffer,{type:'array',cellDates:false});
    const sheet=workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:''})
      .filter(row=>row.some(cell=>String(cell??'').trim()!==''));
  }
  function money(v){
    if(typeof v==='number') return Number.isFinite(v)?v:0;
    const s=String(v??'').trim();
    if(!s) return 0;
    if(/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s)||0;
    const neg=s.startsWith('-')||s.startsWith('(');
    const digits=s.replace(/[^0-9]/g,'');
    const n=digits?Number(digits):0;
    return neg?-n:n;
  }
  function paymentParts(s){
    const m=String(s||'').trim().match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
    if(!m) return null;
    return {date:m[1],sec:Number(m[2])*3600+Number(m[3])*60+Number(m[4])};
  }
  function addDays(dateStr,delta){
    const [y,m,d]=dateStr.split('-').map(Number);
    const dt=new Date(Date.UTC(y,m-1,d));
    dt.setUTCDate(dt.getUTCDate()+delta);
    return dt.toISOString().slice(0,10);
  }
  function settlementInfo(payment){
    const p=paymentParts(payment);
    if(!p) return null;
    if(p.sec>=23*3600+30*60){
      return {type:'CUTOFF',paymentDate:p.date,settlementDate:addDays(p.date,2)};
    }
    return {type:'SETTLEMENT',paymentDate:p.date,settlementDate:addDays(p.date,1)};
  }
  function uuid(v){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v||'').trim()); }
  function batchId(){
    const d=new Date();
    const pad=n=>String(n).padStart(2,'0');
    return `batch_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}_${Math.floor(1000+Math.random()*9000)}`;
  }
  function parseFlexibleDate(value,format=''){
    const s=String(value||'').trim();
    let m;
    if(!s) return null;
    if((m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/))) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
    if((m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))){
      const a=Number(m[1]),b=Number(m[2]);
      if(format==='DD/MM/YYYY') return `${m[3]}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`;
      if(format==='M/D/YYYY') return `${m[3]}-${String(a).padStart(2,'0')}-${String(b).padStart(2,'0')}`;
      if(a>12&&b<=12) return `${m[3]}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`;
      if(b>12&&a<=12) return `${m[3]}-${String(a).padStart(2,'0')}-${String(b).padStart(2,'0')}`;
      return 'AMBIGUOUS';
    }
    if((m=s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/))) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    return null;
  }
  function isAmbiguousDate(v){
    const m=String(v||'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return !!m && Number(m[1])<=12 && Number(m[2])<=12 && m[1]!==m[2];
  }
  function parseBalanceDate(v){
    const s=String(v||'').trim(); let m;
    if((m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2})[.:](\d{2})/)))
      return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')} ${String(m[4]).padStart(2,'0')}:${m[5]}:00`;
    if((m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)))
      return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')} 00:00:00`;
    if(/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) return s;
    return null;
  }
  async function chunked(rows,size,fn){
    const results=[];
    for(let i=0;i<rows.length;i+=size){
      results.push(await fn(rows.slice(i,i+size),i));
      await new Promise(r=>setTimeout(r,0));
    }
    return results;
  }

  // ---------- SUMMARY ----------
  async function loadSummary(){
    try{
      const d=await api('summary');
      $('statTransactions').textContent=fmtNum(d.summary.total);
      $('statValue').textContent=fmtRp(d.summary.total_value);
      $('statFee').textContent=fmtRp(d.summary.total_fee);
      $('statNet').textContent=fmtRp(d.summary.total_net);
    }catch(e){ toast(e.message,'err'); }
  }
  $('refreshSummary').addEventListener('click',loadSummary);

  function normalizeHeader(value){
    return String(value ?? '').replace(/^\uFEFF/,'').trim().toUpperCase().replace(/[_\-]+/g,' ').replace(/\s+/g,' ');
  }
  function locateHeader(data, requiredNames=[], maxRows=20){
    const limit=Math.min(maxRows,data.length);
    for(let rowIndex=0;rowIndex<limit;rowIndex++){
      const headers=(data[rowIndex]||[]).map(normalizeHeader);
      if(requiredNames.every(group=>group.some(name=>headers.includes(normalizeHeader(name))))) return {rowIndex,headers};
    }
    return null;
  }
  function headerIndex(headers,names,fallback=-1){
    for(const name of names){const idx=headers.indexOf(normalizeHeader(name));if(idx>=0)return idx;}
    return fallback;
  }
  function parseSheetDate(value){
    const s=String(value ?? '').trim(); if(!s)return null; let m;
    if((m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/))) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
    if((m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))){
      const a=Number(m[1]),b=Number(m[2]);
      if(a>12 || b<=12) return `${m[3]}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`;
      return `${m[3]}-${String(a).padStart(2,'0')}-${String(b).padStart(2,'0')}`;
    }
    if((m=s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/))) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    return null;
  }
  function transactionRowsFromSheet(data,fileName){
    const located=locateHeader(data,[['PAYMENT'],['RECORD VALUE','VALUE','AMOUNT'],['PARTNER ID','PARTNER_ID','ORDER ID','ORDERID']]);
    if(!located) throw new Error(`${fileName}: header PAYMENT / RECORD VALUE / PARTNER ID tidak ditemukan.`);
    const H=located.headers;
    const I={
      id:headerIndex(H,['ID','TRANSACTION ID']), recordDate:headerIndex(H,['RECORD DATE']), value:headerIndex(H,['RECORD VALUE','VALUE','AMOUNT']),
      fee:headerIndex(H,['RECORD FEE','FEE']), merchant:headerIndex(H,['MERCHANT']), member:headerIndex(H,['MEMBER','USER ID','USERID']),
      payment:headerIndex(H,['PAYMENT','PAYMENT TIME']), settlement:headerIndex(H,['SETTLEMENT','SETTLEMENT DATE']),
      partner:headerIndex(H,['PARTNER ID','ORDER ID','ORDERID']), vendor:headerIndex(H,['VENDOR ID']), status:headerIndex(H,['STATUS','STATUS EXCEL']), ticket:headerIndex(H,['TICKET'])
    };
    const rows=[];let invalid=0;
    for(let i=located.rowIndex+1;i<data.length;i++){
      const r=data[i]||[];const payment=I.payment>=0?String(r[I.payment]??'').trim():'';const partner=I.partner>=0?String(r[I.partner]??'').trim():'';
      if(!payment||!partner||!uuid(partner))continue;const info=settlementInfo(payment);if(!info){invalid++;continue;}
      rows.push({rowNo:i+1,transactionId:I.id>=0?String(r[I.id]??'').trim():'',recordDate:I.recordDate>=0?String(r[I.recordDate]??'').trim():'',
        recordValue:I.value>=0?money(r[I.value]):0,recordFee:I.fee>=0?money(r[I.fee]):0,merchant:I.merchant>=0?String(r[I.merchant]??'').trim():'',
        member:I.member>=0?String(r[I.member]??'').trim():'',paymentTime:payment,settlementRaw:I.settlement>=0?String(r[I.settlement]??'').trim():'',partnerId:partner,
        vendorId:I.vendor>=0?String(r[I.vendor]??'').trim():'',statusExcel:I.status>=0?String(r[I.status]??'').trim():'',ticket:I.ticket>=0?String(r[I.ticket]??'').trim():'',
        settlementType:info.type,settlementDate:info.settlementDate,paymentDate:info.paymentDate,sourceFile:fileName});
    }
    return {rows,invalid};
  }
  function settlementRowsFromSheet(data,fileName){
    const located=locateHeader(data,[['SETTLEMENT','SETTLEMENT DATE'],['PARTNER ID'],['RECORD VALUE','AMOUNT','VALUE']]);
    if(!located) throw new Error(`${fileName}: header SETTLEMENT / PARTNER ID / RECORD VALUE tidak ditemukan.`);
    const H=located.headers;const sIdx=headerIndex(H,['SETTLEMENT','SETTLEMENT DATE']);const pIdx=headerIndex(H,['PARTNER ID']);const aIdx=headerIndex(H,['RECORD VALUE','AMOUNT','VALUE']);
    const rows=[];const counts=new Map();
    for(let i=located.rowIndex+1;i<data.length;i++){
      const r=data[i]||[];const raw=String(r[sIdx]??'').trim();const d=parseSheetDate(raw);if(d)counts.set(d,(counts.get(d)||0)+1);
      const partner=String(r[pIdx]??'').trim();const amount=money(r[aIdx]);if(uuid(partner)&&amount>0)rows.push({rowNo:i+1,partnerId:partner,amount,settlementRaw:raw,settlementDate:d,sourceFile:fileName});
    }
    return {rows,dateCounts:counts,headerRow:located.rowIndex+1};
  }

  // ---------- TRANSACTION UPLOAD ----------
  $('transactionFile').addEventListener('change',async()=>{
    const files=[...$('transactionFile').files];
    $('transactionFileName').textContent=files.length?files.map(f=>f.name).join(' • '):'Pilih 2 file transaksi atau lebih';
    transactionRows=[];if(!files.length)return;status('transactionUploadStatus',`Membaca ${files.length} file...`,'wait');
    try{
      let invalid=0;const details=[];
      for(const file of files){const data=await readRows(file);const parsed=transactionRowsFromSheet(data,file.name);transactionRows.push(...parsed.rows);invalid+=parsed.invalid;details.push(`${file.name}: ${parsed.rows.length.toLocaleString('id-ID')} trx`);}
      if(!transactionRows.length)throw new Error('Tidak ada transaksi valid dari file yang dipilih.');
      status('transactionUploadStatus',`${files.length} file terbaca • ${transactionRows.length.toLocaleString('id-ID')} transaksi valid${invalid?` • ${invalid} PAYMENT invalid`:''}. ${details.join(' | ')}`,'ok');
    }catch(e){status('transactionUploadStatus',e.message,'err');}
  });

  $('uploadTransactionBtn').addEventListener('click',async()=>{
    const files=[...$('transactionFile').files];
    if(!files.length||!transactionRows.length){toast('Pilih dan baca file transaksi terlebih dahulu.','err');return;}
    const btn=$('uploadTransactionBtn'); setBusy(btn,true,'Uploading...');
    const batch=batchId();
    const uploadName=files.map(f=>f.name).join(' + ');
    try{
      let saved=0,totalNet=0;
      await chunked(transactionRows,80,async(chunk,start)=>{
        status('transactionUploadStatus',`Upload ${Math.min(start+chunk.length,transactionRows.length).toLocaleString('id-ID')} / ${transactionRows.length.toLocaleString('id-ID')}...`,'wait');
        const r=await api('upload_transactions_chunk',{method:'POST',body:{batchId:batch,filename:uploadName,rows:chunk}});
        saved+=Number(r.saved||0); totalNet+=Number(r.totalNet||0);
      });
      status('transactionUploadStatus',`✅ BERHASIL! ${saved.toLocaleString('id-ID')} records • Batch ${batch} • Total Net ${fmtRp(totalNet)}`,'ok');
      toast('Transaction berhasil disimpan di browser.','ok');
      await loadSummary();
    }catch(e){status('transactionUploadStatus',e.message,'err');toast(e.message,'err');}
    finally{setBusy(btn,false);}
  });

  // ---------- SETTLEMENT UPLOAD ----------
  $('settlementFile').addEventListener('change',async()=>{
    const files=[...$('settlementFile').files];
    $('settlementFileName').textContent=files.length?files.map(f=>f.name).join(' • '):'Pilih 1 atau beberapa file settlement';
    settlementRows=[];settlementDates=[];$('settlementDateSelect').innerHTML='<option value="">Membaca...</option>';if(!files.length)return;
    status('settlementUploadStatus',`Mendeteksi header + tanggal dari ${files.length} file...`,'wait');
    try{
      const counts=new Map();const details=[];
      for(const file of files){const data=await readRows(file);const parsed=settlementRowsFromSheet(data,file.name);settlementRows.push(...parsed.rows);for(const [d,c] of parsed.dateCounts)counts.set(d,(counts.get(d)||0)+c);details.push(`${file.name}: ${parsed.rows.length.toLocaleString('id-ID')} rows`);}
      settlementDates=[...counts.keys()].sort((a,b)=>(counts.get(b)||0)-(counts.get(a)||0));
      $('settlementDateSelect').innerHTML=settlementDates.length?settlementDates.map(d=>`<option value="${esc(d)}">${esc(d)} • ${(counts.get(d)||0).toLocaleString('id-ID')} records</option>`).join(''):'<option value="">Tanggal SETTLEMENT tidak ditemukan</option>';
      if(!settlementRows.length)throw new Error('Tidak ada PARTNER ID + amount valid pada file settlement.');
      if(!settlementDates.length)throw new Error('Kolom SETTLEMENT ditemukan, tetapi isi tanggalnya tidak dapat dibaca.');
      status('settlementUploadStatus',`${files.length} file terbaca • ${settlementRows.length.toLocaleString('id-ID')} data settlement • ${settlementDates.length} tanggal terdeteksi. ${details.join(' | ')}`,'ok');
    }catch(e){status('settlementUploadStatus',e.message,'err');}
  });

  $('uploadSettlementBtn').addEventListener('click',async()=>{
    const files=[...$('settlementFile').files];
    const settlementDate=$('settlementDateSelect').value;
    if(!files.length||!settlementRows.length||!settlementDate){toast('Pilih file dan tanggal settlement.','err');return;}
    const settlementUploadName=files.map(f=>f.name).join(' + ');
    const btn=$('uploadSettlementBtn'); setBusy(btn,true,'Uploading...');
    const batch=batchId();
    try{
      const start=await api('upload_settlement_start',{method:'POST',body:{batchId:batch,filename:settlementUploadName,settlementDate}});
      let saved=0,totalAmount=0;
      await chunked(settlementRows,100,async(chunk,index)=>{
        status('settlementUploadStatus',`Upload ${Math.min(index+chunk.length,settlementRows.length).toLocaleString('id-ID')} / ${settlementRows.length.toLocaleString('id-ID')}...`,'wait');
        const r=await api('upload_settlement_chunk',{method:'POST',body:{fileId:start.fileId,rows:chunk}});
        saved+=Number(r.saved||0); totalAmount+=Number(r.totalAmount||0);
      });
      const done=await api('upload_settlement_finish',{method:'POST',body:{batchId:batch,fileId:start.fileId,filename:settlementUploadName,settlementDate,totalRecords:saved,totalAmount}});
      status('settlementUploadStatus',`✅ BERHASIL! ${saved.toLocaleString('id-ID')} records untuk ${settlementDate}. Match ${done.comparison.match} • Mismatch ${done.comparison.mismatch}`,'ok');
      toast('Settlement berhasil disimpan di browser.','ok');
    }catch(e){status('settlementUploadStatus',e.message,'err');toast(e.message,'err');}
    finally{setBusy(btn,false);}
  });

  // ---------- BATCHES ----------
  async function loadBatches(){
    const div=$('batchList'); div.innerHTML=loading();
    try{
      const d=await api('get_batches');
      if(!d.batches?.length){div.innerHTML=empty('Tidak ada batch');return;}
      div.innerHTML=table(['Waktu','File','Type','Records','Amount','User','Aksi'],d.batches.map(b=>[
        formatTime(b.uploaded_at), esc(b.filename), badge(b.file_type),
        fmtNum(b.total_records), fmtRp(b.total_amount), esc(b.uploaded_by),
        `<button class="btn danger small" data-del-batch="${esc(b.batch_id)}" data-type="${esc(b.file_type)}">Hapus</button>`
      ]));
      div.querySelectorAll('[data-del-batch]').forEach(btn=>btn.addEventListener('click',async()=>{
        if(!confirm(`Hapus batch ${btn.dataset.delBatch}?`)) return;
        try{
          const r=await api('delete_batch',{method:'POST',body:{batchId:btn.dataset.delBatch,fileType:btn.dataset.type}});
          toast(`Terhapus ${r.deleted} records.`,'ok'); loadBatches(); loadSummary();
        }catch(e){toast(e.message,'err');}
      }));
    }catch(e){div.innerHTML=empty(e.message);}
  }

  // ---------- CHECK SETTLEMENT ----------
  $('checkSettlementBtn').addEventListener('click',checkSettlement);
  async function checkSettlement(){
    const date=$('checkDate').value;if(!date)return;
    const div=$('checkResult');div.innerHTML=loading();
    try{
      const d=await api('check_settlement',{params:{date}});
      let html=`<div class="summary-grid">
        ${sumBox(`Settlement • ${d.settlement_source_date}`,`${d.settlement_count} trx`,[['Cair',d.settlement_amount_formatted],['Value',d.settlement_value_formatted],['Fee',d.settlement_fee_formatted]],'#e8c45a')}
        ${sumBox(`Cutoff • ${d.cutoff_source_date}`,`${d.cutoff_count} trx`,[['Cair',d.cutoff_amount_formatted],['Value',d.cutoff_value_formatted],['Fee',d.cutoff_fee_formatted]],'#ec4899')}
        ${sumBox(`TOTAL CAIR • ${date}`,`${d.total_count} trx`,[['Cair',d.total_amount_formatted],['Value',d.total_value_formatted],['Fee',d.total_fee_formatted]],'#10b981')}
      </div>`;
      if(d.cutoff_today_count>0) html+=`<div class="summary-grid">${sumBox(`Cutoff Hari Ini • ${d.cutoff_today_date}`,`${d.cutoff_today_count} trx`,[['Estimasi Cair',d.cutoff_today_amount_formatted],['Cair tanggal',d.cutoff_today_cair_date]],'#94a3b8')}</div>`;
      if(d.transactions?.length){
        html+=table(['Tgl','Time','Merchant','Member','Partner ID','Value','Fee','Net','Type'],d.transactions.map(t=>[
          esc(t.payment_date),esc(t.payment_time),esc(t.merchant),esc(t.member),`<code>${esc(t.partner_id)}</code>`,
          esc(t.record_value_formatted),esc(t.record_fee_formatted),`<span class="amount-pos">${esc(t.net_amount_formatted)}</span>`,badge(t.settlement_type)
        ]));
      }else html+=empty('Tidak ada data untuk tanggal ini');
      div.innerHTML=html;
    }catch(e){div.innerHTML=empty(e.message);}
  }

  // ---------- COMPARISON ----------
  $('compareBtn').addEventListener('click',loadComparison);
  async function loadComparison(){
    const date=$('compareDate').value;if(!date)return;
    const div=$('compareResult');div.innerHTML=loading();
    try{
      const d=await api('get_comparison',{params:{date}});
      if(!d.data?.length){div.innerHTML=empty('Tidak ada data comparison');return;}
      const s=d.summary;
      div.innerHTML=`<div class="summary-grid">
        ${metric('✅ Match',s.match,'#10b981')}${metric('❌ Mismatch',s.mismatch,'#ef4444')}
        ${metric('⚠ Missing Bank',s.missing_bank,'#f59e0b')}${metric('⚠ Missing Sistem',s.missing_system,'#8b5cf6')}
        ${metric('Total Expected',fmtRp(s.total_expected),'#e8c45a')}${metric('Total Actual',fmtRp(s.total_actual),'#10b981')}
        ${metric('Selisih',fmtRp(s.total_diff),Math.abs(Number(s.total_diff))<.01?'#10b981':'#ef4444')}
      </div>`+table(['Partner ID','Expected','Actual','Selisih','Count','Status'],d.data.map(r=>[
        `<code>${esc(r.partner_id)}</code>`,fmtRp(r.expected_amount),fmtRp(r.actual_amount),
        `<span class="${Math.abs(Number(r.difference))<.01?'':'amount-neg'}">${fmtRp(r.difference)}</span>`,
        fmtNum(r.transaction_count),comparisonBadge(r.status)
      ]));
    }catch(e){div.innerHTML=empty(e.message);}
  }

  // ---------- ALL TRANSACTIONS ----------
  $('loadTransactionsBtn').addEventListener('click',loadTransactions);
  $('transactionSearch').addEventListener('input',renderTransactions);
  async function loadTransactions(){
    const div=$('transactionTable');div.innerHTML=loading();
    try{
      const d=await api('get_transactions');
      allTransactions=d.data||[];
      renderTransactions();
    }catch(e){div.innerHTML=empty(e.message);}
  }
  function renderTransactions(){
    const q=$('transactionSearch').value.trim().toLowerCase();
    const rows=(q?allTransactions.filter(r=>`${r.payment_time} ${r.merchant} ${r.member} ${r.partner_id}`.toLowerCase().includes(q)):allTransactions).slice(0,5000);
    $('transactionTable').innerHTML=rows.length?table(['Payment','Merchant','Member','Partner ID','Value','Fee','Net','Type','Settlement'],rows.map(r=>[
      esc(r.payment_time),esc(r.merchant),esc(r.member),`<code>${esc(r.partner_id)}</code>`,
      fmtRp(r.record_value),fmtRp(r.record_fee),`<span class="amount-pos">${fmtRp(r.net_amount)}</span>`,badge(r.settlement_type),esc(r.settlement_date)
    ])):empty('Tidak ada data');
  }

  // ---------- DISBURSEMENT UPLOAD ----------
  $('disbursementFile').addEventListener('change',async()=>{
    const file=$('disbursementFile').files[0];
    $('disbursementFileName').textContent=file?.name||'Pilih file disbursement';
    disbursementRows=[];
    if(!file)return;
    status('disbursementUploadStatus','Membaca file...','wait');
    try{
      const data=await readRows(file);
      if(data.length<2) throw new Error('File kosong atau tidak valid.');
      data.shift();
      disbursementRows=data.map((row,i)=>({
        rowNo:i+2,transactionId:String(row[0]??'').trim(),dateRaw:String(row[1]??'').trim(),
        bankCode:String(row[2]??'').trim(),bankNo:String(row[3]??'').trim(),accountName:String(row[4]??'').trim(),
        amount:money(row[5]),refId:String(row[6]??'').trim(),vendorStatus:String(row[8]??'').trim()
      })).filter(r=>r.refId);
      const ambiguous=disbursementRows.filter(r=>isAmbiguousDate(r.dateRaw)).length;
      status('disbursementUploadStatus',`${disbursementRows.length.toLocaleString('id-ID')} baris siap • ${ambiguous} tanggal ambiguous${ambiguous?' (pilih format tanggal)':''}.`,'ok');
    }catch(e){status('disbursementUploadStatus',e.message,'err');}
  });
  $('uploadDisbursementBtn').addEventListener('click',async()=>{
    const file=$('disbursementFile').files[0];if(!file||!disbursementRows.length){toast('Pilih file disbursement.','err');return;}
    const format=$('disbursementDateFormat').value;
    const parsed=[];let invalid=0;
    for(const r of disbursementRows){
      const d=parseFlexibleDate(r.dateRaw,format);
      if(!d||d==='AMBIGUOUS'){invalid++;continue;}
      parsed.push({...r,dateDisbursement:d});
    }
    if(invalid){toast(`${invalid} tanggal belum bisa diparse. Pilih format tanggal yang benar.`,'err');return;}
    const batch=batchId(),btn=$('uploadDisbursementBtn');setBusy(btn,true,'Uploading...');
    let ins=0,upd=0,changed=0,preserved=0;
    try{
      await chunked(parsed,70,async(chunk,start)=>{
        status('disbursementUploadStatus',`Upload ${Math.min(start+chunk.length,parsed.length)} / ${parsed.length}...`,'wait');
        const d=await api('upload_disbursement_chunk',{method:'POST',body:{batchId:batch,rows:chunk}});
        ins+=Number(d.inserted||0);upd+=Number(d.updated||0);changed+=Number(d.statusChanged||0);preserved+=Number(d.preservedDone||0);
      });
      await api('finish_disbursement_upload',{method:'POST',body:{batchId:batch,filename:file.name,totalRecords:ins+upd}});
      status('disbursementUploadStatus',`✅ BERHASIL! Insert ${ins} • Update ${upd} • Status Changed ${changed} • Done Preserved ${preserved} • Batch ${batch}`,'ok');
      toast('Disbursement berhasil di-upload.','ok');
      loadDisbursements();
    }catch(e){status('disbursementUploadStatus',e.message,'err');toast(e.message,'err');}
    finally{setBusy(btn,false);}
  });

  // ---------- DISBURSEMENT LIST ----------
  $('loadDisbursementsBtn').addEventListener('click',loadDisbursements);
  async function loadDisbursements(){
    const list=$('disbList');list.innerHTML=loading();$('disbSummary').innerHTML='';
    try{
      const d=await api('get_disbursements',{params:{date:$('disbDate').value,status:$('disbStatus').value,done:$('disbDone').value}});
      const s=d.summary||{};
      $('disbSummary').innerHTML=`<div class="summary-grid">
        ${metric('Total',s.total||0,'#e8c45a')}${metric('Pending',s.pending_count||0,'#f59e0b')}
        ${metric('Failed',s.failed_count||0,'#ef4444')}${metric('Success',s.success_count||0,'#10b981')}
        ${metric('Done',s.done_count||0,'#06b6d4')}
      </div>`;
      if(!d.data?.length){list.innerHTML=empty('Tidak ada data');return;}
      let body='';
      for(const r of d.data){
        body+=`<tr>
          <td><button class="btn ghost small log-toggle" data-ref="${esc(r.ref_id)}">Log</button></td>
          <td>${esc(r.date_formatted)}</td><td><code>${esc(r.transaction_id)}</code></td><td>${esc(r.bank_code)}</td>
          <td><code>${esc(r.bank_no)}</code></td><td>${esc(r.account_name)}</td><td class="amount-pos">${esc(r.amount_formatted)}</td>
          <td><span class="ref-copy" data-copy="${esc(r.ref_id)}">${esc(r.ref_id)}</span></td><td>${statusBadge(r)}</td>
          <td>${Number(r.status_done)===1?'<span class="badge badge-done">DONE</span>':'—'}</td></tr>
          <tr class="log-row" id="logrow-${safeId(r.ref_id)}"><td colspan="10"><div class="log-box" id="logs-${safeId(r.ref_id)}">Loading...</div></td></tr>`;
      }
      list.innerHTML=`<div class="table-wrap"><table><thead><tr><th></th><th>Tgl</th><th>ID</th><th>Bank</th><th>No. Rek</th><th>Nama</th><th>Amount</th><th>REF ID</th><th>Status</th><th>Done</th></tr></thead><tbody>${body}</tbody></table></div>`;
      list.querySelectorAll('[data-copy]').forEach(el=>el.addEventListener('click',()=>copyText(el.dataset.copy)));
      list.querySelectorAll('.log-toggle').forEach(el=>el.addEventListener('click',()=>toggleLogs(el.dataset.ref)));
    }catch(e){list.innerHTML=empty(e.message);}
  }
  async function toggleLogs(ref){
    const row=$(`logrow-${safeId(ref)}`),box=$(`logs-${safeId(ref)}`);
    const opening=!row.classList.contains('active');row.classList.toggle('active');
    if(opening&&!box.dataset.loaded){
      box.dataset.loaded='1';
      try{
        const d=await api('get_disbursement_logs',{params:{ref_id:ref}});
        box.innerHTML=d.logs?.length?d.logs.map(l=>`<div class="log-item"><span class="log-action">${esc(l.action_type)}</span>${l.field_name?`<span>${esc(l.field_name)}: ${esc(l.old_value||'—')} → ${esc(l.new_value||'—')}</span>`:''}<span>${esc(l.changed_by)}</span><span class="log-time">${esc(l.changed_at_formatted)}</span></div>`).join(''):'<span class="muted">Belum ada audit log</span>';
      }catch(e){box.textContent=e.message;}
    }
  }

  // ---------- MARK DONE ----------
  $('loadMarkBtn').addEventListener('click',loadMarkList);
  $('markDoneBtn').addEventListener('click',()=>applyMark('mark'));
  $('unmarkBtn').addEventListener('click',()=>applyMark('unmark'));
  async function loadMarkList(){
    selectedMarkIds.clear();updateBulkBar();
    const list=$('markList');list.innerHTML=loading();
    try{
      const d=await api('get_disbursements',{params:{date:$('markDate').value,status:$('markStatus').value,done:$('markDone').value}});
      if(!d.data?.length){list.innerHTML=empty('Tidak ada data');return;}
      list.innerHTML=`<label style="display:flex;gap:8px;align-items:center;margin-bottom:8px;font-size:11px"><input type="checkbox" id="selectAllMark"> Pilih Semua (${d.data.length})</label>`+
        table(['','Tgl','Bank','No. Rek','Nama','Amount','REF ID','Status','Done'],d.data.map(r=>[
          `<input type="checkbox" class="mark-cb" value="${r.id}">`,esc(r.date_formatted),esc(r.bank_code),`<code>${esc(r.bank_no)}</code>`,esc(r.account_name),
          esc(r.amount_formatted),`<span class="ref-copy" data-copy="${esc(r.ref_id)}">${esc(r.ref_id)}</span>`,statusBadge(r),
          Number(r.status_done)===1?'<span class="badge badge-done">DONE</span>':'—'
        ]));
      $('selectAllMark').addEventListener('change',e=>{
        list.querySelectorAll('.mark-cb').forEach(cb=>{cb.checked=e.target.checked; if(cb.checked)selectedMarkIds.add(Number(cb.value));else selectedMarkIds.delete(Number(cb.value));});updateBulkBar();
      });
      list.querySelectorAll('.mark-cb').forEach(cb=>cb.addEventListener('change',()=>{
        if(cb.checked)selectedMarkIds.add(Number(cb.value));else selectedMarkIds.delete(Number(cb.value));updateBulkBar();
      }));
      list.querySelectorAll('[data-copy]').forEach(el=>el.addEventListener('click',()=>copyText(el.dataset.copy)));
    }catch(e){list.innerHTML=empty(e.message);}
  }
  function updateBulkBar(){
    $('selectedCount').textContent=`${selectedMarkIds.size} dipilih`;
    $('bulkBar').classList.toggle('active',selectedMarkIds.size>0);
  }
  async function applyMark(action){
    if(!selectedMarkIds.size){toast('Pilih minimal 1 data.','err');return;}
    if(!confirm(`${action==='mark'?'Mark DONE':'Unmark'} ${selectedMarkIds.size} data?`))return;
    try{
      const d=await api('mark_disbursement_done',{method:'POST',body:{ids:[...selectedMarkIds],actionType:action}});
      toast(`${d.changed} data berhasil diproses.`,'ok');loadMarkList();loadDisbursements();
    }catch(e){toast(e.message,'err');}
  }

  // ---------- DISBURSEMENT BATCH ----------
  async function loadDisbursementBatches(){
    const div=$('disbBatchList');div.innerHTML=loading();
    try{
      const d=await api('get_disbursement_batches');
      if(!d.batches?.length){div.innerHTML=empty('Belum ada batch disbursement');return;}
      div.innerHTML=table(['Waktu','File','Records','User','Aksi'],d.batches.map(b=>[
        formatTime(b.uploaded_at),esc(b.filename),fmtNum(b.total_records),esc(b.uploaded_by),
        `<button class="btn danger small" data-del-disb="${esc(b.batch_id)}">Hapus</button>`
      ]));
      div.querySelectorAll('[data-del-disb]').forEach(btn=>btn.addEventListener('click',async()=>{
        if(!confirm('Hapus batch, marks, dan audit log terkait?'))return;
        try{const d=await api('delete_disbursement_batch',{method:'POST',body:{batchId:btn.dataset.delDisb}});toast(`Terhapus ${d.deleted} data.`,'ok');loadDisbursementBatches();}catch(e){toast(e.message,'err');}
      }));
    }catch(e){div.innerHTML=empty(e.message);}
  }

  // ---------- BALANCE ----------
  $('balanceFile').addEventListener('change',async()=>{
    const file=$('balanceFile').files[0];$('balanceFileName').textContent=file?.name||'Pilih file balance';balanceRows=[];
    if(!file)return;
    status('balanceUploadStatus','Membaca file...','wait');
    try{
      const data=await readRows(file);if(data.length<2)throw new Error('File kosong atau tidak valid.');data.shift();
      balanceRows=data.map((r,i)=>({
        rowNo:i+2,recordId:String(r[0]??'').trim(),dateCreated:parseBalanceDate(r[1]),note:String(r[2]??'').trim(),
        credit:money(r[3]),debit:money(r[4]),balance:money(r[5])
      })).filter(r=>r.recordId&&r.dateCreated);
      status('balanceUploadStatus',`${balanceRows.length.toLocaleString('id-ID')} baris valid siap di-upload.`,'ok');
    }catch(e){status('balanceUploadStatus',e.message,'err');}
  });
  $('uploadBalanceBtn').addEventListener('click',async()=>{
    const file=$('balanceFile').files[0];if(!file||!balanceRows.length){toast('Pilih file balance.','err');return;}
    const batch=batchId(),btn=$('uploadBalanceBtn');setBusy(btn,true,'Uploading...');
    let saved=0;
    try{
      await chunked(balanceRows,100,async(chunk,start)=>{
        status('balanceUploadStatus',`Upload ${Math.min(start+chunk.length,balanceRows.length)} / ${balanceRows.length}...`,'wait');
        const d=await api('upload_balance_chunk',{method:'POST',body:{batchId:batch,rows:chunk}});saved+=Number(d.saved||0);
      });
      status('balanceUploadStatus',`✅ BERHASIL! Insert ${saved} records • Batch ${batch}`,'ok');toast('Balance berhasil di-upload.','ok');loadBalance();
    }catch(e){status('balanceUploadStatus',e.message,'err');toast(e.message,'err');}
    finally{setBusy(btn,false);}
  });
  $('loadBalanceBtn').addEventListener('click',loadBalance);
  async function loadBalance(){
    const list=$('balanceList');list.innerHTML=loading();$('balanceSummary').innerHTML='';
    try{
      const d=await api('get_balance_history',{params:{date:$('balanceDate').value}});
      const s=d.summary;
      $('balanceSummary').innerHTML=`<div class="summary-grid">
        ${metric('Seluruh biaya',fmtRp(s.sum_credit),'#10b981')}${metric('Refund biaya',s.sum_debit_formatted,'#ef4444')}
        ${metric('🎯 Total Biaya × -1',s.total_biaya_formatted,s.total_biaya>=0?'#e8c45a':'#ef4444')}
        ${metric('Total Records',fmtNum(s.total_records),'#8b5cf6')}
        ${metric('Total Credit Semua',s.total_credit_all_formatted,'#06b6d4')}${metric('Total Debit Semua',s.total_debit_all_formatted,'#ef4444')}
      </div>`;
      if(!d.data?.length){list.innerHTML=empty('Tidak ada data');return;}
      list.innerHTML=table(['ID','Tanggal','Note','Credit','Debit','Balance'],d.data.map(r=>[
        `<code>${esc(r.record_id)}</code>`,esc(r.date_formatted),`<span style="white-space:normal">${esc(r.note)}</span>`,
        `<span class="${Number(r.credit)<0?'amount-neg':'amount-pos'}">${esc(r.credit_formatted)}</span>`,
        `<span class="${Number(r.debit)>0?'amount-neg':''}">${esc(r.debit_formatted)}</span>`,esc(r.balance_formatted)
      ]));
    }catch(e){list.innerHTML=empty(e.message);}
  }
  async function loadBalanceBatches(){
    const div=$('balanceBatchList');div.innerHTML=loading();
    try{
      const d=await api('get_balance_batches');if(!d.batches?.length){div.innerHTML=empty('Belum ada batch balance');return;}
      div.innerHTML=table(['Waktu','Batch ID','Records','User','Aksi'],d.batches.map(b=>[
        esc(b.uploaded_at_formatted),`<code>${esc(b.batch_id)}</code>`,fmtNum(b.total_records),esc(b.uploaded_by),
        `<button class="btn danger small" data-del-balance="${esc(b.batch_id)}">Hapus</button>`
      ]));
      div.querySelectorAll('[data-del-balance]').forEach(btn=>btn.addEventListener('click',async()=>{
        if(!confirm('Hapus batch balance ini?'))return;
        try{const d=await api('delete_balance_batch',{method:'POST',body:{batchId:btn.dataset.delBalance}});toast(`Terhapus ${d.deleted} records.`,'ok');loadBalanceBatches();}catch(e){toast(e.message,'err');}
      }));
    }catch(e){div.innerHTML=empty(e.message);}
  }

  // ---------- HELPERS ----------
  function table(headers,rows){
    return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function empty(text){return `<div class="empty">${esc(text)}</div>`;}
  function loading(){return '<div class="empty">Memuat data...</div>';}
  function metric(label,value,color){return `<div class="summary-item" style="border-left:4px solid ${color}"><div class="summary-label">${label}</div><div class="summary-value">${value}</div></div>`;}
  function sumBox(label,value,lines,color){return `<div class="summary-item" style="border-left:4px solid ${color}"><div class="summary-label">${label}</div><div class="summary-value">${value}</div>${lines.map(x=>`<div style="font-size:10px;color:var(--muted);margin-top:4px">${x[0]}: <b style="color:#fff">${x[1]}</b></div>`).join('')}</div>`;}
  function badge(type){
    const t=String(type||'').toUpperCase();
    const cls=t==='SETTLEMENT'?'badge-settlement':t==='CUTOFF'?'badge-cutoff':t==='TRANSACTION'?'badge-transaction':t==='DISBURSEMENT'?'badge-disbursement':'badge-settlement-file';
    return `<span class="badge ${cls}">${esc(t||'-')}</span>`;
  }
  function comparisonBadge(s){
    const v=String(s||'');
    if(v==='MATCH')return '<span class="badge badge-success">MATCH</span>';
    if(v==='MISMATCH')return '<span class="badge badge-failed">MISMATCH</span>';
    return `<span class="badge badge-pending">${esc(v)}</span>`;
  }
  function statusBadge(r){
    if(Number(r.status_done)===1)return '<span class="badge badge-done">DONE</span>';
    const s=String(r.vendor_status||'').toLowerCase();
    if(!s||s==='pending')return '<span class="badge badge-pending">PENDING</span>';
    if(s.includes('failed')||s.includes('refund'))return '<span class="badge badge-failed">FAILED - REFUND</span>';
    if(s==='success')return '<span class="badge badge-success">SUCCESS</span>';
    return `<span class="badge">${esc(r.vendor_status)}</span>`;
  }
  function safeId(s){return String(s||'').replace(/[^a-zA-Z0-9_-]/g,'_');}
  async function copyText(text){
    try{await navigator.clipboard.writeText(text);}catch(_){
      const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
    }
    toast('REF ID copied','ok');
  }
  function formatTime(v){
    const n=Number(v);
    if(Number.isFinite(n)&&n>0)return new Date(n).toLocaleString('id-ID');
    return String(v||'');
  }

  loadSummary();
})();