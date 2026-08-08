import re

with open('src/components/modules/inventory_purchasing/StockOpnameView.tsx', 'r') as f:
    content = f.read()

print_func = """
  const handlePrintSJ = (mov: any) => {
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    document.body.appendChild(frame);
    const frameDoc = frame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.write(`
        <html>
          <head>
            <title>Surat Jalan Mutasi - ${mov.referenceNumber}</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              h2 { text-align: center; }
              .details { margin-top: 20px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #333; padding: 8px; text-align: left; }
            </style>
          </head>
          <body>
            <h2>SURAT JALAN MUTASI STOK</h2>
            <div class="details">
              <p><strong>No. Referensi:</strong> ${mov.referenceNumber}</p>
              <p><strong>Tanggal:</strong> ${mov.date}</p>
              <p><strong>Gudang Asal:</strong> ${mov.sourceLocation}</p>
              <p><strong>Gudang Tujuan:</strong> ${mov.destinationLocation}</p>
              <p><strong>PIC:</strong> ${mov.operator}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Produk & Varian</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${mov.productSku}</td>
                  <td>${mov.productName}</td>
                  <td>${mov.quantity} Pcs</td>
                </tr>
              </tbody>
            </table>
            <br/><br/>
            <div style="display:flex; justify-content:space-between; margin-top:50px;">
              <div>Pihak Pengirim (Asal)<br/><br/><br/>(________________)</div>
              <div>Pihak Penerima (Tujuan)<br/><br/><br/>(________________)</div>
            </div>
            <script>
              window.onload = () => { window.print(); }
            </script>
          </body>
        </html>
      `);
      frameDoc.close();
    }
  };
"""

content = content.replace("  const handleAddToCart = () => {", print_func + "\n  const handleAddToCart = () => {")

with open('src/components/modules/inventory_purchasing/StockOpnameView.tsx', 'w') as f:
    f.write(content)
