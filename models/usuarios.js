const { Schema, model } = require("mongoose");
const bcrypt = require('bcrypt')

const usuarioSchema = new Schema({
  username: {
    type: String,
  },
  password: {
    type: String,
  },
});

usuarioSchema.methods.encriptar = (contraseña) => {
  return bcrypt.hashSync(contraseña, bcrypt.genSaltSync(5))
}

usuarioSchema.methods.comparar = (encriptada, contraseña) =>{
  return bcrypt.compareSync(contraseña, encriptada)
}

module.exports = model("usuarios", usuarioSchema);
