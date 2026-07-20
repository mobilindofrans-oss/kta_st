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
    // Tampilkan loading indicator (opsional, menggunakan SweetAlert2 jika aktif)
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Memproses PDF...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });
    }

    // Auto-save sebelum PDF
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

    // PERBAIKAN UTAMA: Pastikan semua gambar di dalam KTA benar-benar selesai dimuat sebelum dicapture
    const images = element.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.src && !img.complete) {
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }
      return Promise.resolve();
    });
    
    await Promise.all(imagePromises);

    // Capture KTA dengan konfigurasi optimasi render objek gambar
    const canvas = await html2canvas(element, {
      scale: 3, // Ditingkatkan ke 3 untuk ketajaman teks dan gambar yang lebih tinggi
      useCORS: true,
      logging: false,
      allowTaint: false, // Diubah ke false jika menggunakan useCORS agar tidak mengotori canvas
      imageTimeout: 0,   // Menghilangkan batasan waktu tunggu muat gambar
      backgroundColor: null // Menjaga transparansi atau warna dasar bawaan CSS
    });

    const imgData = canvas.toDataURL('image/png');

    // Preview ratio: 260px x 400px = 69.1mm x 105.8mm
    const pdfWidth = 69.1;
    const pdfHeight = 105.8;
    
    // Gunakan pustaka jspdf dari window object global (sesuai impor UMD di HTML)
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    // Masukkan gambar canvas ke dokumen PDF
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save('KTA_' + (nama.replace(/\s+/g, '_') || 'anggota') + '.pdf');

    if (typeof Swal !== 'undefined') { Swal.close(); }
    
    resetKTAForm();
    showToast('Data tersimpan & PDF berhasil di-download!', 'success');
  } catch (error) {
    if (typeof Swal !== 'undefined') { Swal.close(); }
    showToast('Gagal mencetak PDF: ' + error.message, 'error');
  }
}
