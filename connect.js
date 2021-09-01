const mongoose = require("mongoose");
const conn = mongoose.createConnection(
  "mongodb+srv://nargiz:0703359500@cluster0.da10q.mongodb.net/QuickChat?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
console.log(conn);
const Schema = mongoose.Schema;

const UsersSchema = new Schema({
  username: String,
  position: String,
  image: String,
  id: String,
});
const Users = conn.model("Users", UsersSchema);
console.log(Users);

const user = new Users();
user.username = "Nergiz";
user.position = "developer";
user.image = "url";
user.id = "123";

user.save(function (err) {
  console.log(err);
});

