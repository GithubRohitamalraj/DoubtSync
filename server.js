import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const users = {};

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    users[userId] = socket.id;
  });

  socket.on("send_message", (msg) => {
    const receiverSocket = users[msg.receiver_id];
    if (receiverSocket) io.to(receiverSocket).emit("receive_message", msg);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
