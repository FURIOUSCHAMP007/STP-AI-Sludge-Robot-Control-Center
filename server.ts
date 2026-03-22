import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  let botSocket: any = null;

  io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // 1. FROM DASHBOARD -> TO ROBOT
    socket.on('bot_move', (data) => {
      io.emit('bot_move', data); 
    });

    socket.on('bot_bucket', (data) => {
      io.emit('bot_bucket', data);
    });

    // 2. FROM ROBOT -> TO DASHBOARD
    socket.on('sensor_update', (data) => {
      io.emit('sensor_update', data);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Disconnected: ${socket.id}`);
    });
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
