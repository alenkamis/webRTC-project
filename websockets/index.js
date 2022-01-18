'use strict';

var os = require('os');
var fs = require('fs');
var http = require('http');
var https = require('https');
var socketIO = require('socket.io');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};


//var app = http.createServer().listen(8081); // http za localhost

var app = https.createServer(options).listen(8081); // https za azure 

var io = socketIO.listen(app);

var onlineUsers = [];

console.log("websockets server started");

let broadCastOnlineUsers = false;

io.sockets.on('connection', function(socket) {
  // convenience function to log server messages on the client
  function log() {
    //var array = ['Message from server:'];
    //array.push.apply(array, arguments);
    //socket.emit('log', array);
    console.log(arguments[0]);
  }

  // broadcast online users every 2 sec
  if(!broadCastOnlineUsers){
    setInterval(function(){
      socket.broadcast.emit('message', {type: "onlineUsers", onlineUsers: onlineUsers});
    }, 2000);
    broadCastOnlineUsers = true;
  }

  // login
  socket.on('message', function(message) {
    if(message.type=="login"){
      if(!onlineUsers.includes(message.username)){
        onlineUsers.push(message.username);
      }
    }

    else if(message.type=="candidate"){
      console.log(message.type + ": " + message.room);
      io.to(message.room).emit('message', message);
    }
    else if ( message.type == "offer"){
      console.log(message.type + ": " + message.room);
      socket.to(message.room).emit('message', message);
    }
    else if(message.type == "answer"){ 
      console.log(message.type + ": " + message.room);
      socket.to(message.room).emit('message', message);
    }
    else if(message.type=="got_user_media"){
      console.log(message.type + ": " + message.room);
      socket.to(message.room).emit('message', message);
    }
    else if(message.type=="bye"){
      console.log(message.type + ": " + message.room);
      socket.to(message.room).emit('message', message);
    }
    else{
      log('Client said: ');
      log(message);
      socket.broadcast.emit('message', message);
    }
  });

  socket.on('create or join', function(room) {
    log('Received request to create or join room ' + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    log('Room ' + room + ' now has ' + numClients+ ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients === 1) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
      log("max two clients");
    }
  });

  socket.on('bye', function(room){
    socket.leave(room);
    console.log('received bye from ' + socket.id);
  });

});
