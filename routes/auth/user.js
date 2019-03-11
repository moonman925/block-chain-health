const express = require("express");
const router = express.Router();
const uuid = require("uuid");
const User = require("../../models/user");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/health", { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("connected");
});

let user = require("../../models/user");
router.post("/register", (req, res) => {
  // res.send("test");
  const name = req.body.name;
  const phone = req.body.phone;
  const username = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;

  req.checkBody("name", "名字不允许为空").notEmpty();
  req.checkBody("phone", "手机号不允许为空").notEmpty();
  req.checkBody("username", "用户名不允许为空").notEmpty();
  req.checkBody("password", "密码不允许为空").notEmpty();
  req.checkBody("password2", "密码不一致").equals(req.body.password);

  let err = req.validationErrors();

  if (err) {
    res.send(err);
  } else {
    let newUser = new User({
      name: name,
      phone: phone,
      username: username,
      password: password,
      _id: uuid.v4()
    });
    newUser.save(err => {
      if (err) {
        res.json({ err: err });
        return;
      } else {
        res.json({ msg: "success!" });
      }
    });
  }
});

router.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  let query = { username: username };
  User.findOne(query, (err, user) => {
    if (err) {
      res.json(err);
      return;
    }
    if (!user) {
      res.json({ msg: "找不到用户" });
      return;
    }
    if (user.password === password) {
      res.json({ user });
      return;
    } else {
      res.json({ msg: "密码错误" });
      return;
    }
  });
});

router.get("/logout", (req, res) => {
  res.json({ msg: "logout!" });
});

module.exports = router;
