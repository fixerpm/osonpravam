/**
 * Vercel Serverless Function — GET /api/certificate
 * Generates the official OSON PRAVA certificate as a real PDF, entirely
 * server-side (PDFKit + embedded Unicode font + qrcode). This is the URL that
 * Telegram.WebApp.downloadFile() fetches directly from js/certificate.js, so
 * the download works uniformly inside Telegram Desktop/Android/iOS AND
 * Telegram Web (web.telegram.org) — Telegram's own client requests this URL,
 * bypassing the Mini App's sandboxed WebView/iframe entirely.
 *
 * Mantiq server.js ichida (lokal server bilan umumiy), bu yerda faqat yupqa qobiq.
 */
const { buildCertificatePdfBuffer } = require('../server.js');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    const raw = url.searchParams.get('data');
    if (!raw) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ success: false, error: 'data parametri kerak' }));
    }

    // Mirrors js/certificate.js's encodeCertExportParam(): the client does
    // btoa(unescape(encodeURIComponent(json))), i.e. base64 of the UTF-8
    // bytes of the JSON string — a plain base64 -> utf8 decode reconstructs
    // the original JSON exactly (handles Cyrillic/Uzbek names correctly).
    const json = Buffer.from(decodeURIComponent(raw), 'base64').toString('utf8');
    const certPayload = JSON.parse(json);

    const pdfBuffer = await buildCertificatePdfBuffer(certPayload);
    const fileName = `OSON-PRAVA-SERTIFIKAT-${(certPayload.certificateId || 'CERT').replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    // Required by Telegram.WebApp.downloadFile() for consistent cross-platform
    // behavior (see https://core.telegram.org/bots/webapps#downloadfileparams).
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(pdfBuffer);
  } catch (err) {
    console.error('[api/certificate] Xatolik:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ success: false, error: 'Sertifikat generatsiya qilishda xatolik yuz berdi' }));
  }
};
