const { User, Message, Session } = require("./connect");
const crypto = require("crypto");
const ta = require("time-ago");

module.exports = (app) => {
  app.get("/users", async (req, res) => {

    const accessToken = req.headers["authorization"];
    const session = await Session.findOne({ accessToken }).exec();
    const users = await User.find({ _id: { $ne: session.userId } });
    res.send({ error: false, payload: users });
  });

  app.get("/users/:id", async (req, res) => {
    const user = await User.findById(req.params.id).exec();
    if (user) {
      res.send({ error: false, message: "Successful", payload: user });
    } else {
      res
        .status(404)
        .send({ error: true, message: "User with this ID does not exist" });
    }
  });

  app.post("/users", async (req, res) => {
    const existingUser = await User.findOne({
      username: req.body.username,
    }).exec();
    if (existingUser) {
      res.status(400).send({ error: true, message: "User already exists" });
    } else {
      const user = new User();
      user.fullName = req.body.fullName;
      user.username = req.body.username;
      user.position = req.body.position;
      user.image = req.body.image;

      const savedUser = await user.save();

      const accessToken = crypto.randomBytes(32).toString("base64");
      const session = new Session();
      session.userId = savedUser.id;
      session.accessToken = accessToken;

      await session.save();
      res.status(201).send({
        error: false,
        message: "User created successfully",
        accessToken,
      });
    }
    app.delete("/users/:id", async (req, res) => {
      await User.findByIdAndDelete(req.params.id).exec();
      res.send({ error: false, message: "User deleted successfully" });
    });
  });

  app.post("/users/:id/messages", async (req, res) => {
    const accessToken = req.headers["authorization"];
    const session = await Session.findOne({ accessToken }).exec();
    const userId = req.params.id;

    const message = new Message();
    message.fromUser = session.userId; 
    message.toUser = req.params.id;
    message.content = req.body.content;

    await message.save();
  });


  app.get("/users/:id/messages", async (req, res) => {
    const accessToken = req.headers["authorization"];
    const session = await Session.findOne({ accessToken }).exec();
    const userId = req.params.id;

    const messages = await Message.find({
      $or: [
        {
          $and: [{ fromUser: session.userId }, { toUser: userId }],
        },
        {
          $and: [{ fromUser: userId }, { toUser: session.userId }],
        },
      ],
    });

    const processedMessages = messages.map((message) => {
      return {
        id: message._id,
        content: message.content,
        isFromSelf: message.fromUser.toString() === session.userId.toString(),
        time: ta.ago(new Date(message.timestamp)),
      };
    });

    res.send({ error: false, payload: processedMessages });
  });

}
