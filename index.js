const express = require("express");
const http = require("http");
const cors = require("cors");
const app = express();
app.use(cors());
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/hello", (req, res) => {
  res.send({
    message: "World!",
  });
});

let users = [];
app.get("/users", (req, res) => {
  res.send(users);
});

io.on("connection", (socket) => {
  const { username, position } = socket.handshake.auth;
  const userAleradyExists = users.find((user) => user.username === username);

  if (!userAleradyExists && username && position) {
    users.push({ username, position, id: socket.id });
    socket.join(username);
    socket.broadcast.emit("new user", { username, position, id: socket.id });
  }
  socket.on("chat message", (message, username, room) => {
    // TODO: send message to room
    if (room === "") {
      socket.broadcast.emit(
        "receive message",
        message,
        socket.handshake.auth.username
      );
    } else {
      socket
        .to(room)
        .emit("receive message", message, socket.handshake.auth.username);
    }
  });

  socket.on("typing", (msg) => {
    io.emit("typing", { id: socket.id, msg: msg });
  });

  socket.on("stopTyping", () => {
    io.emit("stopTyping");
  });

  socket.on("disconnect", () => {
    console.log(
      `${users.find((user) => user.id === socket.id).username} disconnected`
    );
    users = users.filter((user) => user.id !== socket.id);
    io.emit("user disconnected", socket.id);
  });
});
server.listen(PORT, () => {
  console.log("listening on *:" + PORT);
});
