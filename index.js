import express from "express";
import cors from "cors";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Pair Code Generator is running!");
});

app.post("/pair", async (req, res) => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions`);
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false
    });

    sock.ev.on("connection.update", async (update) => {
      const { qr, connection } = update;
      if (qr) {
        const qrImage = await QRCode.toDataURL(qr);
        res.json({ qr: qrImage });
      }
      if (connection === "open") {
        console.log("✅ WhatsApp connected successfully");
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("🚀 Pair code server running on port 3000"));
