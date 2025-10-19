import express from "express";
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 📡 Server Route
app.get("/", (req, res) => {
  res.send("✅ WhatsApp Pair Code Bot Server Running!");
});

let qrCodeData = null;

// 🧾 Pair Code / QR Generate Route
app.get("/pair", async (req, res) => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version,
      printQRInTerminal: true,
      auth: state
    });

    sock.ev.on("connection.update", async (update) => {
      const { qr, connection } = update;
      if (qr) {
        qrCodeData = await qrcode.toDataURL(qr);
      }
      if (connection === "open") {
        console.log("✅ WhatsApp Connected!");
      }
    });

    sock.ev.on("creds.update", saveCreds);

    setTimeout(() => {
      if (qrCodeData) {
        res.send(`
          <h1>📲 Scan This QR Code With Your WhatsApp</h1>
          <img src="${qrCodeData}" alt="QR Code" />
        `);
      } else {
        res.send("❌ QR Code not generated yet. Try again.");
      }
    }, 2000);

  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error generating QR Code");
  }
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
