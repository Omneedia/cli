module.exports = function (socket, app, express, io, ENVIRONMENT) {
  (async () => {
    for await (let response of socket.receiver("#login")) {
      socket.setAuthToken({
        user: JSON.parse(response),
      });
      socket.emit("login", "ok");
    }
  })();
  (async () => {
    for await (let response of socket.receiver("#login_failed")) {
      socket.emit("login", "ko");
    }
  })();
  (async () => {
    // Set up a loop to handle and respond to RPCs.
    for await (let request of socket.procedure("auth")) {
      request.end("Success");
    }
  })();
  (async () => {
    // Set up a loop to handle and respond to RPCs.
    for await (let request of socket.procedure("auth_failed")) {
      request.end("Success");
    }
  })();
  (async () => {
    for await (let { socket } of io.listener("disconnection")) {
      console.log("disconnected client id#" + socket.id);
    }
  })();
};
