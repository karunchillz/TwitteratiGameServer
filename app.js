#!/usr/bin/env node

var io = require('socket.io')(process.env.PORT || 5000);

var twitterModule = require('twitter');

var twitter = new twitterModule({
  consumer_key: 'Gb9Mmk98uXhFB4KgVbY6VhEWf',
  consumer_secret: 'txTZa0pr25p6WtyFZtvwzcWvkDEvrwqNDYgUwvZWapBuZuuVkm',
  access_token_key: '630011793-yd5PDsb01v6f5YbZI0myHtM8O2bYTErNOdWNaC4e',
  access_token_secret: '2ueuny4yCnd25kigxR7ly8DKCZNiStEOW01tDERjdiRHY'
});

var games = [];
var gameid = 0;
var createGame = true;


function getCreateGame(){
  return createGame;
}

function toggleCreateGame(){
  if(createGame )
    createGame = false;
  else
    createGame = true;
}

function getGameId(){
  return gameid;
}

function random(){
  gameid += 1;
  return gameid;
}

io.on('connection',function(client){

    // Dummy Code
    client.on('join:room', function(data){
        var room_name = data.room_name;
        client.join(room_name);
    });


    client.on('leave:room', function(msg){
        msg.text = msg.user + " has left the room";
        socket.in(msg.room).emit('exit', msg);
        client.leave(msg.room);
    });


    client.on('send:message', function(msg){
        client.in(msg.room).emit('message', msg);
    });
    // Dummy Code

  // Handshake with client
  console.log("Client connecting...");
  client.emit('connected');

  // Create a new game
  client.on("newGame", function(user){
    console.log('new game',user);
    if(getCreateGame()){
      toggleCreateGame();
      var gameid = random();
      var game = {
        id : gameid,
        createdBy : user,
        status: 'waiting',
        players: [user],
        gameOutput:[],
      }
      games.push(game);
      // Add the current user to this game
      client.join(gameid);
      // Sends wait signal to the player asking him to wait for his opponent to join
      var response = "new game (game id : "+gameid+") created. Wait for opponent to join!";
      client.emit('wait',{id: gameid, msg: response});
    }else{
      toggleCreateGame();
      var gameid = getGameId();
      for(var game in games){
        if(games[game].id == gameid && games[game].status == 'waiting'){
          console.log('Game room matched');
          games[game].players.push(user);
          games[game].status = 'locked';
          client.join(gameid);
          client.emit('wait',{id: gameid, msg: games[game].players}); 
          setTimeout(function(){
            io.to(gameid).emit('GameRoomReady',{game: games[game]});
          },3000);
        }
      }
    }

  });

    var tempStream = null;
    function getTempStream(){
      return tempStream;
    }

  // Start reading tweets once the client sends 'readTweets' event
  client.on("startGame",function(gameInput){
    console.log("Game started");
    var streamOpened = false;
    // Parse game input
    var gameid = gameInput.gameid;
    for(var game in games){
      if(games[game].id == gameid && games[game].status != 'started'){
        games[game].status = 'started';
      }
    }

    // Read and parse the game input
    var teamPlayers = gameInput.teamPlayers;
    var trackJson = gameInput.trackJson;
    console.log("input is ready");

    // Initialise the game output variable for storing the results
    var tempOutput = {output:[]};
    for(i=0;i<teamPlayers.length;i++){
      tempOutput.output.push({
        key: teamPlayers[i],
        value: 0
      });
    }

    /*
      GAME CORE LOGIC - READ TWEETS AND COMPUTE SCORES
    */
    twitter.stream('statuses/filter', trackJson,  function(stream) {
      console.log('trackJson %o',trackJson);
      console.log('Stream starting %o',stream);

      stream.on('data', function(tweet) {
        var tweetText = tweet.text.toLowerCase();
        for(i=0;i<teamPlayers.length;i++){
           if(tweetText.indexOf(teamPlayers[i])!=-1){
             tempOutput.output[i].value += 1;
           }
        }
        console.log("output = %o",tempOutput);
        io.to(gameid).emit('liveResults',{streamOpened: streamOpened,gameid: gameid, user: gameInput.user, output: tempOutput.output});
        streamOpened = true;
        if(tempStream == null)
          tempStream = stream; 
      });

      stream.on('error', function(error) {
        console.log("Oops!! %o",error);
        console.log('Stream Inside Error %o',stream);
      });

      console.log('Stream Out %o',stream);
    });
    console.log("stream over");

  });

  client.on("endGame", function(data){
    console.log("Game over : "+data.gameid);
    var temp123 = getTempStream();
    console.log('Destroy Stream %o',temp123);
    temp123.destroy();

    games = [];
    console.log('Games ',games);
    client.emit('OverClear');
  });

});


io.on('error',function(){
  console.log("error in socket connection");
});