const socket = new WebSocket('ws://' + window.location.host);

let peerConnection;
let localStream;
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    }
  ]
};
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');

startButton.onclick = startCall;

socket.onmessage = async function (event) {
  const message = JSON.parse(event.data);
  switch (message.type) {
    case 'offer':
      handleOffer(message.offer);
      break;
    case 'answer':
      handleAnswer(message.answer);
      break;
    case 'candidate':
      handleCandidate(message.candidate);
      break;
  }
};

socket.onerror = function (error) {
  console.error('WebSocket Error:', error);
};

socket.onclose = function (event) {
  console.log('WebSocket connection closed:', event.code, event.reason);
};

async function startCall() {
  try {
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: true
    };

    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.srcObject = localStream;

    createPeerConnection();

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.send(JSON.stringify({ type: 'offer', offer: offer }));

    document.getElementById('startButton').disabled = true;
    document.getElementById('hangupButton').disabled = false;

    // Set a timeout to check if the connection is established
    setTimeout(() => {
      if (peerConnection.iceConnectionState !== 'connected' && peerConnection.iceConnectionState !== 'completed') {
        console.error('Connection failed to establish within the timeout period');
        hangUp();
      }
    }, 10000); // 10 seconds timeout

  } catch (error) {
    console.error('Error starting call:', error);
  }
}

function hangUp() {
  if (peerConnection) {
    peerConnection.close();
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  document.getElementById('startButton').disabled = false;
  document.getElementById('hangupButton').disabled = true;
}

document.getElementById('startButton').addEventListener('click', startCall);
document.getElementById('hangupButton').addEventListener('click', hangUp);

// Add this to handle orientation changes
window.addEventListener('orientationchange', function () {
  // Give the DOM time to update
  setTimeout(function () {
    if (localVideo.srcObject) {
      const videoTrack = localVideo.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.applyConstraints({
          width: { ideal: window.innerWidth },
          height: { ideal: window.innerHeight }
        });
      }
    }
  }, 200);
});

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.ontrack = function (event) {
    console.log('Received remote track');
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = function (event) {
    if (event.candidate) {
      console.log('New ICE candidate:', event.candidate);
      socket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    } else {
      console.log('ICE candidate gathering completed');
    }
  };

  peerConnection.oniceconnectionstatechange = function () {
    console.log('ICE connection state change:', peerConnection.iceConnectionState);
  };

  peerConnection.onicegatheringstatechange = function () {
    console.log('ICE gathering state change:', peerConnection.iceGatheringState);
  };

  peerConnection.onsignalingstatechange = function () {
    console.log('Signaling state change:', peerConnection.signalingState);
  };

  peerConnection.onconnectionstatechange = function () {
    console.log('Connection state change:', peerConnection.connectionState);
  };
}

async function handleOffer(offer) {
  try {
    if (!peerConnection) {
      createPeerConnection();
    }

    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.send(JSON.stringify({ type: 'answer', answer: answer }));
  } catch (error) {
    console.error('Error handling offer:', error);
  }
}

async function handleAnswer(answer) {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (error) {
    console.error('Error handling answer:', error);
  }
}

async function handleCandidate(candidate) {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error('Error handling ICE candidate:', error);
  }
}