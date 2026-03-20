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
  app.use(express.json());
  app.use(cookieParser());

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

  // Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { items, success_url, cancel_url, userId } = req.body;

      const line_items = items.map((item: any) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
            images: [item.coverImage],
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
        metadata: {
          userId,
          items: JSON.stringify(items.map((i: any) => ({ bookId: i.bookId, quantity: i.quantity }))),
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
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
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
