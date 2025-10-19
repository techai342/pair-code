const express = require("express");
const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

const SESSION_FILE_PATH = path.join(__dirname, "auth_info.json");
let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}

const client = new Client({
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  session: sessionData
});

client.on("qr", async (qr) => {
  console.log("📲 QR Code Generated!");
  const qrImage = await qrcode.toDataURL(qr);
  fs.writeFileSync(path.join(__dirname, "latest_qr.txt"), qrImage);
});

client.on("authenticated", (session) => {
  console.log("✅ WhatsApp Connected!");
  fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session));
});

client.on("ready", () => {
  console.log("🤖 Bot is ready!");
});

client.initialize();

app.get("/", (req, res) => {
  res.send("✅ WhatsApp Pair Code Bot Server Running!");
});

app.get("/pair", (req, res) => {
  const qrPath = path.join(__dirname, "latest_qr.txt");
  if (fs.existsSync(qrPath)) {
    const qr = fs.readFileSync(qrPath, "utf8");
    const html = `
      <html>
      <head><title>WhatsApp Pair Code</title></head>
      <body style="text-align:center; font-family:sans-serif;">
        <h2>📲 Scan this QR in WhatsApp</h2>
        <img src="${qr}" />
        <p>Open WhatsApp → Linked Devices → Scan</p>
      </body>
      </html>`;
    res.send(html);
  } else {
    res.send("⏳ QR Code not generated yet. Please refresh in a few seconds.");
  }
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
