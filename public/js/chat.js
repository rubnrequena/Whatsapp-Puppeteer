var form = $('#chat');
form.submit(function (e) {
  e.preventDefault();
  let departamento = $('#dep').val();
  let nombre = $('#nombre').val();
  let contacto = $('#contacto').val();
  let mensaje = $('#mensaje').val();

  axios.post("/chat/",{departamento,nombre,contacto,mensaje},(data)=> {
    console.log(data);
  })
})