let peerConnection;
let localStream;
let remoteStream;

let servers = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ]
    }
  ]
}

// Uncomment and fill in your TURN server details if needed
// servers.iceServers.push({
//     urls: 'turn:your-turn-server.com:3478',
//     username: 'your-username',
//     credential: 'your-password'
// });

let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  document.getElementById('user-1').srcObject = localStream
}

let createPeerConnection = async () => {
  peerConnection = new RTCPeerConnection(servers)

  remoteStream = new MediaStream()
  document.getElementById('user-2').srcObject = remoteStream

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream)
  })

  peerConnection.ontrack = async (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track)
    })
  }

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      document.getElementById('offer-sdp').value = JSON.stringify(peerConnection.localDescription)
      document.getElementById('ice-candidates').value += JSON.stringify(event.candidate) + '\n'
    }
  }
}

let createOffer = async () => {
  createPeerConnection()

  let offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)

  document.getElementById('offer-sdp').value = JSON.stringify(offer)
}

let createAnswer = async () => {
  let offer = document.getElementById('offer-sdp').value
  if (!offer) return alert('Retrieve offer from peer first...')

  createPeerConnection()

  offer = JSON.parse(offer)
  await peerConnection.setRemoteDescription(offer)

  let answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)

  document.getElementById('answer-sdp').value = JSON.stringify(answer)
}

let addAnswer = async () => {
  let answer = document.getElementById('answer-sdp').value
  if (!answer) return alert('Retrieve answer from peer first...')

  answer = JSON.parse(answer)

  if (!peerConnection.currentRemoteDescription) {
    await peerConnection.setRemoteDescription(answer)
  }

  // Add ICE candidates after setting remote description
  let iceCandidates = document.getElementById('ice-candidates').value.split('\n')
  for (let iceCandidate of iceCandidates) {
    if (iceCandidate) {
      let candidate = JSON.parse(iceCandidate)
      await peerConnection.addIceCandidate(candidate)
    }
  }
}

init()

document.getElementById('create-offer').addEventListener('click', createOffer)
document.getElementById('create-answer').addEventListener('click', createAnswer)
document.getElementById('add-answer').addEventListener('click', addAnswer)