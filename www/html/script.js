'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var onlineUsers = [];
  
var pcConfig = {
  'iceServers': [
  {
  	'urls':'stun:webrtcturn.westeurope.cloudapp.azure.com:3478'
  },
  {
    'urls': 'turn:webrtcturn.westeurope.cloudapp.azure.com:3478',
    'username': 'user',
    'credential': 'sifra'
  }
  ]
};

if (location.hostname == 'localhost' || location.hostname == "127.0.0.1"){
  pcConfig = {};
}

var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

if (location.hostname == 'localhost' || location.hostname == "127.0.0.1")
  var socket = io.connect("http://"+ hostname + ":8081");
else
  var socket = io.connect("https://"+ hostname + ":8081");

socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log(' joined: ' + room);
  isChannelReady = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});


function sendMessage(message) {
  console.log('Client sending message: ', message);
  if(typeof(message) == "object" && message.room == undefined)
    message.room = room;

  if(message instanceof RTCSessionDescription){ // čudni bugfix koji mi je uzeo 2 dana života
    let m2 = { type:message.type, room: room, sdp: message.sdp};
    message = m2;
  }

  socket.emit('message', message);  
}

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if ( message.type === 'got_user_media') {
    maybeStart();
  } 
  else if (message.type === 'offer') {
    console.log("offer");
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    if(!pc) createPeerConnection();
    //delete message.room;
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } 
  else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } 
  else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } 
  else if (message.type === 'bye' && isStarted) {
    handleRemoteHangup();
  }
  else if (message.type==="onlineUsers"){
    if(JSON.stringify(onlineUsers) !=JSON.stringify(message.onlineUsers)){
      onlineUsers = message.onlineUsers;
      let html = "";
      for(let i=0; i<onlineUsers.length; i++){
        let korisnik = onlineUsers[i];
        if(korisnik != username)
          html += "<a class='call-link' href='javascript:call(\"" + korisnik + "\");'><div>"+korisnik+'</div></a> ';
      }
      
      document.getElementById("korisnici").innerHTML = html;
    }
  }
  else if (message.type=="poziv" && message.to == username){
    if(confirm("Poziv od: " + message.from )){      
      room = message.from + ":" + message.to;
      console.log(room);
      startLocalVideo();
      socket.emit('create or join', room);  
    }
    else{
      hangup();
    }
  }
});

sendMessage({type: "login", username: username});

////////////////////////////////////////////////////
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

function startLocalVideo(){
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })
  .then(gotStream)
  .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
  });
}

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage({type: 'got_user_media'});
  if (isInitiator) {
    maybeStart();
  }
}

function maybeStart() {
  console.log('>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function() {
  sendMessage({type:'bye'});
  socket.emit('bye', room);
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: room
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  //let answer = {...sessionDescription, room: room};
  //sendMessage(answer);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}


function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
  hangup();
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage({type:'bye'});
  socket.emit('bye', room);
  
  isStarted = false;
  isChannelReady = false;
  isInitiator = false;
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  hangup();
}

function stop() {
  isStarted = false;
  if(pc) pc.close();
  pc = null;
}

/*
function poziv(){
  if (room !== '') {
    sendMessage("poziv:" + username);
    startLocalVideo();
    socket.emit('create or join', room);
    console.log('Attempted to create or  join room', room);
  }  

  //isInitiator = true;
  maybeStart();
}
*/

function call(pozivani){
  room = username+ ":" + pozivani;
  console.log(room);

  sendMessage({
    type: "poziv",
    from: username,
    to: pozivani
  });
  
  startLocalVideo();
  
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
  
  //isInitiator = true;
  maybeStart();
}

function prekid(){
  hangup();
}
