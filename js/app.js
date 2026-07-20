// Main App Logic

// Toast system
function showToast(message, type) {
  if (typeof Swal !== 'undefined') {
    Swal.fire({ toast: true, position: 'bottom-end', showConfirmButton: false, timer: 2500, timerProgressBar: true, customClass: { popup: 'swal-toast-sm' }, icon: type || 'info', title: message });
  } else {
    alert(message);
  }
}

// Tab navigation
let currentTab = 'kta';

async function initApp() {
  try {
    // Tunggu database siap
    if (typeof db !== 'undefined' && db !== null) {
      await db.open();
    }
    
    // Setup tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });
    
    // Initialize modules
    initKTA();
    initSurat();
    await loadSavedData();
  } catch (e) {
    console.error('Init error:', e);
  }
}

function switchTab(tab) {
  currentTab = tab;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tab}`);
  });
}

async function loadSavedData() {
  try {
    // Tunggu database siap
    if (typeof db !== 'undefined' && db !== null) {
      await db.open();
    }
    
    const anggota = await getSemuaAnggota();
    const surat = await getSemuaSurat();
    
    renderAnggotaTable(anggota);
    renderSuratTable(surat);
    
    // Refresh dropdown nama di Surat Tugas
    if (typeof loadNamaDropdown === 'function') {
      loadNamaDropdown();
    }
  } catch (error) {
    console.error('Gagal load data:', error);
  }
}

function renderAnggotaTable(anggota) {
  const grid = document.getElementById('anggotaCardGrid');
  grid.innerHTML = '';
  
  if (anggota.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="empty-state-text">Belum ada data anggota</div>
      </div>
    `;
    return;
  }
  
  anggota.forEach(item => {
    const card = document.createElement('div');
    card.className = 'data-card';
    card.innerHTML = `
      <div class="data-card-top">
        ${item.foto ? '<div class="data-card-foto"><img src="' + item.foto + '"></div>' : '<div class="data-card-foto data-card-foto-empty"><i class="fas fa-user"></i></div>'}
        <div class="data-card-info">
          <div class="data-card-nama">${item.nama}</div>
          <div class="data-card-id">${item.noId || '-'}</div>
        </div>
      </div>
      <div class="data-card-detail">
        <div class="data-card-detail-row">
          <span class="data-card-label">Jabatan</span>
          <span class="data-card-value">${item.jabatan || '-'}</span>
        </div>
        <div class="data-card-detail-row">
          <span class="data-card-label">Masa Berlaku</span>
          <span class="data-card-value">${item.masaBerlaku}</span>
        </div>
      </div>
      <div class="data-card-actions">
        <button class="btn btn-sm btn-outline" onclick="editAnggota(${item.id})">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-sm btn-outline btn-danger" onclick="confirmHapusAnggota(${item.id})">
          <i class="fas fa-trash"></i> Hapus
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderSuratTable(surat) {
  const grid = document.getElementById('suratCardGrid');
  grid.innerHTML = '';
  
  if (surat.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fas fa-file-alt"></i>
        </div>
        <div class="empty-state-text">Belum ada data surat tugas</div>
      </div>
    `;
    return;
  }
  
  surat.forEach(item => {
    const card = document.createElement('div');
    card.className = 'data-card';
    card.innerHTML = `
      <div class="data-card-top">
        <div class="data-card-icon">
          <i class="fas fa-file-alt"></i>
        </div>
        <div class="data-card-info">
          <div class="data-card-nama">${item.nama}</div>
          <div class="data-card-id">${item.nomorSurat || '-'}</div>
        </div>
      </div>
      <div class="data-card-detail">
        <div class="data-card-detail-row">
          <span class="data-card-label">Jabatan</span>
          <span class="data-card-value">${item.jabatan || '-'}</span>
        </div>
        <div class="data-card-detail-row">
          <span class="data-card-label">Masa Berlaku</span>
          <span class="data-card-value">${item.masaBerlaku || '-'}</span>
        </div>
      </div>
      <div class="data-card-actions">
        <button class="btn btn-sm btn-outline" onclick="editSurat(${item.id})">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-sm btn-outline btn-danger" onclick="confirmHapusSurat(${item.id})">
          <i class="fas fa-trash"></i> Hapus
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function editAnggota(id) {
  const anggota = await getAnggotaById(id);
  if (!anggota) return;
  
  // Switch to KTA tab
  switchTab('kta');
  
  // Fill form
  document.getElementById('namaKTA').value = anggota.nama;
  document.getElementById('noIdKTA').value = anggota.noId || '';
  document.getElementById('jabatanKTA').value = anggota.jabatan || '';
  document.getElementById('masaBerlaku').value = anggota.masaBerlaku;
  
  if (anggota.foto) {
    currentFoto = anggota.foto;
    const previewFoto = document.getElementById('previewFoto');
    previewFoto.src = anggota.foto;
    previewFoto.style.display = 'block';
    document.getElementById('previewFotoPlaceholder').style.display = 'none';
    
    // Update file label
    const label = document.getElementById('fotoLabel');
    label.classList.add('has-file');
    label.querySelector('.form-file-text strong').textContent = 'Foto tersimpan';
    label.querySelector('.form-file-text span').textContent = 'Klik untuk mengganti';
  }
  
  updateKTAPreview();
  
  // Store editing id
  document.getElementById('ktaForm').dataset.editId = id;
  
  // Change save button text
  document.getElementById('saveKTA').innerHTML = '<i class="fas fa-sync"></i> Update';
}

async function editSurat(id) {
  const surat = await getSuratById(id);
  if (!surat) return;
  
  // Switch to Surat tab
  switchTab('surat');
  
  // Find matching option in dropdown by nama
  const namaSelect = document.getElementById('namaSurat');
  for (let i = 0; i < namaSelect.options.length; i++) {
    if (namaSelect.options[i].textContent === surat.nama) {
      namaSelect.selectedIndex = i;
      break;
    }
  }
  
  // Fill form
  if (document.getElementById('nomorSurat')) document.getElementById('nomorSurat').value = surat.nomorSurat || '';
  if (document.getElementById('jabatanSurat')) document.getElementById('jabatanSurat').value = surat.jabatan || '';
  if (document.getElementById('noIdSurat')) document.getElementById('noIdSurat').value = surat.noId || '';
  if (document.getElementById('masaBerlakuSurat')) document.getElementById('masaBerlakuSurat').value = surat.masaBerlaku || '';
  if (surat.foto) {
    currentFoto = surat.foto;
    // Update foto preview
    const fotoSurat = document.getElementById('previewFotoSurat');
    const fotoPlaceholder = document.getElementById('previewFotoSuratPlaceholder');
    if (fotoSurat && fotoPlaceholder) {
      fotoSurat.src = surat.foto;
      fotoSurat.style.display = 'block';
      fotoPlaceholder.style.display = 'none';
    }
  }
  
  updateSuratPreview();
  
  // Store editing id
  document.getElementById('suratForm').dataset.editId = id;
  
  // Change save button text
  document.getElementById('saveSurat').innerHTML = '<i class="fas fa-sync"></i> Update';
}

function confirmHapusAnggota(id) {
  function hapus() {
    hapusAnggota(id).then(function () {
      showToast('Data berhasil dihapus!', 'success');
      loadSavedData();
    });
  }
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Hapus anggota?', text: 'Data tidak bisa dikembalikan!', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Ya, hapus!', cancelButtonText: 'Batal',
      confirmButtonColor: '#c62828', cancelButtonColor: '#9e9e9e', buttonsStyling: false,
      customClass: { popup: 'swal-alert-sm', confirmButton: 'btn btn-sm btn-danger', cancelButton: 'btn btn-sm btn-outline' }
    }).then(function (result) { if (result.isConfirmed) hapus(); });
  } else if (confirm('Hapus data anggota ini?')) {
    hapus();
  }
}

function confirmHapusSurat(id) {
  function hapus() {
    hapusSurat(id).then(function () {
      showToast('Data berhasil dihapus!', 'success');
      loadSavedData();
    });
  }
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Hapus surat tugas?', text: 'Data tidak bisa dikembalikan!', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Ya, hapus!', cancelButtonText: 'Batal',
      confirmButtonColor: '#c62828', cancelButtonColor: '#9e9e9e', buttonsStyling: false,
      customClass: { popup: 'swal-alert-sm', confirmButton: 'btn btn-sm btn-danger', cancelButton: 'btn btn-sm btn-outline' }
    }).then(function (result) { if (result.isConfirmed) hapus(); });
  } else if (confirm('Hapus data surat tugas ini?')) {
    hapus();
  }
}

// Initialize app
initApp();

