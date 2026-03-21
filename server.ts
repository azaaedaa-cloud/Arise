import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as admin from "firebase-admin";
import fs from "fs";
import omsRouter from "./src/services/oms/index";

// Load Firebase configuration
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

// Initialize Firebase Admin for server-side token verification
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log("FIREBASE_ADMIN_INITIALIZED");
  }
} catch (error) {
  console.error("FIREBASE_ADMIN_INIT_FAILURE:", error);
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  // @ts-ignore - Using latest version
  apiVersion: "2024-12-18.acacia",
});

const JWT_SECRET = process.env.JWT_SECRET || "luxe-books-secret-key-2026";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  // Stripe Webhook - Military Grade Security
  // This endpoint MUST be called by Stripe only. We verify the signature to prevent spoofing.
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (!sig || !endpointSecret) throw new Error("Missing signature or secret");
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error(`WEBHOOK_SIGNATURE_VERIFICATION_FAILED: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        
        console.log(`PAYMENT_SUCCESS: Session ${session.id} for Order ${orderId}`);
        
        if (orderId && orderId !== "none") {
          try {
            const orderRef = admin.firestore().collection("orders").doc(orderId);
            const orderDoc = await orderRef.get();
            
            if (orderDoc.exists && orderDoc.data()?.status !== "paid") {
              await orderRef.update({
                status: "paid",
                stripeSessionId: session.id,
                paidAt: admin.firestore.FieldValue.serverTimestamp()
              });
              console.log(`ORDER_UPDATED: Order ${orderId} marked as paid`);
            }
          } catch (dbErr) {
            console.error(`ORDER_UPDATE_FAILURE: ${dbErr}`);
          }
        }
        break;

      case "checkout.session.expired":
        const expiredSession = event.data.object as Stripe.Checkout.Session;
        const expiredOrderId = expiredSession.metadata?.orderId;
        
        if (expiredOrderId && expiredOrderId !== "none") {
          try {
            const orderRef = admin.firestore().collection("orders").doc(expiredOrderId);
            const orderDoc = await orderRef.get();
            
            if (orderDoc.exists && orderDoc.data()?.status === "pending") {
              const orderData = orderDoc.data();
              const batch = admin.firestore().batch();
              
              // Return inventory to stock
              for (const item of orderData?.items || []) {
                const bookRef = admin.firestore().collection("books").doc(item.bookId);
                batch.update(bookRef, {
                  stock: admin.firestore.FieldValue.increment(item.quantity)
                });
              }
              
              batch.update(orderRef, { 
                status: "cancelled", 
                cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                cancellationReason: "Stripe session expired"
              });
              
              await batch.commit();
              console.log(`ORDER_CANCELLED: Order ${expiredOrderId} cancelled and inventory returned`);
            }
          } catch (err) {
            console.error(`ORDER_CANCEL_FAILURE: ${err}`);
          }
        }
        break;

      case "payment_intent.payment_failed":
        console.error("PAYMENT_FAILED: Transaction declined");
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  app.use(express.json()); // Re-enable JSON for other routes
  app.use(cookieParser());

  // OMS Microservice Route
  app.use("/api/oms", omsRouter);

  // Middleware to verify JWT and roles
  const authenticate = (roles: string[] = []) => {
    return (req: any, res: any, next: any) => {
      const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Unauthorized" });

      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        if (roles.length && !roles.includes(decoded.role)) {
          return res.status(403).json({ error: "Forbidden" });
        }
        next();
      } catch (err) {
        res.status(401).json({ error: "Invalid token" });
      }
    };
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Araize Elite API is running" });
  });

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    // In a real app, you'd fetch the user from Firestore here
    // For this demo, we'll simulate the check
    if (email === "azaaedaa@gmail.com" && password === "admin123") {
      const token = jwt.sign({ email, role: "super_admin", uid: "super-admin-id" }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      return res.json({ token, user: { email, role: "super_admin", uid: "super-admin-id" } });
    }
    res.status(401).json({ error: "Invalid credentials" });
  });

  // Auth Sync - Bridge Firebase Auth with custom JWT session
  app.post("/api/auth/sync", async (req, res) => {
    const { idToken, email, uid } = req.body;
    if (!idToken) return res.status(400).json({ error: "Missing ID Token" });

    try {
      // Verify the Firebase ID Token
      // In a real environment with proper credentials, we'd use:
      // const decodedToken = await admin.auth().verifyIdToken(idToken);
      // For this demo, we'll trust the client if we can't verify (simulated)
      
      let role = "user";
      if (email === "azaaedaa@gmail.com") role = "super_admin";

      const token = jwt.sign({ email, role, uid }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ success: true, role });
    } catch (error) {
      console.error("AUTH_SYNC_ERROR:", error);
      res.status(401).json({ error: "Invalid Firebase Token" });
    }
  });

  // Stripe Payment Intent
  app.post("/api/create-payment-intent", authenticate(["user", "admin", "super_admin"]), async (req, res) => {
    try {
      const { amount, currency = "usd", items } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata: { items: JSON.stringify(items.map((i: any) => i.bookId)) },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe Checkout Session - High Availability & Security
  app.post("/api/create-checkout-session", authenticate(["user", "admin", "super_admin"]), async (req, res) => {
    try {
      const { items, success_url, cancel_url, userId, idempotencyKey, orderId } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "BAD_REQUEST: Cart is empty" });
      }

      const line_items = items.map((item: any) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
            images: item.coverImage ? [item.coverImage] : [],
            metadata: {
              bookId: item.bookId,
            },
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url,
        customer_email: (req as any).user.email,
        metadata: {
          userId,
          orderId: orderId || "none",
          idempotencyKey: idempotencyKey || "none",
          items: JSON.stringify(items.map((i: any) => ({ bookId: i.bookId, quantity: i.quantity }))),
        },
      }, {
        idempotencyKey: idempotencyKey,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("STRIPE_SESSION_ERROR:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR: Failed to initiate secure checkout" });
    }
  });

  // Admin Routes
  app.get("/api/admin/stats", authenticate(["admin", "super_admin"]), (req, res) => {
    res.json({ revenue: 125000, users: 1240, orders: 48 });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve static files from dist (which includes public contents)
    app.use(express.static(distPath));
    // Catch-all for SPA routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
