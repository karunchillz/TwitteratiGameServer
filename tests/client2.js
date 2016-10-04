var io = require('socket.io-client');

var socket = io.connect('');

// Listen for the response from the server 
socket.on('connected',function(){
	console.log("client log : connected to server!!");
	var username = 'Karun';
	// Join the game created by Ganesh
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
	    	teamPlayers: ['messi','suarez','neymar'],
	    	stream: '',
	    	trackJson: {
	    		track: ['messi','suarez'].toString()
	    	}
	    }
		socket.emit("startGame",gameInput);
	});

	socket.on('liveResults', function(data){
		console.log("%o",data);
		if(!data.streamOpened){
			setTimeout(function(){
				socket.emit('endGame',{gameid:data.gameid});
				socket.destroy();
			},30000);
		}
	});

});
