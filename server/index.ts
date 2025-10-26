import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCsvEnv(value?: string) {
  return (
    value
      ?.split(",")
      .map(entry => entry.trim())
      .filter(Boolean) ?? []
  );
}

function parsePositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.disable("x-powered-by");

  if (process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
  }

  const requestLimiter = rateLimit({
    windowMs: parsePositiveNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: parsePositiveNumber(process.env.RATE_LIMIT_MAX, 300),
    standardHeaders: true,
    legacyHeaders: false,
  });

  const scriptSrc = ["'self'", ...parseCsvEnv(process.env.CSP_SCRIPT_SRC)];
  const connectSrc = ["'self'", ...parseCsvEnv(process.env.CSP_CONNECT_SRC)];
  const imgSrc = ["'self'", "data:", "blob:", ...parseCsvEnv(process.env.CSP_IMG_SRC)];
  const frameAncestors = parseCsvEnv(process.env.CSP_FRAME_ANCESTORS);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "default-src": ["'self'"],
          "base-uri": ["'self'"],
          "object-src": ["'none'"],
          "script-src": scriptSrc,
          "script-src-attr": ["'none'"],
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
          "img-src": imgSrc,
          "connect-src": connectSrc,
          "frame-ancestors": frameAncestors.length ? frameAncestors : ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
      },
    })
  );

  app.use(requestLimiter);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(
    express.static(staticPath, {
      setHeaders: (res, servedPath) => {
        if (servedPath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        }
      },
    })
  );

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
