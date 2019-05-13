const render = {
  alert: function (txt="",className="success",close,parent) {
    let closeBtn = close?`<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>`:``;
    let html = `<div class="alert alert-success alert-dismissible fade show" role="alert">
                  <strong>${txt}</strong>
                  ${closeBtn}
                </div>`;
    document.getElementById("msg").insertAdjacentHTML('beforeend',html);
  }
}