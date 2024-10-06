let peerConnection;
let localStream;
let remoteStream;

const servers = {
    iceServers: [
        {
            urls: 'stun:stun1.1.google.com:19302'
        }
    ]
}

let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });


    document.getElementById('user-1').srcObject = localStream;
};


let createOffer = async () => {
    console.log('Creating offer');
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById('user-2').srcObject = remoteStream;

    // Add tracks to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
    };

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            console.log('New ICE candidate');
            document.getElementById('offer-sdp').value = JSON.stringify(peerConnection.localDescription);
        }
    };

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    document.getElementById('offer-sdp').textContent = JSON.stringify(offer);
};

let createAnswer = async () => {
    console.log('Creating answer');
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById('user-2').srcObject = remoteStream;

    // Add tracks to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
    };

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            console.log('New ICE candidate');
            document.getElementById('answer-sdp').value = JSON.stringify(peerConnection.localDescription);
        }
    };

    let offer = document.getElementById('offer-sdp').value;
    if (!offer) {
        alert('Please add an offer first');
        return;
    }

    offer = JSON.parse(offer);

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    document.getElementById('answer-sdp').textContent = JSON.stringify(answer);
};


let addAnswer = async () => {
    let answer = document.getElementById('answer-sdp').value
    if (!answer) {
        alert('Please add an answer from peer 2');
        return;
    }

    answer = JSON.parse(answer);
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer);
    }
};

init();

document.getElementById('create-offer').addEventListener('click', createOffer);
document.getElementById('create-answer').addEventListener('click', createAnswer);
document.getElementById('add-answer').addEventListener('click', addAnswer);