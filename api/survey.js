// /api/survey.js

import { google } from "googleapis";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const REQUIRED_ENV_KEYS = [
  "GOOGLE_SERVICE_ACCOUNT",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "SHEET_ID",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]);
    if (missingKeys.length > 0) {
      return res.status(500).json({
        error: `서버 환경변수 누락: ${missingKeys.join(", ")}`,
      });
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    } catch {
      return res.status(500).json({
        error: "GOOGLE_SERVICE_ACCOUNT 형식이 올바르지 않습니다.",
      });
    }

    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    const db = getFirestore();
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "이름/연락처를 입력해주세요." });
    }

    // 🔒 IP 가져오기
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";

    // =========================
    // 🚫 IP 중복 체크
    // =========================
    const ipRef = db.collection("ip_logs").doc(ip);
    const ipDoc = await ipRef.get();

    if (ipDoc.exists) {
      return res.status(429).json({
        error: "이미 신청하셨습니다.",
      });
    }

    // 저장 (신청 기록)
    await ipRef.set({
      createdAt: new Date(),
      name,
      phone,
    });

    // =========================
    // 텔레그램
    // =========================
    const message = `
📩 새로운 신청

👤 이름: ${name}
📞 연락처: ${phone}
🌐 IP: ${ip}
`;

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    // =========================
    // 구글 시트
    // =========================
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "시트1!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, phone, ip, new Date().toLocaleString()]],
      },
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "서버 에러" });
  }
}
