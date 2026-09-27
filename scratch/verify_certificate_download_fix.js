/**
 * Static verification for the universal certificate download implementation.
 * Run: node scratch/verify_certificate_download_fix.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const client = fs.readFileSync(path.join(root, 'js/certificate.js'), 'utf8');
const api = fs.readFileSync(path.join(root, 'api/certificate.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

const checks = [
  [client.includes('function downloadFromServer(certData)') || client.includes('async function downloadFromServer(certId)'), 'Client has server-side download helper'],
  [client.includes("fetch(url, {") && client.includes("headers: { 'Accept': 'application/pdf' }"), 'Client fetches PDF as application/pdf'],
  [client.includes('URL.createObjectURL(blob)'), 'Client creates a real downloadable Blob URL'],
  [client.includes('anchor.download = `OSON-PRAVA-SERTIFIKAT-${certId}.pdf`'), 'Client uses the certificate filename'],
  [client.includes('downloadViaTelegramDownloadFile(certId)'), 'Telegram native download path is preserved'],
  [client.includes('redirectToExternalBrowserIfInTelegram()'), 'Telegram browser fallback is preserved'],
  [client.includes('buildServerCertificateUrl(lastCertData)'), 'All download paths use the server certificate endpoint'],
  [api.includes("res.setHeader('Content-Type', 'application/pdf')"), 'Vercel API returns application/pdf'],
  [api.includes("Content-Disposition', `attachment; filename="), 'Vercel API forces file download'],
  [server.includes("Content-Type': 'application/pdf'"), 'Local server returns application/pdf'],
  [server.includes("'Content-Disposition': `attachment; filename="), 'Local server forces file download'],
  [fs.existsSync(path.join(root, 'assets/fonts/DejaVuSans.ttf')), 'Unicode regular font is bundled'],
  [fs.existsSync(path.join(root, 'assets/fonts/DejaVuSans-Bold.ttf')), 'Unicode bold font is bundled'],
];

let failed = 0;
for (const [ok, label] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed++;
}

if (failed) process.exit(1);
console.log(`\nAll ${checks.length} certificate download checks passed.`);
