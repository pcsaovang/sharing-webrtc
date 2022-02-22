// Creating the peer
const peer = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun2.1.google.com:19302",
    },
  ],
});

// Connecting to socket
const socket = io();

let callButton = document.querySelector("#call");

const onSocketConnected = async () => {
  // const stream = await navigator.mediaDevices.getUserMedia({
  //   video: true,
  //   audio: true,
  // });

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true
  })

  document.querySelector("#localVideo").srcObject = stream;
  stream.getTracks().forEach((track) => peer.addTrack(track, stream));
};

// Handle call button
callButton.addEventListener("click", async () => {
  const localPeerOffer = await peer.createOffer();
  await peer.setLocalDescription(new RTCSessionDescription(localPeerOffer));
  sendMediaOffer(localPeerOffer);
});

// Create media offer
socket.on("mediaOffer", async (data) => {
  console.log("Socket on mediaOffer");
  await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
  const peerAnswer = await peer.createAnswer();
  await peer.setLocalDescription(new RTCSessionDescription(peerAnswer));

  sendMediaAnswer(peerAnswer, data);
});

// Create media answer
socket.on("mediaAnswer", async (data) => {
  console.log("Socket on mediaAnswer");
  await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// ICE layer
peer.onicecandidate = (event) => {
  sendIceCandidate(event);
};

socket.on("remotePeerIceCandidate", async (data) => {
  console.log("Socket on remotePeerIceCandidate");
  try {
    const candidate = new RTCIceCandidate(data.candidate);
    await peer.addIceCandidate(candidate);
  } catch (error) {}
});

peer.addEventListener("track", (event) => {
  const [stream] = event.streams;
  document.querySelector("#remoteVideo").srcObject = stream;
});

let selectedUser;

const sendMediaAnswer = (peerAnswer, data) => {
  socket.emit("mediaAnswer", {
    answer: peerAnswer,
    from: socket.id,
    to: data.from,
  });
};

const sendMediaOffer = (localPeerOffer) => {
  socket.emit("mediaOffer", {
    offer: localPeerOffer,
    from: socket.id,
    to: selectedUser,
  });
};

const sendIceCandidate = (event) => {
  socket.emit("iceCandidate", {
    to: selectedUser,
    candidate: event.candidate,
  });
};

socket.on("update-user-list", ({ userIds }) => {
  console.log("Socket on update-user-list");
  const userList = document.querySelector("#usersList");
  const usersToDisplay = userIds.filter((id) => id !== socket.id);
  userList.innerHTML = "";

  usersToDisplay.forEach((user) => {
    const userItem = document.createElement("div");
    userItem.innerHTML = user;
    userItem.className = "user-item";
    userItem.addEventListener("click", () => {
      const userElements = document.querySelectorAll(".user-item");
      userElements.forEach((element) => {
        element.classList.remove("user-item--touched");
      });

      userItem.classList.add("user-item-touched");
      selectedUser = user;
    });

    userList.appendChild(userItem);
  });
});

socket.on("connect", () => {
  console.log("Socket on connect");
  onSocketConnected();
  socket.emit("requestUserList");
});

console.log(peer);

//https://github.com/jakub-leszczynski/video-calling-app-example/blob/master/public/index.js