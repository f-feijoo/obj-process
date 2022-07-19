const passport = require("passport");
const { Strategy } = require("passport-local");
const Usuarios = require("../models/usuarios.js");

const LocalStrategy = Strategy;

passport.use(
  "registro",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, username, password, done) => {
      const usuarioBD = await Usuarios.findOne({ username });
      if (usuarioBD) {
        return done(null, false);
      }
      const usuarioNuevo = new Usuarios();
      usuarioNuevo.username = username;
      usuarioNuevo.password = usuarioNuevo.encriptar(password);
      await usuarioNuevo.save();
      done(null, usuarioNuevo);
    }
  )
);

passport.use(
  "login",
  new LocalStrategy({
    usernameField: "username",
    passwordField: "password",
    passReqToCallback: true,
  },
  async (req, username, password, done) => {
    const usuarioBD = await Usuarios.findOne({ username });
    if (!usuarioBD) {
      return done(null, false);
    }
    if (!usuarioBD.comparar(usuarioBD.password , password)) {
      return done(null, false);
    }
    return done(null, usuarioBD);
  }
));

passport.serializeUser((usuario, done) => {
  done(null, usuario._id);
});

passport.deserializeUser(async (id, done) => {
  const usuario = await Usuarios.findById(id);
  done(null, usuario);
});
