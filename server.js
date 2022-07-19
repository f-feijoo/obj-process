require("./db/mongoconfig");
require('./passport/local.js')
const express = require("express");
const productos = require("./routes/productos.js");
const http = require("http");
const { knexMySql } = require("./db/db.js");
const Mensaje = require("./models/Mensajes");
const { normalize, schema } = require("normalizr");
const { inspect } = require("util");
const session = require("express-session");
const passport = require('passport')



const MongoStore = require("connect-mongo");
const advancedOptions = { useNewUrlParser: true, useUnifiedTopology: true };

const app = express();
const server = http.createServer(app);

app.set("views", "./views");
app.set("view engine", "ejs");

const { Server } = require("socket.io");
const moment = require("moment");
const io = new Server(server);

app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", productos);
app.use(
  session({
    store: MongoStore.create({
      //En Atlas connect App :  Make sure to change the node version to 2.2.12:
      mongoUrl:
        "mongodb://anyone:1svhFxNnP6jwqW8F@proyecto-final-shard-00-00.obuuu.mongodb.net:27017,proyecto-final-shard-00-01.obuuu.mongodb.net:27017,proyecto-final-shard-00-02.obuuu.mongodb.net:27017/?ssl=true&replicaSet=atlas-xzhi9f-shard-0&authSource=admin&retryWrites=true&w=majority",
      mongoOptions: advancedOptions,
    }),
    secret: "shhhhhhhhhhhhhhhhhhhhh",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 600000,
    },
  })
);
app.use(passport.initialize())
app.use(passport.session())

const autorSchema = new schema.Entity("autores");

const mensajeSchema = new schema.Entity("mensajes", {
  id: { type: String },
  autor: autorSchema,
  texto: "",
  timestamp: { type: String },
});

const chatSchema = new schema.Entity("chats", {
  id: { type: String },
  nombre: "",
  mensajes: [mensajeSchema],
});

io.on("connection", (socket) => {
  knexMySql
    .from("productos")
    .select("*")
    .then((resp) => {
      socket.emit("productos", resp);
      socket.on("dataMsn", (x) => {
        const { title, price, thumbnail } = x;
        let objNew = {
          title: title,
          price: price,
          thumbnail: thumbnail,
        };
        knexMySql("productos")
          .insert(objNew)
          .then(() => {
            console.log("Registro ok!");
            knexMySql
              .from("productos")
              .select("*")
              .then((resp) => {
                io.sockets.emit("productos", resp);
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });
  const getAll = async () => {
    try {
      const documentos = await Mensaje.find();
      return JSON.parse(JSON.stringify(documentos));
    } catch {}
  };
  getAll().then((resp) => {
    const chat = {
      id: `${Math.floor(Math.random() * 1000)}`,
      nombre: "Centro de Mensajes",
      mensajes: resp,
    };
    const mensajesNormalized = normalize(chat, chatSchema);
    function print(objeto) {
      console.log(inspect(objeto, false, 12, true));
    }
    // print(mensajesNormalized)
    socket.emit("mensajes", chat); // Reemplazar chat por mensajesNormalized para usar normalizacion y ver el frontend
  });

  socket.on("Msn", (x) => {
    const { autor, texto } = x;
    let newMen = {
      id: `${Math.floor(Math.random() * 1000)}`,
      autor: autor,
      texto: texto,
      timestamp: moment().format("DD/MM/YYYY hh:mm:ss"),
    };
    const saveMen = async (ms) => {
      let doc = Mensaje.create(ms);
      getAll().then((resp) => {
        const chat = {
          id: `${Math.floor(Math.random() * 1000)}`,
          nombre: "Centro de Mensajes",
          mensajes: resp,
        };
        const mensajesNormalized = normalize(chat, chatSchema);
        io.sockets.emit("mensajes", mensajesNormalized);
      });
    };
    saveMen(newMen);
  });
});

//  ---------- LOGIN ----------


// ---------- Funcion para autorizar, si estas logeado te manda a la ruta principal, sino a la ruta /login ----------

function auth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

app.get('/registro', (req, res)=>{
  res.render('register')
})

app.post("/registro", passport.authenticate('registro', {
  successRedirect: '/login',
failureRedirect: '/errorRegistro',

}));

app.get('/errorRegistro', (req, res) => {
res.render('error-register')
})

// ---------- Ruta /login te direcciona al formulario ----------

app.get("/login", (req, res) => {
  res.render("login");
});

// ---------- Metodo post para cargar el usuario ----------

app.post("/login", passport.authenticate('login', {
  successRedirect: '/',
  failureRedirect: '/errorLogin',
  
})
);

app.get('/errorLogin', (req, res) => {
  res.render('error-login')
})

// ---------- Ruta /logout te despide si estabas logeado, sino te redirecciona a la ruta principal ----------

app.get("/logout", (req, res) => {
  const user = req.user.username;
  if (user) {
    req.session.destroy((err) => {
      if (!err) {
        res.render("logout", { user: user });
      } else res.send({ status: "Logout ERROR", body: err });
    });
  } else {
    res.redirect("/");
  }
});

//  ---------- Ruta principal con un middleware, si estas logeado carga todo normal, sino el middleware te redirecciona ----------

app.get("/", auth, (req, res) => {
  knexMySql
    .from("productos")
    .select("*")
    .then((resp) => {
      res.render("index", {
        data: resp,
        user: req.user.username,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", (req, res) => {
  let objNew = {
    title: req.body.title,
    price: req.body.price,
    thumbnail: req.body.thumbnail,
  };
  knexMySql("productos")
    .insert(objNew)
    .then(() => {
      console.log("Registro ok!");
    })
    .catch((err) => {
      console.log(err);
    });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(
    `Servidor http creado con express escuchando en el puerto ${PORT}`
  );
});
