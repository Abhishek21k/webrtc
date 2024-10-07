# WebRTC Video Connection

This is a simple WebRTC video connection application that allows two users to establish a peer-to-peer video call using WebRTC technology *Without Signaling Server*.

## Installation

1. Clone the repository:
 ```
git clone https://github.com/Abhishek21k/webrtc.git
```
2. Navigate to the project directory:
```
cd webrtc
```
3. Install the dependencies:
```
npm install
```
4. Start Server:
```
npm start
```

## Using the Application

To establish a WebRTC connection between two peers:

1. On the first peer's device:
   - Click "Create Offer"
   - Copy the generated SDP offer from the "SDP Offer" textarea

2. On the second peer's device:
   - Paste the received SDP offer into the "SDP Offer" textarea
   - Click "Create Answer"
   - Copy the generated SDP answer from the "SDP Answer" textarea

3. Back on the first peer's device:
   - Paste the received SDP answer into the "SDP Answer" textarea
   - Click "Add Answer"

4. If everything is set up correctly, you should now see the video streams for both peers.
