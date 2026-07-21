// KTA Template & Logic

// Initialize KTA form
function initKTA() {
  const form = document.getElementById('ktaForm');
  const fotoInput = document.getElementById('fotoInput');
  
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
      document.getElementById('ktaForm').removeAttribute('data-edit-id');
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

    // Capture KTA card
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');

    // CR80 portrait: 53.98mm x 85.6mm (standar kartu identitas)
    // Sesuaikan dengan rasio asli card (260x400)
    const cardWidth = 260;
    const cardHeight = 400;
    const pdfWidth = 53.98;
    const pdfHeight = pdfWidth * (cardHeight / cardWidth);
    
    const pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('KTA_' + (nama.replace(/\s+/g, '_') || 'anggota') + '.pdf');

    if (typeof Swal !== 'undefined') { Swal.close(); }
    
    showToast('PDF berhasil di-download!', 'success');
  } catch (error) {
    if (typeof Swal !== 'undefined') { Swal.close(); }
    showToast('Gagal mencetak PDF: ' + error.message, 'error');
  }
}
