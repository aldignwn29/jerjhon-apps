export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) {
    alert('Tidak ada data untuk diexport.');
    return;
  }
  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(','),
    ...rows.map(row => keys.map(k => {
      let cell = row[k] === null || row[k] === undefined ? '' : String(row[k]);
      cell = cell.replace(/"/g, '""');
      if (cell.search(/("|,|\n)/g) >= 0) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(title: string, headers: string[], data: (string | number)[][]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup diblokir oleh browser. Harap izinkan popup untuk mencetak/export PDF.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Export PDF</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h2 { color: #b90f0f; margin-bottom: 5px; }
          p { font-size: 12px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f8fafc; color: #1e293b; font-weight: bold; }
          tr:nth-child(even) { background-color: #fcfcfc; }
          .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: right; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <p>Dicetak pada: ${new Date().toLocaleString('id-ID')} • Enterprise Resource Planning System</p>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>© Jerjhon ERP System - Confidential Business Report</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function printPayslipPDF(record: any, companyName: string, formatIDR: (val: number) => string) {
  const pStatus = (record?.paymentStatus || '').toLowerCase();
  const isPaid = pStatus === 'done' || pStatus === 'paid';
  if (!isPaid) {
    alert('Slip gaji belum dapat diunduh / dicetak (PDF) karena status pembayaran untuk periode ini belum diubah menjadi "Done" atau "Paid" oleh Tim Admin / HR.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup diblokir oleh browser. Harap izinkan popup untuk mencetak slip PDF.');
    return;
  }
  
  const isCancelled = (record.paymentStatus || '').toLowerCase() === 'cancelled';

  const statusText = isPaid ? 'LUNAS / DIBAYAR' : isCancelled ? 'DIBATALKAN' : 'PROSES / BELUM DIBAYAR';

  const statusColor = isPaid 
    ? 'color: #059669; background: #d1fae5; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase;'
    : isCancelled
    ? 'color: #dc2626; background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase;'
    : 'color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase;';
    
  const bonus = (record.kpiCommission || 0) + (record.bonusIncentive || 0);
  const overtime = record.overtimePay || 0;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Slip Gaji - ${record.employeeName}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; line-height: 1.5; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #b90f0f; padding-bottom: 10px; }
          .header h2 { color: #b90f0f; margin: 0 0 5px 0; font-size: 20px; text-transform: uppercase; }
          .header p { margin: 0; font-size: 11px; color: #666; }
          
          .info-box { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 20px; background: #fafafa; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .info-item span { display: inline-block; width: 90px; color: #666; }
          .info-item strong { color: #333; }
          
          .section { margin-bottom: 15px; }
          .section-title { font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; color: #444; }
          
          .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .row.deduction { color: #dc2626; }
          
          .total { border-top: 2px solid #333; padding-top: 10px; margin-top: 15px; display: flex; justify-content: space-between; font-weight: 900; font-size: 16px; color: #b90f0f; }
          
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; }
          .sign-box { width: 150px; }
          .sign-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${companyName}</h2>
          <p>SLIP GAJI KARYAWAN • PERIODE ${record.period}</p>
        </div>
        
        <div class="info-box">
          <div style="text-align: right; margin-bottom: 10px;">
            <span style="${statusColor}">${statusText}</span>
          </div>
          <div class="info-grid">
            <div class="info-item"><span>Nama:</span> <strong>${record.employeeName}</strong></div>
            <div class="info-item"><span>NIK Karyawan:</span> <strong style="font-family: monospace;">${record.employeeNik || record.nik || record.employeeId || '-'}</strong></div>
            <div class="info-item"><span>Jabatan:</span> <strong>${record.position}</strong></div>
            <div class="info-item"><span>Divisi:</span> <strong>${record.department}</strong></div>
            <div class="info-item"><span>ID Slip:</span> <strong style="font-family: monospace;">${record.id}</strong></div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">A. PENERIMAAN / GAJI KOTOR</div>
          <div class="row"><span>Gaji Pokok:</span> <span style="font-family: monospace;">${formatIDR(record.baseSalary)}</span></div>
          <div class="row"><span>Tunjangan Tetap & Jabatan:</span> <span style="font-family: monospace;">${formatIDR(record.fixedAllowance)}</span></div>
          <div class="row"><span>Tunjangan Transportasi:</span> <span style="font-family: monospace;">${formatIDR(record.variableAllowance)}</span></div>
          <div class="row"><span>Uang Lembur (Otomatis):</span> <span style="font-family: monospace;">${formatIDR(overtime)}</span></div>
          <div class="row"><span>Bonus Performance & Insentif KPI:</span> <span style="font-family: monospace;">${formatIDR(bonus)}</span></div>
        </div>
        
        <div class="section">
          <div class="section-title">B. POTONGAN GAJI</div>
          <div class="row deduction"><span>Potongan BPJS Kesehatan & TK:</span> <span style="font-family: monospace;">-${formatIDR(record.bpjsDeduction || 0)}</span></div>
          <div class="row deduction"><span>Pajak Penghasilan (PPh 21):</span> <span style="font-family: monospace;">-${formatIDR(record.taxPPh21 || 0)}</span></div>
          <div class="row deduction"><span>Potongan Kasbon & Absensi:</span> <span style="font-family: monospace;">-${formatIDR(record.loanDeduction || 0)}</span></div>
        </div>
        
        <div class="total">
          <span>TAKE HOME PAY (THP)</span>
          <span>${formatIDR(record.takeHomePay)}</span>
        </div>
        
        <div class="signatures">
          <div class="sign-box">
            <div class="sign-line">Penerima (Karyawan)</div>
          </div>
          <div class="sign-box">
            <div class="sign-line">Finance / HRD</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Dokumen ini dicetak secara otomatis oleh sistem pada ${new Date().toLocaleString('id-ID')}</p>
          <p>© Jerjhon ERP System - Confidential Document</p>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printKPIReportPDF(
  emp: { id: string; name: string; department: string; position: string; supervisor?: string },
  filterMonth: string,
  finalWeightedScore: number,
  performanceGrade: string,
  empTasks: Array<{
    id: string;
    week: string;
    title: string;
    description: string;
    weight: number;
    status: string;
    score?: number;
    submission?: { fileName?: string };
  }>,
  verifierName: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup diblokir oleh browser. Harap izinkan popup untuk mencetak / unduh PDF Laporan.');
    return;
  }

  const currentDate = new Date().toISOString().slice(0, 10);
  const formattedPrintDate = new Date().toLocaleString('id-ID');

  const taskRows = empTasks.length === 0
    ? `<tr><td colspan="6" style="text-align: center; padding: 12px; color: #888; font-style: italic;">Tidak ada tugas KPI yang tercatat pada periode ini.</td></tr>`
    : empTasks.map(task => {
        const scoreVal = task.score !== undefined ? task.score : '-';
        const weightedVal = task.score !== undefined ? Math.round((task.score * task.weight) / 100) : '-';
        return `
          <tr>
            <td style="text-align: center; font-weight: bold; font-family: monospace;">${task.week.replace('Minggu ', 'W')}</td>
            <td>
              <strong style="color: #1e293b; display: block;">${task.title}</strong>
              <span style="font-size: 10px; color: #64748b;">${task.description || ''}</span>
            </td>
            <td style="text-align: center; font-family: monospace;">${task.weight}%</td>
            <td style="text-align: center; font-weight: bold;">${task.status}</td>
            <td style="text-align: center; font-family: monospace; font-weight: bold;">${scoreVal}</td>
            <td style="text-align: center; font-family: monospace; font-weight: 900; color: #b90f0f;">${weightedVal}</td>
          </tr>
        `;
      }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Laporan Kinerja KPI - ${emp.name}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; font-size: 11px; }
          .header { text-align: center; border-bottom: 2px solid #b90f0f; padding-bottom: 12px; margin-bottom: 20px; }
          .header h2 { margin: 0; color: #0f172a; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 3px 0; color: #64748b; font-size: 10px; }
          .doc-meta { display: flex; justify-content: space-between; font-family: monospace; font-size: 9px; color: #94a3b8; margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 6px; }

          .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .info-row { margin-bottom: 4px; font-size: 11px; }
          .info-label { width: 110px; display: inline-block; color: #64748b; font-size: 9px; text-transform: uppercase; font-weight: bold; }
          .info-val { color: #0f172a; font-weight: bold; }

          .grade-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
          .grade-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
          .grade-value { font-size: 14px; font-weight: 900; color: #b90f0f; margin-top: 4px; }
          .score-badge { font-size: 26px; font-weight: 900; font-family: monospace; color: #0f172a; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 10px; }
          th { background: #f1f5f9; color: #475569; font-weight: bold; text-transform: uppercase; font-size: 9px; padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
          td { padding: 8px; border: 1px solid #e2e8f0; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }

          .signatures { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; }
          .sign-box { width: 220px; }
          .sign-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 45px; }
          .sign-name { font-weight: 900; color: #0f172a; text-decoration: underline; font-size: 11px; }
          .sign-role { font-size: 10px; color: #64748b; margin-top: 2px; }

          .footer { margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>PT JERJHON ENTERPRISE</h2>
          <p>Jl. Boulevard Raya Barat No. 88, Jakarta Selatan • Telp: (021) 555-8899</p>
          <p style="font-weight: bold; color: #1e293b; margin-top: 6px; letter-spacing: 1px;">LAPORAN PENILAIAN KINERJA KPI INDIVIDUAL</p>
          <div class="doc-meta">
            <span>No. Dokumen: JJ-HC/KPI/2026/${emp.id.replace('EMP-', '')}</span>
            <span>Periode: ${filterMonth === 'All' ? 'Tahun Buku 2026' : filterMonth}</span>
          </div>
        </div>

        <div class="grid-info">
          <div>
            <div class="info-row"><span class="info-label">ID Karyawan:</span> <span class="info-val" style="font-family: monospace;">${emp.id}</span></div>
            <div class="info-row"><span class="info-label">Nama Lengkap:</span> <span class="info-val">${emp.name}</span></div>
            <div class="info-row"><span class="info-label">Divisi / Dept:</span> <span class="info-val" style="color: #b90f0f;">${emp.department}</span></div>
          </div>
          <div>
            <div class="info-row"><span class="info-label">Jabatan:</span> <span class="info-val">${emp.position}</span></div>
            <div class="info-row"><span class="info-label">Atasan Langsung:</span> <span class="info-val">${emp.supervisor || 'HR Department'}</span></div>
            <div class="info-row"><span class="info-label">Tanggal Cetak:</span> <span class="info-val" style="font-family: monospace;">${currentDate}</span></div>
          </div>
        </div>

        <div class="grade-box">
          <div>
            <div class="grade-title">Kualifikasi Kinerja Akhir</div>
            <div class="grade-value">${performanceGrade}</div>
          </div>
          <div style="text-align: right;">
            <div class="grade-title">Skor KPI Terbobot</div>
            <div class="score-badge">${finalWeightedScore} <span style="font-size: 11px; font-weight: normal; color: #94a3b8;">/ 100</span></div>
          </div>
        </div>

        <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
          Rincian Penilaian per Parameter Tugas KPI
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">Minggu</th>
              <th>Deskripsi / Judul Tugas</th>
              <th style="width: 50px; text-align: center;">Bobot</th>
              <th style="width: 70px; text-align: center;">Status</th>
              <th style="width: 50px; text-align: center;">Skor</th>
              <th style="width: 60px; text-align: center;">Nilai</th>
            </tr>
          </thead>
          <tbody>
            ${taskRows}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-title">Dibuat & Diverifikasi Oleh</div>
            <div class="sign-name">${verifierName}</div>
            <div class="sign-role">Direct Supervisor / Manager</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">Disetujui & Diarsipkan Oleh</div>
            <div class="sign-name">Gugum Gumilar</div>
            <div class="sign-role">Bussiness Owner</div>
          </div>
        </div>

        <div class="footer">
          <p>Dokumen ini dicetak secara otomatis oleh sistem Jerjhon ERP Enterprise pada ${formattedPrintDate}</p>
          <p>© PT Jerjhon Enterprise - Confidential Performance Record</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function printSuratJalanPDF(mov: any) {
  const itemList = (mov.items && Array.isArray(mov.items) && mov.items.length > 0)
    ? mov.items
    : [{ productSku: mov.productSku, productName: mov.productName, quantity: mov.quantity }];

  const totalQty = itemList.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Surat Jalan Mutasi - ${mov.referenceNumber || 'SJ'}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            padding: 25px; 
            color: #000; 
            line-height: 1.5; 
            font-size: 13px;
            background: #fff;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 12px; 
            margin-bottom: 20px; 
          }
          h2 { 
            margin: 0; 
            font-size: 20px;
            text-transform: uppercase; 
            letter-spacing: 1px;
          }
          .header p { 
            margin: 5px 0 0 0; 
            font-size: 11px; 
            color: #444; 
          }
          .details { 
            margin-bottom: 20px; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            border: 1px solid #ccc;
            padding: 12px;
            border-radius: 6px;
          }
          .details p { 
            margin: 4px 0; 
            font-size: 12px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px; 
            margin-bottom: 25px;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 8px 10px; 
            text-align: left; 
            font-size: 12px; 
          }
          th { 
            background-color: #f0f0f0; 
            font-weight: bold;
            text-transform: uppercase;
          }
          .footer { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 50px; 
          }
          .sign-box { 
            text-align: center; 
            width: 230px; 
            font-size: 12px; 
          }
          .sign-line { 
            margin-top: 70px; 
            border-top: 1px solid #000; 
            width: 100%; 
            padding-top: 5px;
            font-weight: bold;
          }
          .doc-note {
            margin-top: 40px; 
            font-size: 10px; 
            color: #666; 
            text-align: center;
            border-top: 1px dashed #ccc;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Surat Jalan Mutasi Stok</h2>
          <p>PT JERJHON ENTERPRISE - LOGISTICS DIVISION</p>
          <p style="font-size: 10px; color: #666;">Jl. Boulevard Raya Barat No. 88, Jakarta Selatan • Telp: (021) 555-8899</p>
        </div>
        <div class="details">
          <div>
            <p><strong>No. Referensi / SJ:</strong> ${mov.referenceNumber || '-'}</p>
            <p><strong>Tanggal Mutasi:</strong> ${mov.date || '-'}</p>
            <p><strong>PIC / Operator:</strong> ${mov.operator || 'Admin Gudang'}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Gudang Asal (Source):</strong> ${mov.sourceLocation || '-'}</p>
            <p><strong>Gudang Tujuan (Destination):</strong> ${mov.destinationLocation || '-'}</p>
            <p><strong>Tipe Dokumen:</strong> Transfer Internal (${itemList.length} Item)</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 8%; text-align: center;">NO</th>
              <th style="width: 27%;">SKU</th>
              <th style="width: 45%;">PRODUK & VARIAN</th>
              <th style="width: 20%; text-align: right;">JUMLAH (QTY)</th>
            </tr>
          </thead>
          <tbody>
            ${itemList.map((item: any, idx: number) => `
              <tr>
                <td style="text-align: center; font-size: 11px; font-weight: bold;">${idx + 1}</td>
                <td style="font-family: monospace; font-weight: bold;">${item.productSku || '-'}</td>
                <td style="font-weight: bold;">${item.productName || '-'}</td>
                <td style="text-align: right; font-weight: bold;">${item.quantity || 0} Pcs</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f0f0f0; font-weight: bold;">
              <td colspan="3" style="text-align: right; padding: 8px;">TOTAL ITEM & KUANTITAS:</td>
              <td style="text-align: right; padding: 8px;">${totalQty} Pcs</td>
            </tr>
          </tfoot>
        </table>
        <div class="footer">
          <div class="sign-box">
            Pihak Pengirim (Gudang Asal)
            <div class="sign-line">(_______________________)</div>
            <div style="font-size: 10px; color: #555;">Tanda Tangan & Nama Terang</div>
          </div>
          <div class="sign-box">
            Pihak Penerima (Gudang Tujuan)
            <div class="sign-line">(_______________________)</div>
            <div style="font-size: 10px; color: #555;">Tanda Tangan & Nama Terang</div>
          </div>
        </div>
        <div class="doc-note">
          Dokumen ini dicetak secara otomatis melalui sistem ERP Jerjhon pada ${new Date().toLocaleString('id-ID')}.<br/>
          Harap diperiksa fisik barang saat penerimaan di Gudang Tujuan.
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  // Try window.open first
  const printWindow = window.open('', '_blank', 'width=850,height=950,scrollbars=yes');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    return;
  }

  // Fallback to iframe if window.open is blocked by popup blocker or iframe restrictions
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.top = '0';
  frame.style.left = '0';
  frame.style.width = '1000px';
  frame.style.height = '1000px';
  frame.style.zIndex = '-9999';
  frame.style.opacity = '0.01';
  frame.style.pointerEvents = 'none';
  document.body.appendChild(frame);

  const frameDoc = frame.contentWindow?.document;
  if (frameDoc) {
    frameDoc.write(html);
    frameDoc.close();
    setTimeout(() => {
      if (frame.contentWindow) {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(frame)) {
            document.body.removeChild(frame);
          }
        }, 1500);
      }
    }, 500);
  }
}


