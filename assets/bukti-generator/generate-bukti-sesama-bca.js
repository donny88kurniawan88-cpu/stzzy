const ids=['Tanggal','Waktu','Nama','Rekening','Jenis','MataTujuan','Dari','MataAsal','Nominal','Berita','Referensi'];
const $=id=>document.getElementById(id);
function convertToIndonesianDate(dateStr){if(!dateStr)return'';const p=dateStr.split('/');if(p.length===3){const b=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];const m=parseInt(p[1],10);if(m>=1&&m<=12)return ${p[0]} ${b[m-1]} ${p[2]}}return dateStr}
function formatRupiah(v){let n=parseInt(String(v).replace(/[^0-9]/g,''),10)||0;return 'IDR '+n.toLocaleString('en-US')+'.00'}
function update(){
$('displayTanggalWaktu').innerText=${convertToIndonesianDate($('ctrlTanggal').value)} ${$('ctrlWaktu').value};
$('displayNama').innerText=$('ctrlNama').value||'-';
$('displayRekening').innerText=$('ctrlRekening').value||'-';
$('displayJenis').innerText=$('ctrlJenis').value||'-';
$('displayMataTujuan').innerText=$('ctrlMataTujuan').value||'-';
$('displayDari').innerText=$('ctrlDari').value||'-';
$('displayMataAsal').innerText=$('ctrlMataAsal').value||'-';
const nominal=formatRupiah($('ctrlNominal').value);$('displayNominal').innerText=nominal;$('displayIdrNominal').innerText=nominal;
$('displayBerita').innerText=$('ctrlBerita').value||'-';$('displayReferensi').innerText=$('ctrlReferensi').value||'-';
}
['ctrlTanggal','ctrlWaktu','ctrlNama','ctrlRekening','ctrlJenis','ctrlMataTujuan','ctrlDari','ctrlMataAsal','ctrlNominal','ctrlBerita','ctrlReferensi'].forEach(id=>{$(id).addEventListener('input',update);$(id).addEventListener('change',update)});
function randomInt(max){
    if(window.crypto && window.crypto.getRandomValues){
        const arr=new Uint32Array(1);
        window.crypto.getRandomValues(arr);
        return arr[0] % max;
    }
    return Math.floor(Math.random()*max);
}
function randomDigit(){
    return String(randomInt(10));
}
function randomLetter(){
    const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[randomInt(letters.length)];
}
function randomReference(){
    const pattern='881B3DD8- 5H88- 2NF8- BC88- FFSDSSDS4564654';
    let result='';
    for(const ch of pattern){
        if(/[0-9]/.test(ch)){
            result += randomDigit();
        }else if(/[A-Z]/i.test(ch)){
            result += randomLetter();
        }else{
            result += ch;
        }
    }
    return result;
}
function randomMaskedAccount(){
    const d=()=>randomInt(10);
    return ${d()}${d()}${d()} - ${d()}** - **${d()}${d()};
}
function todayDDMMYYYY(){
    const now=new Date();
    const dd=String(now.getDate()).padStart(2,'0');
    const mm=String(now.getMonth()+1).padStart(2,'0');
    return ${dd}/${mm}/${now.getFullYear()};
}
function applyDynamicDefaults(){
    $('ctrlTanggal').value=todayDDMMYYYY();
    $('ctrlDari').value=randomMaskedAccount();
    $('ctrlReferensi').value=randomReference();
}
function resetToDefaults(){
    const defaults={
        ctrlWaktu:'17:05:12',
        ctrlNama:'Samuel',
        ctrlRekening:'123 - 456 - 7891',
        ctrlJenis:'Transfer ke rekening',
        ctrlMataTujuan:'IDR - Indonesian Rupiah',
        ctrlMataAsal:'IDR - Indonesian Rupiah',
        ctrlNominal:'50000',
        ctrlBerita:'-'
    };
    Object.entries(defaults).forEach(([id,v])=>$(id).value=v);
    applyDynamicDefaults();
    update();
}
$('resetAllBtn').addEventListener('click',resetToDefaults);

/* =========================================================
   DRAG + UBAH UKURAN DENGAN SCROLL MOUSE
   - Drag: pindah posisi struk
   - Scroll: ubah ukuran struk
   - Lebih tajam karena ukuran dibuat ulang lewat CSS variable,
     bukan dengan transform scale pada seluruh kartu.
   ========================================================= */
const struk = $('strukToSave');
let cardScale = 1;
let posX = 0;
let posY = 0;
let dragging = false;
let startX = 0;
let startY = 0;
let baseX = 0;
let baseY = 0;

function applyCardView(){
    document.documentElement.style.setProperty('--card-scale', String(cardScale));
    struk.style.left = posX + 'px';
    struk.style.top = posY + 'px';
}

/* scroll ke atas = besar, ke bawah = kecil */
struk.addEventListener('wheel', function(e){
    e.preventDefault();
    const step = 0.05;
    cardScale += (e.deltaY < 0 ? step : -step);
    cardScale = Math.max(0.7, Math.min(1.8, Math.round(cardScale * 100) / 100));
    applyCardView();
}, {passive:false});

/* drag seluruh struk */
struk.addEventListener('pointerdown', function(e){
    if(e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    baseX = posX;
    baseY = posY;
    struk.classList.add('dragging');
    try{ struk.setPointerCapture(e.pointerId); }catch(_){}
});

struk.addEventListener('pointermove', function(e){
    if(!dragging) return;
    posX = baseX + (e.clientX - startX);
    posY = baseY + (e.clientY - startY);
    applyCardView();
});

function endDrag(e){
    if(!dragging) return;
    dragging = false;
    struk.classList.remove('dragging');
    try{
        if(struk.hasPointerCapture(e.pointerId)){
            struk.releasePointerCapture(e.pointerId);
        }
    }catch(_){}
}
struk.addEventListener('pointerup', endDrag);
struk.addEventListener('pointercancel', endDrag);

$('resetViewBtn').addEventListener('click', function(){
    cardScale = 1;
    posX = 0;
    posY = 0;
    applyCardView();
});

applyCardView();

$('saveToPcBtn').addEventListener('click',function(){
    const btn=this,old=btn.innerText;
    btn.innerText='⏳ Menyimpan...';
    btn.disabled=true;

    /* Simpan posisi layar saat ini */
    const oldLeft = struk.style.left;
    const oldTop = struk.style.top;

    /* Saat export, posisinya dinormalkan agar PNG rapi */
    struk.style.left = '0px';
    struk.style.top = '0px';

    html2canvas(struk,{
        scale:4,
        backgroundColor:null,
        logging:false,
        useCORS:true
    })
    .then(canvas=>{
        const a=document.createElement('a');
        a.download='Template_Transaksi_HD.png';
        a.href=canvas.toDataURL('image/png');
        a.click();

        struk.style.left = oldLeft;
        struk.style.top = oldTop;
        btn.innerText=old;
        btn.disabled=false;
    })
    .catch(e=>{
        struk.style.left = oldLeft;
        struk.style.top = oldTop;
        alert('Gagal menyimpan: '+e.message);
        btn.innerText=old;
        btn.disabled=false;
    });
});
applyDynamicDefaults();
update();
