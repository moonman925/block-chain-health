const express = require("express");
const router = express.Router();
const session = require("express-session");
const cookieParser = require("cookie-parser");
const User = require("../../models/user");
const Hospitals = require("../../models/hospital");
const Web3 = require("web3");
const web3 = new Web3(Web3.givebProvider || "http://localhost:7545");
const abii = require("../../config/abi");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/health", { useNewUrlParser: true });
const db = mongoose.connection;

const Accounts = require("../../models/accounts");

let hos = require("../../models/realHospital.json");

///////////////////////
let patientRecContract;
let accounts;

let patientRec = new web3.eth.Contract(abii[0]);
const bytecode = abii[1]["object"];

function deployContract(name, gender, age, acc, callback) {
  let arg = [];
  arg.push(name);
  arg.push(gender);
  arg.push(age);
  patientRec
    .deploy({
      data: bytecode,
      arguments: arg
    })
    .send({ from: acc, gas: 1500000 }) //accounts[0] => 病人账号
    .then(res => {
      patientRecContract = res;
      callback();
    });
}
///////////////////////

router.use(session({ secret: "lhb" }));
router.use(cookieParser());

router.get("/", (req, res) => {
  if (req.session.username) res.json({ msg: "ok!" });
  else res.json({ msg: "not ok" });
});

//TODO: 搞真的数据
let pat = [
  {
    name: "xiaoli",
    rec: "1.shabi;2.xxxx"
  },
  {
    name: "xiaoliang",
    rec: "handsome"
  }
];

router.get("/hospitals", (req, res) => {
  Hospitals.find({}, (error, result) => res.json(result));
  //res.json({ msg: hos });
});

router.get("/hospitals/:name", (req, res) => {
  //TODO: 数据库检索、确认用户身份
  //res.json(req.params.name);
  Hospitals.find({ name: req.params.name }, (error, result) =>
    res.json(result)
  );
});

router.post("/hospitals/:name/reservation", (req, res) => {
  //TODO : same
  if (!req.session.username) res.json({ msg: "not ok!" });
  else {
    //res.json({ msg: "ok" });
    let query = { username: req.session.username };
    User.findOne(query, (err, result) => {
      Hospitals.findOne({ name: req.params.name }, (e, r) => {
        sampleContract = new web3.eth.Contract(abii[0], result.contract);
        sampleContract.methods
          .authens(r.address)
          .send({ from: result.acc })
          .then(re => res.json({ msg: re }))
          .catch(er => res.json({ msg: er }));

        let tmp = r.patient;
        tmp.push(result.name);
        r.patient = tmp;
        r.save();
        //写到修改病历去
        // sampleContract.methods
        //   .setRec("wohaokaixin")
        //   .send({ from: r.address })
        //   .then(rr => console.log(rr));
        //写到查看病历去
        // sampleContract.methods
        //   .getRec()
        //   .call({ from: r.address })
        //   .then(rr => console.log(rr));
      });
    });
  }
});

router.get("/check/:name", (req, res) => {
  //TODO : same
  let obj = pat.find(p => p.name === req.params.name);
  if (obj) res.json(obj);
  else res.json({ msg: "no such person!" });
});

router.post("/createinfo", (req, res) => {
  if (!req.session.username) res.json({ msg: "get logged in" });
  else {
    let cons = function() {
      //console.log(patientRecContract.options.address);
      let query = { username: req.session.username };
      User.findOne(query, (err, acc) => {
        acc.contract = patientRecContract.options.address;
        acc.save();
      });
    };
    let accountz;
    Accounts.findOne({ used: 0 }, (err, acc) => {
      acc.used = 1;
      User.findOne({ username: req.session.username }, (err, rs) => {
        rs.acc = acc.address;
        rs.save();
      });
      acc.save();
      deployContract("xiaoli", "male", 12, acc.address, cons);
    });
    //let acc = genAcc();//

    //把abi bytcode account[0]存起来
  }
});

router.get("/checkinfo/:name", (req, res) => {
  if (!req.session.username) res.json({ msg: "get logged in" });
  else {
    let sampleContract;
    Hospitals.find({ username: req.session.username }, (err, rr) => {
      User.find({ name: req.params.name }, (error, result) => {
        sampleContract = new web3.eth.Contract(abii[0], result[0].contract);
        sampleContract.methods
          .getRec()
          .call({ from: rr[0].address })
          .then(r => res.json({ msg: r }))
          .catch(er => res.json({ msg: "无权限！" }));
      });
    });

    // patientRecContract.methods
    //   .setRec()
    //   .send({ from: "0x2cE052ecEd6E076F515C4F2026B3ea22ab2da4d9" })
    //   .then(r => res.json({ msg: r }));
    // deployContract("xiaoli", "male", 12, accounts[0], cons);
  }
});

router.post("/edit/:name", (req, res) => {
  //TODO : same
  if (!req.session.username) res.json({ msg: "get logged in" });
  else {
    let sampleContract;
    User.find({ name: req.params.name }, (err, rr) => {
      Hospitals.find({ username: req.session.username }, (error, result) => {
        sampleContract = new web3.eth.Contract(abii[0], rr[0].contract);
        sampleContract.methods
          .setRec("test1")
          .send({ from: result[0].address })
          .then(r => res.json({ msg: r }));
        //.catch(e => res.json({ msg: e }));
      });
    });
  }
  // let newRec = ";3.taishabile";
  // let obj = pat.find(p => p.name === req.params.name);
  // if (obj) {
  //   let tmp = pat.find(p => p.name === req.params.name).rec + newRec;
  //   pat.find(p => p.name === req.params.name).rec = tmp;
  //   res.json(pat.find(p => p.name === req.params.name));
  // } else res.json({ msg: "no such person!" });
});

module.exports = router;
