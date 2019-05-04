var handlers = {};

module.exports =  {
  dispatch,addListener
}

function addListener (name,handler) {
  handlers[name] = handler;
}
function dispatch (num,msg) {
  console.log(handlers);
  console.log("dispatch",num,msg);
  let command = msg.split(" ")[0];

  console.log("command",command,command=="eco",command==="eco");
  let service = handlers[command];
  console.log(handlers["eco"]);
  console.log("services",service);
  if (typeof service === "function") service.call(this,num,msg);
}
