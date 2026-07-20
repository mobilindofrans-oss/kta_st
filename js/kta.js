// KTA Template & Logic
let currentFoto = null;

// Initialize KTA form
function initKTA() {
  const form = document.getElementById('ktaForm');
  const fotoInput = document.getElementById('fotoInput');
  
  // Generate QR Code
  generateQRCode();
  
  // Handle foto upload
  fotoInput.addEventListener('change', handleFotoUpload);
  
  // Handle form input for real-time preview
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updateKTAPreview);
  });
  
  // Handle export PDF button
  document.getElementById('exportKTA').addEventListener('click', exportKTAPDF);
  
  // Handle save button
  document.getElementById('saveKTA').addEventListener('click', saveKTA);
}

function generateQRCode() {
  if (typeof QRCode === 'undefined') return;
  const qrcodeContainer = document.getElementById('qrcode');
  if (qrcodeContainer) {
    new QRCode(qrcodeContainer, {
      text: 'https://faktaaktualtv.net',
      width: 90,
      height: 90,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }
}

function handleFotoUpload(e) {
  const file = e.target.files[0];
  const label = document.getElementById('fotoLabel');
  const fileName = file ? file.name : null;
  
  if (file) {
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file terlalu besar! Maksimal 2MB.', 'error');
      e.target.value = '';
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar!', 'error');
      e.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
      currentFoto = event.target.result;
      updateKTAPreview();
      
      // Update label
      label.classList.add('has-file');
      label.querySelector('.form-file-text strong').textContent = fileName;
      label.querySelector('.form-file-text span').textContent = formatFileSize(file.size);
    };
    reader.readAsDataURL(file);
  } else {
    // Reset label
    label.classList.remove('has-file');
    label.querySelector('.form-file-text strong').textContent = 'Pilih foto';
    label.querySelector('.form-file-text span').textContent = 'JPG, PNG (Maks. 2MB)';
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function updateKTAPreview() {
  const nama = document.getElementById('namaKTA').value || 'NAMA ANGGOTA';
  const noId = document.getElementById('noIdKTA').value || '-';
  const jabatan = document.getElementById('jabatanKTA').value || '-';
  const masaBerlaku = document.getElementById('masaBerlaku').value || '-';
  
  document.getElementById('previewNama').textContent = nama;
  document.getElementById('previewNoId').textContent = noId;
  document.getElementById('previewJabatan').textContent = jabatan;
  document.getElementById('previewMasaBerlaku').textContent = masaBerlaku;
  
  const previewFoto = document.getElementById('previewFoto');
  if (currentFoto) {
    previewFoto.src = currentFoto;
    previewFoto.style.display = 'block';
    document.getElementById('previewFotoPlaceholder').style.display = 'none';
  }
}

async function saveKTA() {
  const nama = document.getElementById('namaKTA').value;
  const noId = document.getElementById('noIdKTA').value;
  const jabatan = document.getElementById('jabatanKTA').value;
  const masaBerlaku = document.getElementById('masaBerlaku').value;
  
  if (!nama || !noId || !jabatan || !masaBerlaku) {
    showToast('Mohon isi semua field!', 'warning');
    return;
  }
  
  const anggota = {
    nama: nama,
    noId: noId,
    jabatan: jabatan,
    masaBerlaku: masaBerlaku,
    foto: currentFoto
  };
  
  const editId = document.getElementById('ktaForm').dataset.editId;
  
  try {
    if (editId) {
      await updateAnggota(Number(editId), anggota);
      showToast('Data berhasil diupdate!', 'success');
      delete document.getElementById('ktaForm').dataset.editId;
      document.getElementById('saveKTA').innerHTML = '<i class="fas fa-save"></i> Simpan';
    } else {
      await tambahAnggota(anggota);
      showToast('Data berhasil disimpan!', 'success');
    }
    resetKTAForm();
    loadSavedData();
  } catch (error) {
    showToast('Gagal menyimpan data: ' + error.message, 'error');
  }
}

function resetKTAForm() {
  document.getElementById('ktaForm').reset();
  currentFoto = null;
  document.getElementById('previewFoto').style.display = 'none';
  document.getElementById('previewFotoPlaceholder').style.display = 'block';
  const label = document.getElementById('fotoLabel');
  label.classList.remove('has-file');
  label.querySelector('.form-file-text strong').textContent = 'Pilih foto';
  label.querySelector('.form-file-text span').textContent = 'JPG, PNG (Maks. 2MB)';
  updateKTAPreview();
}

async function exportKTAPDF() {
  const nama = document.getElementById('namaKTA').value;
  const noId = document.getElementById('noIdKTA').value;
  const jabatan = document.getElementById('jabatanKTA').value;
  const masaBerlaku = document.getElementById('masaBerlaku').value;

  if (!nama || !noId || !jabatan || !masaBerlaku) {
    showToast('Isi semua field terlebih dahulu!', 'warning');
    return;
  }

  const element = document.getElementById('ktaTemplate');

  try {
    // Auto-save before PDF
    const anggota = { nama, noId, jabatan, masaBerlaku, foto: currentFoto };
    const editId = document.getElementById('ktaForm').dataset.editId;

    if (editId) {
      await updateAnggota(Number(editId), anggota);
      delete document.getElementById('ktaForm').dataset.editId;
      document.getElementById('saveKTA').innerHTML = '<i class="fas fa-save"></i> Simpan';
    } else {
      await tambahAnggota(anggota);
    }
    loadSavedData();

    // Capture the KTA card
    const capturedCanvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true
    });

    // Create final canvas with exact size
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 520; // 260 * 2
    finalCanvas.height = 800; // 400 * 2
    const ctx = finalCanvas.getContext('2d');
    
    // Draw captured content
    ctx.drawImage(capturedCanvas, 0, 0);

    // If photo exists, redraw it at correct size
    if (currentFoto) {
      const photoElement = document.querySelector('#ktaTemplate .kta-photo');
      if (photoElement) {
        const photoRect = photoElement.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        const photoX = (photoRect.left - elementRect.left) * 2;
        const photoY = (photoRect.top - elementRect.top) * 2;
        const photoW = 200 * 2; // 200px width
        const photoH = 160 * 2; // 160px height
        
        const img = new Image();
        img.src = currentFoto;
        await new Promise((resolve) => { img.onload = resolve; });
        
        // Draw photo to fill the container
        ctx.drawImage(img, photoX, photoY, photoW, photoH);
      }
    }

    const imgData = finalCanvas.toDataURL('image/png');

    // Preview ratio: 260px x 400px = 69.1mm x 105.8mm
    const pdfWidth = 69.1;
    const pdfHeight = 105.8;
    
    const pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('KTA_' + (nama || 'anggota') + '.pdf');

    resetKTAForm();
    showToast('Data tersimpan & PDF berhasil di-download!', 'success');
  } catch (error) {
    showToast('Gagal: ' + error.message, 'error');
  }
}
