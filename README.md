 **PT Sahabat Agro Group Employee Portal – Struktur & Alur**

## **Deskripsi Umum**

Portal ini adalah web-app internal untuk **karyawan** yang memiliki beberapa menu utama (Produksi, HR, Umum).
**Menu utama pertama** yang dikembangkan: **Produksi**, di dalamnya ada sub-menu:

* **Produksi Panen** (Harian, Bulanan, Pivot Analisis)
* **Rawat** (dummy/kosong dulu)
* **\[Opsional: menu lain selanjutnya]**

Semua dashboard sudah support login dengan Google Apps Script sebagai backend API, login sheet Google Sheet.

---

## **Alur User Journey**

1. **User buka aplikasi** → akan diarahkan ke halaman **login** (`login.html`)
2. **User login** (username & password dari Google Sheet)
3. Jika **login sukses** → masuk ke **index.html** (halaman landing/portal utama)
4. **Di index.html** ada 3 menu utama:

   * **Produksi**
   * **HR**
   * **Umum**
5. **User klik menu "Produksi"** → redirect ke **produksi.html**
6. **Di produksi.html**, muncul 2 menu utama:

   * **Produksi Panen** → berisi 3 sub menu: Harian, Bulanan, Pivot Analisis
   * **Rawat** (dummy page, “Segera Hadir”)
7. **Sub menu "Produksi Panen"**:

   * **Dashboard Harian:** dashboard\_harian.html
   * **Dashboard Bulanan:** dashboard\_bulanan.html
   * **Dashboard Pivot Analisis:** dashboard\_pivot.html
8. **Menu lain** (HR, Umum) sementara diarahkan ke halaman kosong, dikembangkan nanti.

---

## **Struktur Folder & File**

```plaintext
/
|-- index.html                # Portal utama (setelah login, pilih menu utama)
|-- login.html                # Halaman login
|-- produksi.html             # Menu utama Produksi (isi: panen, rawat, dst)
|-- dashboard_harian.html     # Dashboard Produksi Harian
|-- dashboard_bulanan.html    # Dashboard Produksi Bulanan
|-- dashboard_pivot.html      # Dashboard Pivot Analisis
|-- [hr.html, umum.html]      # Placeholder menu utama lainnya
|-- assets/
|   |-- logo-PTSAG.png
|   |-- [icon/icon]
|-- js/
|   |-- ui.js                 # Utility global (showAlert, dsb)
|   |-- ui_daily.js           # Rendering dashboard harian
|   |-- ui_monthly.js         # Rendering dashboard bulanan
|   |-- ui_pivot.js           # Rendering dashboard pivot/analisis
|   |-- main_harian.js        # Orkestrasi dashboard harian
|   |-- main_bulanan.js       # Orkestrasi dashboard bulanan
|   |-- main_pivot.js         # Orkestrasi dashboard pivot/analisis
|   |-- main_produksi.js      # Orkestrasi/tabs di produksi.html
|   |-- login.js              # Login logic
|-- style.css
```

---

## **Alur & Logika Setiap Page**

### 1. **login.html**

* User isi username & password (autentikasi ke Apps Script/Sheet)
* Berhasil → redirect ke index.html

### 2. **index.html**

* Pilihan menu utama: Produksi, HR, Umum (gunakan card/grid/3 tombol)
* Klik “Produksi” → ke produksi.html
* Klik lain: redirect ke halaman kosong/“Segera Hadir”

### 3. **produksi.html**

* **Sidebar/tab/topbar**:

  * **Produksi Panen** (default aktif, ada submenu: Harian, Bulanan, Pivot)
  * **Rawat** (dummy)
* **Klik submenu** (harian/bulanan/pivot): Load dashboard sesuai js/halaman masing-masing.
* Responsive & bisa collapse sidebar.

### 4. **dashboard\_harian.html / dashboard\_bulanan.html / dashboard\_pivot.html**

* Masing-masing punya filter & chart sendiri (tidak saling ganggu).
* **main\_xxx.js** (harian/bulanan/pivot) hanya manage view & fetch data sesuai kebutuhan.
* Semua render logika/UI pakai ui\_xxx.js dan utility di ui.js.

---

## **API Apps Script (GAS)**

* **Endpoint**: digunakan untuk login, getInitialData, getDashboardData, getMonthlyData, dsb.
* Semua data filter dropdown, data dashboard, dsb. diambil lewat API ini.

---

## **Kelebihan Struktur Ini**

* **Modular**: Mudah maintain, error tidak nyebar, pengembangan per menu lebih aman
* **Scalable**: Menu HR & Umum tinggal tambah file dan logicnya, tidak perlu refactor dashboard produksi
* **Maintainable**: Kalau error/bug hanya di dashboard tertentu, tidak crash semua
* **Professional**: UI konsisten, logic terpisah, gampang onboarding buat dev baru

---

## **TODO Next Step**

* Selesaikan logika produksi panen dulu (harian, bulanan, pivot).
* Menu HR & Umum → develop nanti.
* Integrasi API lain jika dibutuhkan.
* Responsive & akses mobile friendly.

---

## **Credit**

> *Freddy Mazmur, PM PT Sahabat Agro Group – 2025*

---

### **Quick Recap Flow**

* Login → Pilih menu utama (Produksi/HR/Umum) → Pilih menu Produksi → sub menu Panen (harian, bulanan, pivot)
  → Setiap dashboard sudah **mandiri** dan **tidak saling mengganggu**.

---


