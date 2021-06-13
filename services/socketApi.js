var io = require("socket.io")();

io.on("connection", (socket) => {
  console.log("a user connected");
});

module.exports = io;
