import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Firebase Admin
  // We'll use environment variables for the service account
  try {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountVar) {
      const serviceAccount = JSON.parse(serviceAccountVar);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized successfully");
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT not found. Push notifications will be disabled.");
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }

  // API Route to send notifications
  app.post("/api/send-notification", async (req, res) => {
    const { token, title, body, icon, data } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    try {
      const message = {
        notification: {
          title,
          body,
        },
        android: {
          notification: {
            icon: 'stock_ticker_update',
            color: '#2563eb'
          }
        },
        webpush: {
          notification: {
            icon: icon || '/logoo.png',
            badge: '/logoo.png'
          },
          fcm_options: {
            link: data?.link || '/'
          }
        },
        token: token,
      };

      const response = await admin.messaging().send(message);
      res.json({ success: true, messageId: response });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
