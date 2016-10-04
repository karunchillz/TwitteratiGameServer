var io = require('socket.io-client');

var socket = io.connect('');
streamOpened = false;

// Listen for the response from the server 
socket.on('connected',function(){
	console.log("client log : connected to server!!");
	var username = 'Ganesh';

	// Create a new game
	socket.emit('newGame',username);

	socket.on('wait',function(data){
		console.log(data.msg);
	});

	socket.on('GameRoomReady', function(data){
		console.log("Ready to start a game. "+data.game.players[0]+ " Vs "+ data.game.players[1]);
		// Prepare current users' team information
		var gameInput = {
			user: username,
	    	gameid: data.game.id,
	    	teamPlayers: ['ronaldo','bale','benzema'],
	    	stream: '',
	    	trackJson: {
	    		track: ['ronaldo','bale','benzema'].toString()
	    	}
	    }
		socket.emit("startGame",gameInput);
	});

	socket.on('liveResults', function(data){
		console.log("%o",data);
		if(!data.streamOpened){
			console.log("timer started");
			setTimeout(function(){
				socket.emit('endGame',{gameid:data.gameid});
				socket.destroy();
			},30000);
		}
		
	});
});
