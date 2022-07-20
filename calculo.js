const calculo = (cant) => {
  let obj = {};
  for (i = 0; i < cant; i++) {
    let num = Math.floor(Math.random() * 1000);
    if (obj[num]) {
      obj[num] = obj[num] + 1;
    } else {
      obj[num] = 1;
    }
  }
  return obj
};

process.on('message',(cant)=>{
    process.send(calculo(cant))
})
