const express = require("express");
const http = require("http");
const cors = require("cors");
const { User, Message, Session } = require("./src/connect");
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
//API ROUTES
require("./src/api")(app);

require("./src/socket")(io);

server.listen(PORT, () => {
  console.log("Chat server is running on *:" + PORT);
});
