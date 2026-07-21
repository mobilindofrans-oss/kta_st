// Surat Tugas Template & Logic

let anggotaDataList = [];

function initSurat() {
  const form = document.getElementById('suratForm');
  
  // Generate QR Code for Surat
  if (typeof QRCode !== 'undefined' && document.getElementById('qrcodeSurat')) {
    new QRCode(document.getElementById('qrcodeSurat'), {
      text: 'https://faktaaktualtv.net',
      width: 70,
      height: 70,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }
  
  // Load dropdown from database
  loadNamaDropdown();
  
  // Handle form input for real-time preview
  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', updateSuratPreview);
  });
  
  // Handle nama select change - auto-fill other fields
  document.getElementById('namaSurat').addEventListener('change', onNamaSelect);
  
  // Handle print button (jika ada)
  const printBtn = document.getElementById('printSurat');
  if (printBtn) printBtn.addEventListener('click', printSurat);
  
  // Handle export PDF button
  document.getElementById('exportSurat').addEventListener('click', exportSuratPDF);
  
  // Handle save button
  document.getElementById('saveSurat').addEventListener('click', saveSurat);
}

async function loadNamaDropdown() {
  try {
    const anggotaList = await getSemuaAnggota();
    anggotaDataList = anggotaList;
    const select = document.getElementById('namaSurat');
    
    select.innerHTML = '<option value="">-- Pilih Nama --</option>';
    
    anggotaList.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.nama;
      select.appendChild(option);
    });
  } catch (e) {
    console.error('Gagal load dropdown:', e);
  }
}

function getSelectedAnggota() {
  const select = document.getElementById('namaSurat');
  const id = parseInt(select.value);
  if (!isNaN(id)) {
    return anggotaDataList.find(a => a.id === id) || null;
  }
  return null;
}

function onNamaSelect(e) {
  const anggota = getSelectedAnggota();
  
  if (anggota) {
    document.getElementById('jabatanSurat').value = anggota.jabatan || '';
    document.getElementById('noIdSurat').value = anggota.noId || '';
    document.getElementById('masaBerlakuSurat').value = anggota.masaBerlaku || '';
    
    if (anggota.foto) {
      currentFoto = anggota.foto;
    }
  } else {
    document.getElementById('jabatanSurat').value = '';
    document.getElementById('noIdSurat').value = '';
    document.getElementById('masaBerlakuSurat').value = '';
  }
  
  updateSuratPreview();
}

function updateSuratPreview() {
  const namaSelect = document.getElementById('namaSurat');
  const selectedOption = namaSelect.options[namaSelect.selectedIndex];
  const nama = selectedOption && selectedOption.value ? selectedOption.textContent : '................................';
  const jabatan = document.getElementById('jabatanSurat').value || '-';
  const noId = document.getElementById('noIdSurat').value || '-';
  const masaBerlaku = document.getElementById('masaBerlakuSurat').value || '-';
  const nomorSurat = document.getElementById('nomorSurat').value || '-';
  
  // Update preview
  document.getElementById('previewNamaSurat').textContent = nama;
  document.getElementById('previewNomorSurat').textContent = nomorSurat;
  document.getElementById('previewJabatanSurat').textContent = jabatan;
  document.getElementById('previewNoIdSurat').textContent = noId;
  document.getElementById('previewMasaBerlakuSurat').textContent = masaBerlaku;

  const now = new Date();
  document.getElementById('previewTanggalSurat').textContent = formatTanggal(now.toISOString().split('T')[0]);

  // Foto dari KTA
  const fotoSurat = document.getElementById('previewFotoSurat');
  const fotoPlaceholder = document.getElementById('previewFotoSuratPlaceholder');
  if (fotoSurat && fotoPlaceholder && typeof currentFoto !== 'undefined' && currentFoto) {
    fotoSurat.style.backgroundImage = 'url(' + currentFoto + ')';
    fotoSurat.style.display = 'block';
    fotoPlaceholder.style.display = 'none';
  }
}

function formatTanggal(tanggal) {
  if (!tanggal) return '__ / __ / ____';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const parts = tanggal.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${months[month]} ${year}`;
}

async function saveSurat() {
  const anggota = getSelectedAnggota();
  const nama = anggota ? anggota.nama : '';
  const jabatan = document.getElementById('jabatanSurat').value;
  const noId = document.getElementById('noIdSurat').value;
  const masaBerlaku = document.getElementById('masaBerlakuSurat').value;
  const nomorSurat = document.getElementById('nomorSurat').value;
  
  if (!nama) {
    showToast('Mohon pilih Nama Lengkap!', 'warning');
    return;
  }
  
  const surat = {
    nama: nama,
    jabatan: jabatan,
    noId: noId,
    masaBerlaku: masaBerlaku,
    nomorSurat: nomorSurat,
    foto: typeof currentFoto !== 'undefined' ? currentFoto : null
  };
  
  const editId = document.getElementById('suratForm').dataset.editId;
  
  try {
    if (editId) {
      await updateSurat(Number(editId), surat);
      showToast('Data surat berhasil diupdate!', 'success');
      document.getElementById('suratForm').removeAttribute('data-edit-id');
      document.getElementById('saveSurat').innerHTML = '<i class="fas fa-save"></i> Simpan';
    } else {
      await tambahSurat(surat);
      showToast('Data surat berhasil disimpan!', 'success');
    }
    resetSuratForm();
    loadSavedData();
  } catch (error) {
    showToast('Gagal menyimpan data: ' + error.message, 'error');
  }
}

function resetSuratForm() {
  document.getElementById('suratForm').reset();
  updateSuratPreview();
}

function printSurat() {
  const suratContent = document.getElementById('suratTemplate');
  
  // Clone content and replace background-image divs with img elements for print compatibility
  const clone = suratContent.cloneNode(true);
  const fotoDiv = clone.querySelector('#previewFotoSurat');
  const fotoPlaceholder = clone.querySelector('#previewFotoSuratPlaceholder');
  if (fotoDiv && fotoDiv.style.backgroundImage) {
    const src = fotoDiv.style.backgroundImage.slice(5, -2); // extract url(...)
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    fotoDiv.parentNode.replaceChild(img, fotoDiv);
    if (fotoPlaceholder) fotoPlaceholder.remove();
  } else if (fotoPlaceholder) {
    fotoPlaceholder.style.display = 'block';
    if (fotoDiv) fotoDiv.remove();
  }

  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cetak Surat Tugas</title>
      <style>
        @page {
          size: A4;
          margin: 10mm 18mm 15mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12px;
          line-height: 1.5;
          color: #000;
          background: #fff;
          display: flex;
          justify-content: center;
          padding: 0;
        }
        
        .surat-paper {
          background: white;
          width: 210mm;
          min-height: 297mm;
          padding: 5px 40px;
          box-shadow: none;
        }
        
        .kop-surat { text-align:center; }
        .kop-surat img { height:80px; }
        .surat-title { text-align:center; }
        .surat-title h2 { margin:0; font-size:14pt; }
        .surat-title p { margin:0 0 6px 0; font-size:12px; }
        .content { text-align:justify; }
        .content p { margin-bottom:8px; text-indent:30px; font-size:12px; }
        .highlight { font-weight:bold; text-decoration:underline; }
        table { margin:8px 0; width:100%; border-collapse:collapse; }
        table td { padding:1px 0; vertical-align:top; font-size:12px; }
        
        @media print {
          body { background: none; padding: 0; }
          .surat-paper { box-shadow: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      ${clone.outerHTML}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

async function exportSuratPDF() {
  const element = document.getElementById('suratTemplate');
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    
    const anggota = getSelectedAnggota();
    const nama = anggota ? anggota.nama : 'tugas';
    
    pdf.save('Surat_Tugas_' + nama + '.pdf');
    
    showToast('PDF berhasil di-download!', 'success');
  } catch (error) {
    showToast('Gagal export PDF: ' + error.message, 'error');
  }
}
