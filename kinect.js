function attachZig(){
	var zigHandler = {
		onuserfound: userFoundHandler,
		onuserlost: userLostHandler,
		ondataupdate: updatePoint
	};
	zig.addListener(zigHandler);
}

function userFoundHandler(user){
		console.log('in');
				/*
		for(var j in user.skeleton){
			userList[u].skeleton[j] = {};
			userList[u].skeleton[j].position = [];
			userList[u].skeleton[j].position[0] = user.skeleton[j].position[0];
			userList[u].skeleton[j].position[1] = user.skeleton[j].position[1];
			userList[u].skeleton[j].position[2] = minDepth;
		}
		*/
		kuserList[user.id] = user;
		userList[user.id] = {};
		userList[user.id].skeleton = [];
		console.log(kuserList[user.id]);
}

function userLostHandler(user) {
	console.log('out');
	delete kuserList[user.id];
	userList[user.id].out = true;
}

var zd;

function updatePoint(zigdata) {
	for (var u in zigdata.users) {
		var user = zigdata.users[u];
		//var pos = user.position;
		
		//zd = zigdata;
		
		kuserList[u] = user;
		//userList[u] = {};
	}
}
