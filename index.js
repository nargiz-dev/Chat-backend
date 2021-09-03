const express = require("express");
const crypto = require("crypto");
const http = require("http");
const cors = require("cors");
const { User, Message, Session } = require("./connect");
const app = express();

app.use(cors());
app.use(express.json());

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

/** REST API for users  */
app.get("/users", (req, res) => {
  res.send(users);
});

app.get("/users/:id", (req, res) => {
  User.findById(req.params.id, (err, user) => {
    if (err) {
      throw err;
    }
    if (!user) {
      res
        .status(404)
        .send({ error: true, message: "User with this ID does not exist" });
      return;
    }
    const { __v, ...theRest } = user._doc;
    res
      .status(200)
      .send({ error: false, message: "Successful", payload: theRest });
  });
});

app.post("/users", (req, res) => {
  console.log("post");
  User.findOne({ username: req.body.username }, (err, existingUser) => {
    if (err) {
      throw err;
    }
    if (existingUser) {
      res.status(400).send({ error: true, message: "User already exists" });
      return;
    }

    const user = new User();
    user.fullName = req.body.fullName;
    user.username = req.body.username;
    user.position = req.body.position;
    user.image = req.body.image;

    user.save((err, createdUser) => {
      if (err) {
        res.status(500).send({ error: true, message: "Cannot insert user" });
        return;
      }

      const accessToken = crypto.randomBytes(32).toString("base64");
      const session = new Session();
      session.userId = createdUser.id;
      session.accessToken = accessToken;

      session.save((err) => {
        if (err) {
          throw err;
        }

        res.status(201).send({
          error: false,
          message: "User created successfully",
          accessToken,
        });
      });
    });
  });
});

app.delete("/users/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id, (err) => {
    if (err) {
      res.status(500).send({ error: true, message: "Cannot delete user" });
      return;
    }
    res
      .status(200)
      .send({ error: false, message: "User deleted successfully" });
  });
});

app.post("/users/:id/messages", (req, res) => {
  const accessToken = req.headers["authorization"];
  Session.findOne({ accessToken: accessToken }, (err) => {
    if (err) {
      res.status(500).send({ error: true, message: "Cannot find userId" });
    }
    res
      .status(200)
      .send({ error: false, message: "UserId was found successfully" });
      
  });
});


//res.end(); // delete this or response will end here

const message = new Message();
message.fromUser = Session.userId; // TODO: set user id here
message.toUser = req.params.id;
console.log(req.params.id);
message.content = req.body.content;

message.save((err) => {
  if (err) {
    res.status(500).send({ error: true, message: "Cannot insert message" });
    return;
  }
  res.status(201).send({ error: false, message: "Message sent successfully" });
});

app.get("/users/:id/messages", (req, res) => {
  // TODO: get messages by this user ID
  Message.findOne({ fromUser }, (err) => {
    if (err) {
      res
        .status(500)
        .send({
          error: true,
          messsage: "cannot find messages from this userId",
        });
      return;
    }
    res
      .status(201)
      .send({ error: false, message: "messages was found successfully" });
  });
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
