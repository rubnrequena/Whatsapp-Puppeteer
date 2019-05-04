var handlers = {};

module.exports =  {
  dispatch,addListener
}

function addListener (name,handler) {
  handlers[name] = handler;
}
function dispatch (num,msg) {
  let command = msg.split(" ")[0];
  let service = handlers[command];
  if (typeof service === "function") service.call(this,num,msg);
}
