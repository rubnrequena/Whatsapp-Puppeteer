document.addEventListener("DOMContentLoaded",() => {
  setTimeout(()=>$('.alert').alert('close'),2500);
  render.alert("Hola","#msg");

  $('#enviar').submit((e) => {
    e.preventDefault(e);
    let destinos = $('#numero');
    let mensaje = $('#mensaje');

    $.post( "/enviar", { name: "John", time: "2pm" })
    .done(function( data ) {
      alert( "Data Loaded: " + data );
    });
  })
})