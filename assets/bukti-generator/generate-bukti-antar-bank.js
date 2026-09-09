// ======================== LOGIKA UTAMA (SESUAI SCRIPT PERTAMA) ========================
const displayTanggal = document.getElementById('displayTanggalWaktu');
const displayIdrNominal = document.getElementById('displayIdrNominal');
const displayNama = document.getElementById('displayNama');
const displayBank = document.getElementById('displayBank');
const displayRekening = document.getElementById('displayRekening');
const displayDariRekening = document.getElementById('displayDariRekening');
const displayNominal = document.getElementById('displayNominal');
const displayBiaya = document.getElementById('displayBiaya');
const displayLayanan = document.getElementById('displayLayanan');

const ctrlTanggal = document.getElementById('ctrlTanggal');
const ctrlWaktu = document.getElementById('ctrlWaktu');
const ctrlNama = document.getElementById('ctrlNama');
const ctrlBank = document.getElementById('ctrlBank');
const ctrlRekening = document.getElementById('ctrlRekening');
const ctrlDariRekening = document.getElementById('ctrlDariRekening');
const ctrlNominal = document.getElementById('ctrlNominal');
const ctrlBiaya = document.getElementById('ctrlBiaya');
const ctrlLayanan = document.getElementById('ctrlLayanan');

function convertToIndonesianDate(dateStr) {
    if (!dateStr) return "19 Mei 2026";
    let parts = dateStr.split('/');
    if (parts.length === 3) {
        let day = parts[0];
        let month = parseInt(parts[1], 10);
        let year = parts[2];
        const bulanIndo = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        if (month >= 1 && month <= 12) return `${day} ${bulanIndo[month-1]} ${year}`;
    }
    return dateStr;
}

function formatRupiah(angka) {
    let num = parseInt(angka.toString().replace(/[^0-9]/g, ''), 10) || 0;
    return 'IDR ' + num.toLocaleString('en-US') + '.00';
}

function updateStruk() {
    let tgl = ctrlTanggal.value;
    let waktu = ctrlWaktu.value;
    displayTanggal.innerText = `${convertToIndonesianDate(tgl)} ${waktu}`;
    let nominalFormatted = formatRupiah(ctrlNominal.value);
    let biayaFormatted = formatRupiah(ctrlBiaya.value);
    displayIdrNominal.innerText = nominalFormatted;
    displayNama.innerText = ctrlNama.value || "-";
    displayBank.innerText = ctrlBank.value || "-";
    displayRekening.innerText = ctrlRekening.value || "-";
    displayDariRekening.innerText = ctrlDariRekening.value || "-";
    displayLayanan.innerText = ctrlLayanan.value || "Realtime Online";
    displayNominal.innerText = nominalFormatted;
    displayBiaya.innerText = biayaFormatted;
}

const allControls = [ctrlTanggal, ctrlWaktu, ctrlNama, ctrlBank, ctrlRekening, ctrlDariRekening, ctrlNominal, ctrlBiaya, ctrlLayanan];
allControls.forEach(control => {
    control.addEventListener('input', updateStruk);
    control.addEventListener('change', updateStruk);
});

function getTodayDDMMYYYY() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
}

function resetToDefault() {
    ctrlTanggal.value = getTodayDDMMYYYY();
    ctrlWaktu.value = "00:00:00";
    ctrlNama.value = "Ahmad Fauzi";
    ctrlBank.value = "BCA";
    ctrlRekening.value = "1234567890";
    ctrlDariRekening.value = "123 456 789 / BCA";
    ctrlNominal.value = "750000";
    ctrlBiaya.value = "4500";
    ctrlLayanan.value = "Realtime Online";
    updateStruk();
    
    // Reset posisi struk
    setInitialStrukPosition();
}
document.getElementById('resetAllBtn').addEventListener('click', resetToDefault);

// ======================== SAVE KE PC - STRUK SAJA ========================
document.getElementById('saveToPcBtn').addEventListener('click', function() {
    const footerElement = document.getElementById('footerNote');
    const originalDisplay = footerElement.style.display;
    footerElement.style.display = 'none';
    
    const captureElement = document.getElementById('captureArea');
    const originalText = this.innerText;
    this.innerText = '⏳ Menyimpan...';
    this.disabled = true;
    
    setTimeout(() => {
        html2canvas(captureElement, { 
            scale: 3,
            backgroundColor: null,
            logging: false, 
            useCORS: true, 
            allowTaint: false,
            windowWidth: captureElement.scrollWidth,
            windowHeight: captureElement.scrollHeight
        })
        .then(canvas => {
            footerElement.style.display = originalDisplay;
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            link.download = `BCA_Transfer_${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            this.innerText = originalText;
            this.disabled = false;
        })
        .catch(error => {
            footerElement.style.display = originalDisplay;
            console.error('html2canvas error:', error);
            alert('Gagal menyimpan gambar. Error: ' + error.message);
            this.innerText = originalText;
            this.disabled = false;
        });
    }, 100);
});

// ======================== DRAG & ZOOM UNTUK STRUK ========================
const dragItem = document.getElementById('strukToSave');
let strukActive = false;
let strukX = 0, strukY = 0;
let strukStartX, strukStartY;
let strukScale = 1;
const minStrukScale = 0.4;
const maxStrukScale = 2.5;

function setStrukTransform() {
    dragItem.style.transform = `translate(${strukX}px, ${strukY}px) scale(${strukScale})`;
}

function strukDragStart(e) {
    if (e.type === 'mousedown') {
        strukStartX = e.clientX - strukX;
        strukStartY = e.clientY - strukY;
        strukActive = true;
        dragItem.style.cursor = 'grabbing';
        e.preventDefault();
        e.stopPropagation();
    }
}

function strukDragMove(e) {
    if (strukActive) {
        strukX = e.clientX - strukStartX;
        strukY = e.clientY - strukStartY;
        setStrukTransform();
    }
}

function strukDragEnd() {
    strukActive = false;
    dragItem.style.cursor = 'grab';
}

function strukWheel(e) {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    let newScale = strukScale + delta;
    newScale = Math.min(maxStrukScale, Math.max(minStrukScale, newScale));
    if (newScale !== strukScale) {
        const rect = dragItem.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const scaleFactor = newScale / strukScale;
        strukX = (strukX - mouseX) * scaleFactor + mouseX;
        strukY = (strukY - mouseY) * scaleFactor + mouseY;
        strukScale = newScale;
        setStrukTransform();
    }
}

let strukInitialDistance = 0, strukInitialScale = 1;

function strukTouchStart(e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        strukInitialDistance = Math.hypot(dx, dy);
        strukInitialScale = strukScale;
        strukActive = false;
    } else if (e.touches.length === 1) {
        strukStartX = e.touches[0].clientX - strukX;
        strukStartY = e.touches[0].clientY - strukY;
        strukActive = true;
    }
}

function strukTouchMove(e) {
    if (e.touches.length === 2 && strukInitialDistance > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDistance = Math.hypot(dx, dy);
        let newScale = strukInitialScale * (newDistance / strukInitialDistance);
        newScale = Math.min(maxStrukScale, Math.max(minStrukScale, newScale));
        if (newScale !== strukScale) {
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const rect = dragItem.getBoundingClientRect();
            const localX = centerX - rect.left;
            const localY = centerY - rect.top;
            const scaleFactor = newScale / strukScale;
            strukX = (strukX - localX) * scaleFactor + localX;
            strukY = (strukY - localY) * scaleFactor + localY;
            strukScale = newScale;
            setStrukTransform();
            strukInitialScale = newScale;
            strukInitialDistance = newDistance;
        }
    } else if (e.touches.length === 1 && strukActive) {
        strukX = e.touches[0].clientX - strukStartX;
        strukY = e.touches[0].clientY - strukStartY;
        setStrukTransform();
    }
}

function strukTouchEnd() {
    strukActive = false;
    strukInitialDistance = 0;
}

dragItem.addEventListener('mousedown', strukDragStart);
document.addEventListener('mousemove', strukDragMove);
document.addEventListener('mouseup', strukDragEnd);
dragItem.addEventListener('wheel', strukWheel, { passive: false });
dragItem.addEventListener('touchstart', strukTouchStart, { passive: false });
dragItem.addEventListener('touchmove', strukTouchMove, { passive: false });
dragItem.addEventListener('touchend', strukTouchEnd);

// Set posisi awal struk di tengah area
function setInitialStrukPosition() {
    strukX = 0;
    strukY = 0;
    strukScale = 1;
    setStrukTransform();
}

setTimeout(setInitialStrukPosition, 100);
window.addEventListener('resize', setInitialStrukPosition);

// Otomatis tanggal hari ini setiap kali HTML dibuka
ctrlTanggal.value = getTodayDDMMYYYY();

updateStruk();