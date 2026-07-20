// Dexie Database Setup
let db;

if (typeof Dexie !== 'undefined') {
  db = new Dexie('OrganisasiDB');
  db.version(3).stores({
    anggota: '++id, nama, noId, jabatan, masaBerlaku',
    suratTugas: '++id, nama, jabatan, noId, masaBerlaku, nomorSurat'
  });
}

function dbReady() {
  return typeof db !== 'undefined' && db !== null;
}

// Anggota functions
async function tambahAnggota(anggota) {
  if (!dbReady()) throw new Error('Database tidak tersedia');
  return await db.anggota.add(anggota);
}

async function getSemuaAnggota() {
  if (!dbReady()) return [];
  return await db.anggota.toArray();
}

async function getAnggotaById(id) {
  if (!dbReady()) return null;
  return await db.anggota.get(id);
}

async function updateAnggota(id, data) {
  if (!dbReady()) throw new Error('Database tidak tersedia');
  return await db.anggota.update(id, data);
}

async function hapusAnggota(id) {
  if (!dbReady()) throw new Error('Database tidak tersedia');
  return await db.anggota.delete(id);
}

// Surat Tugas functions
async function tambahSurat(surat) {
  if (!dbReady()) throw new Error('Database tidak tersedia');
  return await db.suratTugas.add(surat);
}

async function getSemuaSurat() {
  if (!dbReady()) return [];
  return await db.suratTugas.toArray();
}

async function getSuratById(id) {
  if (!dbReady()) return null;
  return await db.suratTugas.get(id);
}

async function updateSurat(id, data) {
  if (!dbReady()) throw new Error('Database tidak tersedia');
  return await db.suratTugas.update(id, data);
}

async function hapusSurat(id) {
  if (!dbReady()) throw new Error('Database tidak tersedia');
  return await db.suratTugas.delete(id);
}
