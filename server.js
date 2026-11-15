const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const WebSocket = require("ws");
const cookie = require("cookie");
const signature = require("cookie-signature");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const PORT = process.env.PORT || 3000;
const SESSION_SECRET =
  process.env.SESSION_SECRET || "savelife-bridge-demo-secret-change-this";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
  name: "connect.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000
  }
});

app.use(sessionMiddleware);

app.use(express.static(path.join(__dirname, "public")));

const users = new Map();

let activeAlerts = [
  {
    id: "demo-alert-1",
    name: "Demo Emergency",
    type: "Medical Emergency",
    location: "Gudlavalleru",
    latitude: 16.533,
    longitude: 81.0,
    status: "ACTIVE",
    timestamp: Date.now()
  }
];

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "Please login first."
    });
  }

  next();
}

function getCurrentUser(req) {
  return users.get(req.session.userId);
}

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (users.has(normalizedEmail)) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please login."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role
    };

    users.set(normalizedEmail, user);

    req.session.userId = normalizedEmail;

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Session creation failed."
        });
      }

      res.json({
        success: true,
        message: "Registration successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed."
    });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Enter email and password."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = users.get(normalizedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found. Please register."
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password."
      });
    }

    req.session.userId = normalizedEmail;

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Login session failed."
        });
      }

      res.json({
        success: true,
        message: "Login successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed."
    });
  }
});

// CHECK LOGIN SESSION
app.get("/api/me", (req, res) => {
  const user = getCurrentUser(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Not logged in."
    });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// LOGOUT
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed."
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      success: true,
      message: "Logged out successfully."
    });
  });
});

// PUBLIC STATUS
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    server: "SaveLife Bridge",
    status: "ONLINE",
    activeAlerts: activeAlerts.length
  });
});

// GET ALERTS
app.get("/api/alerts", requireAuth, (req, res) => {
  res.json({
    success: true,
    alerts: activeAlerts
  });
});

// DOWNLOAD ZIP
app.get("/api/download-zip", requireAuth, (req, res) => {
  const zipPath = path.join(__dirname, "online-save-life-bridge.zip");

  res.download(zipPath, (error) => {
    if (error) {
      console.error("ZIP download error:", error);

      if (!res.headersSent) {
        res.status(404).json({
          success: false,
          message: "ZIP file not found."
        });
      }
    }
  });
});

// WEBSOCKET AUTHENTICATION
server.on("upgrade", (request, socket, head) => {
  const parsedUrl = new URL(
    request.url,
    `http://${request.headers.host}`
  );

  if (parsedUrl.pathname !== "/") {
    socket.destroy();
    return;
  }

  const cookies = cookie.parse(request.headers.cookie || "");
  const signedCookie = cookies["connect.sid"];

  if (!signedCookie) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  const sessionId = signature.unsign(
    signedCookie.startsWith("s:")
      ? signedCookie.slice(2)
      : signedCookie,
    SESSION_SECRET
  );

  if (!sessionId) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  sessionMiddleware(
    request,
    {},
    () => {
      // The session middleware loads the authenticated session.
      const userId = request.session && request.session.userId;

      if (!userId || !users.has(userId)) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.user = users.get(userId);
        wss.emit("connection", ws, request);
      });
    }
  );
});

// WEBSOCKET CONNECTION
wss.on("connection", (ws) => {
  ws.send(
    JSON.stringify({
      type: "INIT_STATE",
      alerts: activeAlerts
    })
  );

  ws.on("message", (message) => {
    try {
      const msg = JSON.parse(message.toString());

      // CREATE SOS
      if (msg.type === "TRIGGER_SOS") {
        const alert = {
          id: "sos-" + crypto.randomUUID(),
          name: msg.name || ws.user.name,
          userId: ws.user.id,
          type: msg.category || "Emergency",
          location: msg.location || "Unknown location",
          latitude: Number(msg.latitude) || 0,
          longitude: Number(msg.longitude) || 0,
          status: "ACTIVE",
          timestamp: Date.now()
        };

        activeAlerts.unshift(alert);

        // Send actual generated ID to the sender.
        ws.send(
          JSON.stringify({
            type: "SOS_CREATED",
            alert
          })
        );

        broadcast({
          type: "NEW_SOS_ALERT",
          alert
        });
      }

      // RESPONDER ACCEPT
      if (msg.type === "RESPONDER_ACCEPT") {
        const alert = activeAlerts.find(
          (item) => item.id === msg.alertId
        );

        if (alert && alert.status === "ACTIVE") {
          alert.status = "EN_ROUTE";
          alert.responder = ws.user.name;

          broadcast({
            type: "ALERT_UPDATED",
            alert
          });
        }
      }

      // RESOLVE ALERT
      if (msg.type === "RESOLVE_ALERT") {
        const alert = activeAlerts.find(
          (item) => item.id === msg.alertId
        );

        if (alert) {
          alert.status = "RESOLVED";

          broadcast({
            type: "ALERT_RESOLVED",
            alert
          });
        }
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

server.listen(PORT, () => {
  console.log(`SaveLife Bridge server running on port ${PORT}`);
});