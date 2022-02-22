const express = require("express");
const path = require("path");

const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(path.join(__dirname, "../public")));

let connectedUsers = [];

io.on("connection", (socket) => {
  connectedUsers.push(socket.id);

  socket.on("disconnect", () => {
    console.log("Socket on disconnect");
    connectedUsers = connectedUsers.filter((user) => user !== socket.id);
    socket.broadcast.emit("update-user-list", { userIds: connectedUsers });
  });

  socket.on("mediaOffer", (data) => {
    console.log("Socket on mediaOffer", data);
    socket.to(data.to).emit("mediaOffer", {
      from: data.from,
      offer: data.offer,
    });
  });

  socket.on("mediaAnswer", (data) => {
    console.log("Socket on mediaAnswer", data);
    socket.to(data.to).emit("mediaAnswer", {
      from: data.from,
      answer: data.answer,
    });
  });

  socket.on("iceCandidate", (data) => {
    console.log("Socket on iceCandidate", data);
    socket.to(data.to).emit("remotePeerIceCandidate", {
      candidate: data.candidate,
    });
  });

  socket.on("requestUserList", () => {
    console.log("Socket on requestUserList");
    socket.emit("update-user-list", { userIds: connectedUsers });
    socket.broadcast.emit("update-user-list", { userIds: connectedUsers });
  });
});

http.listen(3000, () => {
  console.log("Listening on port 3000");
});

//https://medium.com/liki-blog/peer-to-peer-video-calling-app-with-webrtc-under-15-minutes-9fce4f15a2d4
//https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
//https://tsh.io/blog/how-to-write-video-chat-app-using-webrtc-and-nodejs/
//https://webrtc.github.io/samples/