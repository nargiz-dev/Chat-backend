const mongoose = require("mongoose");
const connection = mongoose.createConnection(
  "mongodb+srv://nargiz:0703359500@cluster0.2vwuu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);


const Schema = mongoose.Schema;

const UsersSchema = new Schema({
  fullName: String,
  username: String,
  position: String,
  image: String,
  timestamp: { type: Date, default: Date.now },
});

const MessagesSchema = new Schema({
  fromUser: Schema.Types.ObjectId,
  toUser: Schema.Types.ObjectId,
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const SessionsSchema = new Schema({
  userId: Schema.Types.ObjectId,
  accessToken: String,
  timestamp: { type: Date, default: Date.now },
});

const User = connection.model("Users", UsersSchema);
const Message = connection.model("Message", MessagesSchema);
const Session = connection.model("Session", SessionsSchema);

module.exports = { User, Message, Session };
