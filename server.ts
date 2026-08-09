import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const FALLBACK_SUPABASE_URL = "https://hlybvazspohsussvltvs.supabase.co";
const FALLBACK_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseWJ2YXpzcG9oc3Vzc3ZsdHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNDAyNjAsImV4cCI6MjEwMTgxNjI2MH0.uSYDINDFpsXj9Jn4fMAAvbqcPhTPcRPmmxhz_Jm5Kcs";

export async function createExpressApp() {
  const app = express();
  
  app.use(express.json({ limit: "10mb" }));

  // API endpoints
  app.all("/api/supabase-proxy/*", async (req, res) => {
    try {
      const pathPart = req.params[0] || "";
      const queryPart = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";

      let rawTargetUrl = process.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
      if (rawTargetUrl.includes("zoxsfwfvqfzdfccaohry")) {
        rawTargetUrl = FALLBACK_SUPABASE_URL;
      }

      let baseUrl = rawTargetUrl.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
      let targetUrl = `${baseUrl}/${pathPart}${queryPart}`;

      const headers: Record<string, string> = {};
      const headersToForward = ['apikey', 'authorization', 'content-type', 'prefer', 'range', 'x-client-info'];
      for (const h of headersToForward) {
        if (req.headers[h]) {
          headers[h] = req.headers[h] as string;
        }
      }

      const defaultKey = process.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_KEY;
      if (!headers['apikey']) {
        headers['apikey'] = defaultKey;
      }
      if (!headers['authorization']) {
        headers['authorization'] = `Bearer ${defaultKey}`;
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (!['GET', 'HEAD'].includes(req.method)) {
        if (typeof req.body === 'string') {
          fetchOptions.body = req.body;
        } else if (req.body && Object.keys(req.body).length > 0) {
          fetchOptions.body = JSON.stringify(req.body);
        }
      }

      let response: Response;
      try {
        response = await fetch(targetUrl, fetchOptions);
      } catch (fetchErr: any) {
        // If primary failed (e.g. DNS ENOTFOUND or invalid host), retry with fallback
        if (baseUrl !== FALLBACK_SUPABASE_URL) {
          console.warn(`[Supabase Proxy] Primary URL ${baseUrl} failed (${fetchErr.message}). Retrying with fallback...`);
          baseUrl = FALLBACK_SUPABASE_URL;
          targetUrl = `${baseUrl}/${pathPart}${queryPart}`;
          headers['apikey'] = FALLBACK_SUPABASE_KEY;
          headers['authorization'] = `Bearer ${FALLBACK_SUPABASE_KEY}`;
          response = await fetch(targetUrl, fetchOptions);
        } else {
          throw fetchErr;
        }
      }

      const contentRange = response.headers.get('content-range');
      if (contentRange) res.setHeader('content-range', contentRange);

      const contentType = response.headers.get('content-type');
      if (contentType) res.setHeader('content-type', contentType);

      res.status(response.status);
      const data = await response.text();
      res.send(data);
    } catch (err: any) {
      console.error("[Supabase Proxy Error]:", err.message || err);
      res.status(502).json({ error: err.message || "Supabase proxy error", details: "Unable to reach Supabase backend" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      system: "JERJHON ERP ENTERPRISE v2.5",
      timestamp: new Date().toISOString(),
      database_target: "Local Storage & State Architecture (Configured from Scratch)"
    });
  });

  app.get("/api/company", (req, res) => {
    res.json({
      company_name: "PT JERJHON ENTERPRISE INDONESIA",
      tagline: "Integrated Enterprise Resource Planning",
      tax_id: "01.234.567.8-012.000",
      established: "2010",
      headquarters: "Jakarta Financial Center, Tower A Floor 24",
      currency: "IDR",
      locale: "id-ID"
    });
  });

  app.post("/api/send-payslip", async (req, res) => {
    try {
      const { email, record, companyName, logoUrl } = req.body;
      if (!email || !record) {
        return res.status(400).json({ error: "Missing email or payroll record" });
      }

      // Generate PDF
      const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
      const page = await browser.newPage();
      
      const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
      
      const statusColor = (record.paymentStatus || '').toLowerCase() === 'done' || (record.paymentStatus || '').toLowerCase() === 'paid' 
        ? 'color: #059669; background: #d1fae5; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase;'
        : 'color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase;';
        
      const bonus = (record.kpiCommission || 0) + (record.bonusIncentive || 0) + (record.overtimePay || 0);

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Slip Gaji - ${record.employeeName}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; line-height: 1.5; font-size: 12px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #b90f0f; padding-bottom: 10px; }
              .header img { max-height: 60px; margin-bottom: 10px; }
              .header h2 { color: #b90f0f; margin: 0 0 5px 0; font-size: 20px; text-transform: uppercase; }
              .header p { margin: 0; font-size: 11px; color: #666; }
              
              .info-box { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 20px; background: #fafafa; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
              .info-item span { display: inline-block; width: 80px; color: #666; }
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
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : `<h2>${companyName}</h2>`}
              <p>SLIP GAJI KARYAWAN • PERIODE ${record.period}</p>
            </div>
            
            <div class="info-box">
              <div style="text-align: right; margin-bottom: 10px;">
                <span style="${statusColor}">${record.paymentStatus || 'Pending'}</span>
              </div>
              <div class="info-grid">
                <div class="info-item"><span>Nama:</span> <strong>${record.employeeName}</strong></div>
                <div class="info-item"><span>Jabatan:</span> <strong>${record.position}</strong></div>
                <div class="info-item"><span>Divisi:</span> <strong>${record.department}</strong></div>
                <div class="info-item"><span>ID Slip:</span> <strong style="font-family: monospace;">${record.id}</strong></div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">A. PENERIMAAN / GAJI KOTOR</div>
              <div class="row"><span>Gaji Pokok:</span> <span style="font-family: monospace;">${formatIDR(record.baseSalary)}</span></div>
              <div class="row"><span>Tunjangan Tetap & Jabatan:</span> <span style="font-family: monospace;">${formatIDR(record.fixedAllowance)}</span></div>
              <div class="row"><span>Tunjangan Transport & Makan:</span> <span style="font-family: monospace;">${formatIDR(record.variableAllowance)}</span></div>
              <div class="row"><span>Bonus Performance KPI & Lembur:</span> <span style="font-family: monospace;">${formatIDR(bonus)}</span></div>
            </div>
            
            <div class="section">
              <div class="section-title">B. POTONGAN GAJI</div>
              <div class="row deduction"><span>Potongan Kasbon & Absensi:</span> <span style="font-family: monospace;">-${formatIDR(record.loanDeduction)}</span></div>
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
          </body>
        </html>
      `;
      await page.setContent(html);
      const pdfBuffer = await page.pdf({ format: 'A4' });
      await browser.close();

      // Send email if SMTP configured
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"${companyName}" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `Slip Gaji - ${record.period}`,
          text: `Yth. ${record.employeeName},\n\nTerlampir kami sampaikan Slip Gaji Periode ${record.period}.\n\nHormat kami,\n${companyName}`,
          attachments: [{
            filename: `Slip_Gaji_${record.employeeName}_${record.period}.pdf`,
            content: Buffer.from(pdfBuffer),
            contentType: 'application/pdf'
          }]
        });
      }

      res.json({ success: true, message: "Payslip generated and email process triggered." });
    } catch (error: any) {
      console.error("Failed to send email:", error);
      res.status(500).json({ error: error.message || "Failed to send email" });
    }
  });

  app.post("/api/send-notification", async (req, res) => {
    try {
      const { title, body } = req.body;
      res.json({ success: true, messageId: "msg_" + Date.now() });
    } catch (error) {
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Lazy initialization of Gemini client
  let geminiClient: any = null;
  function getGeminiClient() {
    if (!geminiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return geminiClient;
  }

  app.post("/api/gemini/parse-cv", async (req, res) => {
    try {
      const { text, fileBase64, mimeType } = req.body;
      if (!text && !fileBase64) {
        return res.status(400).json({ error: "Missing CV/Portfolio data." });
      }

      const ai = getGeminiClient();
      const prompt = `You are an expert HR applicant parsing system. Extract structured details from the provided candidate CV and Portfolio. 
Return JSON with: name, position, department (Marketing, Production, Operations, Finance, Creative, HR), email, phone, experience (integer), education, skills (array of strings), interviewerNotes, rating (1-5 integer), interviewScore (0-100 integer).`;

      const contents: any[] = [];
      if (fileBase64) {
        contents.push({
          inlineData: {
            mimeType: mimeType || "application/pdf",
            data: fileBase64
          }
        });
      } else if (text) {
        contents.push({
          text: `Here is the plain text of the CV and Portfolio:\n\n${text}`
        });
      }

      contents.push({ text: prompt });

      let response: any = null;
      const modelsToTry = ["gemini-3.6-flash", "gemini-3.1-flash-lite"];

      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  position: { type: Type.STRING },
                  department: { type: Type.STRING },
                  email: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  experience: { type: Type.INTEGER },
                  education: { type: Type.STRING },
                  skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  interviewerNotes: { type: Type.STRING },
                  rating: { type: Type.INTEGER },
                  interviewScore: { type: Type.INTEGER }
                },
                required: ["name", "position", "department", "email", "phone", "experience", "education", "skills", "interviewerNotes", "rating", "interviewScore"]
              }
            }
          });
          if (response) break;
        } catch (err) {
          console.warn(`Model ${modelName} failed:`, err);
        }
      }

      if (!response || !response.text) {
        throw new Error("Failed to generate content with Gemini API");
      }

      const parsedData = JSON.parse(response.text.trim());
      res.json({ success: true, candidate: parsedData });
    } catch (error: any) {
      console.error("Failed to parse CV with Gemini:", error);
      res.status(500).json({ error: error.message || "Failed to process CV with Gemini AI" });
    }
  });

  // Serve Vite development or production static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

const isVercel = process.env.VERCEL === "1" || !!process.env.NOW_REGION;
if (!isVercel) {
  createExpressApp().then((app) => {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Jerjhon ERP Enterprise running on http://0.0.0.0:${PORT}`);
    });
  }).catch((err) => {
    console.error("Failed to start server:", err);
  });
}
