let peerConnection;
let localStream;
let remoteStream;
let clientId;
let targetClientId;

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(`${wsProtocol}//${window.location.host}`);

const servers = {
    iceServers: [
        {
            urls: 'stun:stun1.1.google.com:19302'
        }
    ]
}

const userIdDisplay = document.getElementById('user-id');
const copyIdButton = document.getElementById('copy-id');

socket.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    console.log('Received message:', message);

    switch (message.type) {
        case 'client-id':
            clientId = message.clientId;
            console.log('recieved Client ID:', clientId);
            userIdDisplay.textContent = clientId; // Update the display
            break;
        case 'offer':
            console.log('Received offer');
            await handleOffer(message.data, message.source);
            break;
        case 'answer':
            console.log('Received answer');
            await handleAnswer(message.data);
            break;
        case 'ice-candidate':
            console.log('Received ICE candidate');
            await handleIceCandidate(message.data);
            break;
        default:
            console.error('Unrecognized message', message);

    };
};

async function init() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('user-1').srcObject = localStream;
};


let createOffer = async () => {
    targetClientId = prompt("Enter the ID of the client you want to connect to:");
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
            // document.getElementById('offer-sdp').value = JSON.stringify(peerConnection.localDescription);
            sendMessage({
                type: 'ice-candidate',
                data: event.candidate,
                target: targetClientId,
            });
        }
    };

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // document.getElementById('offer-sdp').textContent = JSON.stringify(offer);
    sendMessage({
        type: 'offer',
        data: offer,
        target: targetClientId,
    });
};

async function handleOffer(offer, sourceClientId) {
    targetClientId = sourceClientId;
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
            // document.getElementById('offer-sdp').value = JSON.stringify(peerConnection.localDescription);
            sendMessage({
                type: 'ice-candidate',
                data: event.candidate,
                target: targetClientId,
            });
        }
    };

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    sendMessage({
        type: 'answer',
        data: answer,
        target: sourceClientId,
    });

};

async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(answer);
};

async function handleIceCandidate(candidate) {
    await peerConnection.addIceCandidate(candidate);
};

function sendMessage(message) {
    socket.send(JSON.stringify(message));
}

function copyId() {
    navigator.clipboard.writeText(clientId).then(() => {
        alert('ID copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

init();

copyIdButton.addEventListener('click', copyId);

document.getElementById('create-offer').addEventListener('click', createOffer);
