// /api/survey.js

import { google } from "googleapis";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const REQUIRED_ENV_KEYS = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "SHEET_ID",
];

const KOREAN_NAME_REGEX = /^[\uAC00-\uD7A3]{2,4}$/;

function getTrimmedEnv(key) {
  const raw = process.env[key];
  return typeof raw === "string" ? raw.trim() : "";
}

function getHeaderValue(req, key) {
  const value = req.headers && req.headers[key];
  return Array.isArray(value) ? value[0] : value;
}

function getClientIp(req) {
  const forwardedFor = getHeaderValue(req, "x-forwarded-for");
  const realIp = getHeaderValue(req, "x-real-ip");
  const socketIp = req.socket && req.socket.remoteAddress;
  const ip =
    (typeof forwardedFor === "string" && forwardedFor.split(",")[0]) ||
    (typeof realIp === "string" && realIp) ||
    socketIp ||
    "unknown";

  return String(ip).trim() || "unknown";
}

function getIpLogDocId(ip) {
  return ip.replace(/\//g, "_");
}

function parseServiceAccountFromEnv() {
  const rawJson = getTrimmedEnv("GOOGLE_SERVICE_ACCOUNT");
  const rawBase64 = getTrimmedEnv("GOOGLE_SERVICE_ACCOUNT_B64");

  if (!rawJson && !rawBase64) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT 또는 GOOGLE_SERVICE_ACCOUNT_B64 환경변수가 필요합니다."
    );
  }

  const parseWithValidation = (source) => {
    const account = JSON.parse(source);
    const normalized = {
      ...account,
      private_key:
        typeof account.private_key === "string"
          ? account.private_key.replace(/\\n/g, "\n")
          : account.private_key,
    };

    if (!normalized.client_email || !normalized.private_key || !normalized.project_id) {
      throw new Error("서비스 계정 JSON 필수 필드(client_email, private_key, project_id)가 없습니다.");
    }

    return normalized;
  };

  if (rawJson) {
    try {
      return parseWithValidation(rawJson);
    } catch (error) {
      if (!rawBase64) {
        throw new Error(`GOOGLE_SERVICE_ACCOUNT 파싱 실패: ${error.message}`);
      }
    }
  }

  try {
    const decoded = Buffer.from(rawBase64, "base64").toString("utf-8");
    return parseWithValidation(decoded);
  } catch (error) {
    throw new Error(`GOOGLE_SERVICE_ACCOUNT_B64 파싱 실패: ${error.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  let ipRef = null;
  let ipReserved = false;

  try {
    const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !getTrimmedEnv(key));
    if (!getTrimmedEnv("GOOGLE_SERVICE_ACCOUNT") && !getTrimmedEnv("GOOGLE_SERVICE_ACCOUNT_B64")) {
      missingKeys.push("GOOGLE_SERVICE_ACCOUNT(or GOOGLE_SERVICE_ACCOUNT_B64)");
    }

    if (missingKeys.length > 0) {
      return res.status(500).json({
        error: `서버 환경변수 누락: ${missingKeys.join(", ")}`,
      });
    }

    let serviceAccount = null;
    try {
      serviceAccount = parseServiceAccountFromEnv();
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    const db = getFirestore();
    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    } catch {
      return res.status(400).json({ error: "요청 본문(JSON) 형식이 올바르지 않습니다." });
    }
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!name || !phone) {
      return res.status(400).json({ error: "이름/연락처를 입력해주세요." });
    }

    if (!KOREAN_NAME_REGEX.test(name)) {
      return res.status(400).json({ error: "이름은 한글 2~4자만 입력해주세요." });
    }

    // 🔒 IP 가져오기
    const ip = getClientIp(req);

    // =========================
    // 🚫 IP 중복 체크
    // =========================
    ipRef = db.collection("ip_logs").doc(getIpLogDocId(ip));

    const reserved = await db.runTransaction(async (transaction) => {
      const ipDoc = await transaction.get(ipRef);
      if (ipDoc.exists) {
        return false;
      }

      transaction.set(ipRef, {
        createdAt: new Date(),
        ip,
        name,
        phone,
        status: "pending",
      });

      return true;
    });

    if (!reserved) {
      return res.status(429).json({
        error: "이미 신청하셨습니다.",
      });
    }

    // =========================
    // 텔레그램
    // =========================
    ipReserved = true;

    const message = `
📩 새로운 신청

👤 이름: ${name}
📞 연락처: ${phone}
🌐 IP: ${ip}
`;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
        }),
      }
    );

    if (!telegramResponse.ok) {
      const details = await telegramResponse.text();
      throw new Error(`텔레그램 전송 실패(${telegramResponse.status}): ${details}`);
    }

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

    // 저장 (신청 기록) - 외부 전송 성공 후 기록해, 실패 시 재시도 가능하게 유지
    await ipRef.set(
      {
        completedAt: new Date(),
        status: "completed",
      },
      { merge: true }
    );

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    if (ipReserved && ipRef) {
      try {
        await ipRef.set(
          {
            failedAt: new Date(),
            lastError: err.message || "서버 오류",
            status: "failed",
          },
          { merge: true }
        );
      } catch (logError) {
        console.error(logError);
      }
    }
    return res.status(500).json({ error: err.message || "서버 에러" });
  }
}
