const Express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongodb = require("mongodb");
const bcrypt = require("bcryptjs");

const app = Express();
app.use(Express.json());
app.use(cors());
dotenv.config();

const port = process.env.PORT || 3001;
const mongoClient = mongodb.MongoClient;
const objectId = mongodb.ObjectID;
const DB_URL = process.env.DBURL || "mongodb://127.0.0.1:27017";

app.post("/register", async (req, res) => {
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("SC_Users");

    const password = await bcrypt.hash(req.body.password, 10);

    const data = {
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
      password: password,
      cartItems: [],
      address: {},
    };

    const result = await db.collection("users").insertOne(data);
    res.send({
      status: "success",
    });
    client.close();
  } catch (err) {
    res.send({
      status: "failed",
    });
    client.close();
  }
});

app.post("/login", async (req, res) => {
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("SC_Users");

    const uname = req.body.username;
    const pass = req.body.password;

    const result = await db
      .collection("users")
      .find({ username: uname })
      .project({ _id: 0 })
      .toArray();

    if (result.length === 0) res.send({ status: "Username not found!" });
    else {
      const hashPass = result[0].password;
      const validPass = await bcrypt.compare(pass, hashPass);
      if (validPass) {
        res.send({
          status: "success",
          cartItems: result[0].cartItems,
          name: result[0].name,
          email: result[0].email,
          address: result[0].address,
        });
      } else {
        res.send({ status: "Invalid password" });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/adduseraddress", async (req, res) => {
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("SC_Users");

    const result = await db.collection("users").updateOne(
      { username: req.body.username },
      {
        $set: {
          "address.drno": req.body.drno,
          "address.street": req.body.street,
          "address.city": req.body.city,
          "address.pincode": req.body.pincode,
          "address.states": req.body.states,
        },
      }
    );
    res.send({
      status: "success",
    });
    client.close();
  } catch (err) {
    console.log(err);
    res.send({
      status: "failed",
    });
    client.close();
  }
});

app.get("/products", async (req, res) => {
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("ShoppingCart");

    const result = await db.collection("Items").find({}).toArray();

    res.send(result);
    client.close();
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/getproductdetails/:id", async (req, res) => {
  const Id = parseInt(req.params.id);
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("ShoppingCart");
    const result = await db
      .collection("Items")
      .find({ id: Id })
      .project({ _id: 0 })
      .toArray();
    res.send(result);
    // res.json(result[0]);
    client.close();
  } catch (err) {
    console.log(err);
    res.send({});
  }
});

app.get("/getCartItems/:username", async (req, res) => {
  const userName = req.params.username;
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("SC_Users");
    const result = await db
      .collection("users")
      .find({ username: userName })
      .project({ _id: 0, cartItems: 1 })
      .toArray();
    res.send(result);
    client.close();
  } catch (err) {
    console.log(err);
    res.send({});
  }
});

app.post("/addItemToCart", async (req, res) => {
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("SC_Users");

    const uname = req.body.username;
    const id = req.body.id;

    const result = await db
      .collection("users")
      .update({ username: uname }, { $push: { cartItems: id } });

    res.send({ status: "success" });
  } catch (err) {
    console.log(err);
    res.send({ status: "failed" });
  }
});

app.post("/removeItemFromCart", async (req, res) => {
  try {
    const client = await mongoClient.connect(DB_URL);
    const db = client.db("SC_Users");

    const result = await db
      .collection("users")
      .update(
        { username: req.body.username },
        { $pull: { cartItems: req.body.id } }
      );

    res.send({ status: "success" });
  } catch (err) {
    console.log(err);
    res.send({ status: "failed" });
  }
});

app.post("/getproducts", async (req, res) => {
  try {
    const client = await mongoClient.connect(DB_URL);

    const db = client.db("ShoppingCart");

    // const watchList = await db1
    //   .collection("users")
    //   .find({ username: req.body.username })
    //   .project({ _id: 0, watchlist: 1 })
    //   .toArray();

    //if (Object.keys(watchList[0]).length > 0) {
    // const db2 = client.db("MovieDB");

    const result = await db
      .collection("Items")
      .find({ id: { $in: req.body.cartItems } })
      .project({ _id: 0 })
      .toArray();

    res.send({ status: "success", data: result });
    // } else {
    //   res.send({ status: "no data" });
    // }
    client.close();
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`::::  Server started and running on port ${port} ::::`);
});
