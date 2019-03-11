const express = require("express");
const path = require("path");
const logger = require("./middleWare/logger");
const app = express();
const expressValidator = require("express-validator");
// app.use(logger);

//BodyParser MiddleWare
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//E-validate
app.use(
  expressValidator({
    errorFormatter: function(param, msg, value) {
      let namespace = param.split("."),
        root = namespace.shift(),
        formParam = root;

      while (namespace.length) {
        formParam += "[" + namespace.shift() + "]";
      }
      return {
        param: formParam,
        msg: msg,
        value: value
      };
    }
  })
);

//登陆确认
app.get("*", (req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

//set static folder
//在public folder下的html自动生成静态网页
app.use(express.static(path.join(__dirname, "public")));

app.use("/apis/members", require("./routes/apis/member"));
app.use("/user", require("./routes/auth/user"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ok:${PORT}`));
