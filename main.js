/*main.js
*
*集體wander
*remove border
*骨架
*aquarium debug mode
*monitor control/test mode
*dclick : add point
*lclick: 
*rclick: atokirina
*/
zigEnabled = true;
aquaDebug = false;

var setting = {
	screenWidth: 1024,
	screenHeight: 768,
	monitorScale: 0.85,
	
	//kinect calibration parameters
	shiftX: 0,
	shiftY: 0,
	scaleX: 0.5,
	scaleY: 0.5,
	invertX: -1,
	invertY: -1,
	
	screenOrigin:[ -306.7772686481476, 542.8720712661743, 3046.107769012451 ],
	sToKinectMatrix:[
		[-756.9579780101774,90.76370298862457,110.80154776573178],
		[-238.47544193267822,-774.1172462701797,-338.9122635126114],
		[-685.983419418335,103.1572818756108,-1133.8963508605952]
	],
	kToScreenMatrix:[
		[-0.0012074669464796723,-0.00015127120126446356,-0.00007277697053920937],
		[0.00005016272282643875,-0.0012360286473142167,0.00037434054147440337],
		[0.0007350556814883571,-0.000020932971215924556,-0.0008038303072838088]
	],
	
	smoothC: 0.2,
	
	//moving parameters
	repelAA: 10,
	attractAJ: 10,
	repelAH: 40,
	repelR: 50,
	fMax: 25,
	
	windVecX: 0.5,
	windVecY: -0.3,
	windWdr: 0.5,
	windDamp: 0.1,
	
	flapV: 1,
	flapC: 0.975,
	flapP: 0.025,
	flapOmg: 0.2,
	
	fallV: 0.075,
	
	//step: 5,
	
	atokirinaScale: 0.8,
	filmSizeX: 150 * 0.8,
	filmSizeY: 150 * 0.8,
	atokirinaR : 60 * 0.8,
	
	frameCount: 120
}

var zig;
var windowAquarium;
var canvasAquarium;
var canvasMonitor;
var ctxM;
var ctxA;

var rateDisplay;

var atokirinaList = [];
var kuserList = [];
var userList = [];
//userFoundHandler({id: 1, skeleton:[{position:[100,100,3000]},{position:[200,200,3000]}]});
var film = [];

var draggingPoint = -1;
var timerID = -1;
var animationID;

var jointConnection=[
	[ 1, 2],
	[ 2, 6],//r arm
	[ 6, 7],
	[ 7, 8],
	[ 8, 9],
	[ 2,12],//l arm
	[12,13],
	[13,14],
	[14,15],
	[ 2, 3],
	[ 3, 4],
	[ 4,17],//r leg
	[17,18],
	[18,19],
	[19,20],
	[ 4,21],//l leg
	[21,22],
	[22,23],
	[23,24]
];
//var jointConnection=[[0,1]];

var maxDepth = 3000;
var minDepth = 1500;
//var depthSteps = [1500, 2000, 2500, 3000];
var depthColors = ['#00f', '#0ff', '#ff0', '#fc8', 'f88'];

window.addEventListener('DOMContentLoaded', init);

function init(){
	
	buttonStart = document.getElementById('start');
	buttonStart.addEventListener('click', function(){
		windowAquarium = window.open('aquarium.html',null,{fullscreen:'yes',titlebar:'no'});
		windowAquarium.addEventListener('DOMContentLoaded', function(){
			animationID = requestAnimationFrame(move);
		});
	})
	
	document.getElementById('oCal').addEventListener('click', function(){
		util.calibrateOrigin();
	})
	
	document.getElementById('xCal').addEventListener('click', function(){
		util.calibrateBasis(0);
	})
	
	document.getElementById('yCal').addEventListener('click', function(){
		util.calibrateBasis(1);
	})
	
	document.getElementById('zCal').addEventListener('click', function(){
		util.calibrateBasis(2);
	})	
	
	////attach canvasMonitor////
	
	canvasMonitor = document.getElementById('monitor');
	ctxM = canvasMonitor.getContext('2d');
	
	canvasMonitor.addEventListener('mousedown', function(e){
		x = util.targetX(e) / setting.monitorScale;
		y = util.targetY(e) / setting.monitorScale;
		/*
		for(i = 0; i <= atokirinaList.length; i++){
			if(typeof atokirinaList[i] != "undefined"){
				if(Math.abs(atokirinaList[i].x - x) < 10 && Math.abs(atokirinaList[i].y - y < 10)){
					draggingPoint = i;
					break;
				}
			}
		}
		*/
		for(i in kuserList){
			for(j in kuserList[i].skeleton)
			{
				if(Math.abs(util.kToScreenX(kuserList[i].skeleton[j].position[0],kuserList[i].skeleton[j].position[1],kuserList[i].skeleton[j].position[2]) - x) < 10 && Math.abs(util.kToScreenY(kuserList[i].skeleton[j].position[0],kuserList[i].skeleton[j].position[1],kuserList[i].skeleton[j].position[2]) - y < 10)){
					draggingPoint = i;
					draggingPart = j;
					
					break;
				}
			}
		}
	});
	
	function updateUserDebug()
	{
		if(draggingPoint != -1){
			kuserList[draggingPoint].skeleton[draggingPart].position[0] = util.sToKinectX(updateUserDebugX);
			kuserList[draggingPoint].skeleton[draggingPart].position[1] = util.sToKinectY(updateUserDebugY);
		}
	}
	
	canvasMonitor.addEventListener('mousemove', function(e){
		updateUserDebugX = util.targetX(e) / setting.monitorScale;
		updateUserDebugY = util.targetY(e) / setting.monitorScale;
		
		
	});

	canvasMonitor.addEventListener('mouseup', function(e){
		draggingPoint = -1;
	});
	
	rateDisplay = document.getElementById('rateDisplay');
	
	////attach setting////
	
	var sliderList = document.getElementsByClassName('slider');
	for(var i = 0; i < sliderList.length; i++){
		slider = sliderList[i];
		if(setting[slider.id]){
			slider.value = setting[slider.id];
		}
		
		slider.addEventListener('input', function(e){
			setting[e.target.id] = e.target.value*1;
		});
	}
	/*
	for(var i = 0; i < sliderList.length; i++){
		if(sliderList[i].oninput)
			sliderList[i].oninput();
	}
	*/
	
	if(zigEnabled){
		if(zig){
			attachZig();
		}else{
		console.log('init: failed to find Zigfu plugin')
		}
	}

	render();
	
	canvasMonitor.width = setting.monitorScale * setting.screenWidth;
	canvasMonitor.height = setting.monitorScale * setting.screenHeight;
	
	////placing atokirinaList////
	
	for(var i = 0; i < 50; i++){
		atokirinaList.push({
			x: Math.random() * setting.screenWidth,
			y: Math.random() * setting.screenHeight,
			vx: 0,
			vy: 0,
			dir: Math.random() * Math.PI*2,
			dir_: (Math.random() > 0.5 ? -1 : 1),
			phase: Math.random() * Math.PI*2,
			flap: false
		});
	}
	
	/*
	setTimeout(function() {
		windowAquarium = window.open('aquarium.html',null,{fullscreen:'yes',titlebar:'no'});
	}, 1000);	
	*/
}

function render(){
	canvasMonitor.width = setting.filmSizeX;
	canvasMonitor.height = setting.filmSizeY;
	
	ctxM.strokeStyle = '#fff';
	ctxM.fillStyle = '#fff';
	
	for(var i = 0; i < setting.frameCount; i++)
	{
		var scale = setting.atokirinaScale;
		
		theta = i * Math.PI*2 / setting.frameCount;
		ctxM.clearRect(0,0,canvasMonitor.width,canvasMonitor.height);
		
		//origin
		oX = setting.filmSizeX/2;
		oY = setting.filmSizeY/2 - 2 * Math.sin(theta);
		
		//short tentacles
		cp1SX = scale * 5; //control point 1 & 2
		cp1SY = scale * -30;
		cp2SX = scale * ( 20   + 5 * Math.cos(-theta - Math.PI/2));
		cp2SY = scale * (-22.5 - 5 * Math.sin(-theta - Math.PI/2) - 2.5);
		endSX = scale * ( 25   + 5 * Math.cos(-theta - Math.PI/3) - 2.5);
		endSY = scale * ( -5   - 5 * Math.sin(-theta - Math.PI/3) - 4.330127);
		
		//long tentacles
		cp1LX = scale * 7.5;
		cp1LY = scale * -42.5;
		cp2LX = scale * ( 30 + 15   * Math.cos(-theta - Math.PI/2));
		cp2LY = scale * ( -5 - 15   * Math.sin(-theta - Math.PI/2) - 10);
		endLX = scale * ( 30 +  5   * Math.cos(-theta - Math.PI/4) - 1.0606601);
		endLY = scale * (  5 -  2.5 * Math.sin(-theta - Math.PI/4) - 1.0606601);
		
		//body
		topBX = scale * 0;
		topBY = scale * -2.5;
		cp1BX = scale * 2;
		cp1BY = scale * 0;
		cp2BX = scale * 3;
		cp2BY = scale * 0;
		botBX = scale * 0;
		botBY = scale * 5;
		
		//draw short tentacles
		ctxM.lineWidth = scale * 0.75;
		ctxM.beginPath();
		for(n=0; n<7; n++){
			XR = Math.cos((n/12)*2*Math.PI);
			
			ctxM.moveTo(oX, oY);
			ctxM.bezierCurveTo(
				oX+cp1SX*XR, oY+cp1SY, 
				oX+cp2SX*XR, oY+cp2SY, 
				oX+endSX*XR, oY+endSY
			);
		}
		ctxM.stroke();
		
		//draw long tentacles
		ctxM.lineWidth = scale * 0.5;
		ctxM.beginPath();
		for(n=0; n<6; n++){
			XR = Math.cos(((n+0.5)/12)*2*Math.PI);
			ctxM.moveTo(oX, oY);
			ctxM.bezierCurveTo(
				oX+cp1LX*XR, oY+cp1LY, 
				oX+cp2LX*XR, oY+cp2LY, 
				oX+endLX*XR, oY+endLY
			);
		}
		ctxM.stroke();
		
		//draw body
		ctxM.beginPath();
		ctxM.moveTo(oX+topBX, oY+topBY);
		ctxM.bezierCurveTo(
			oX+cp1BX, oY+cp1BY,
			oX+cp2BX, oY+cp2BY,
			oX+botBX, oY+botBY
		);
		ctxM.bezierCurveTo(
			oX+cp2BX, oY+cp2BY,
			oX+cp1BX, oY+cp1BY,
			oX+topBX, oY+topBY
		);
		ctxM.fill();	
		
		//adding inner shadow
		ctxM.shadowColor = '#def';
		ctxM.shadowBlur = 5;
		ctxM.drawImage(canvasMonitor,0,0);
		
		//outer shadow
		ctxM.shadowColor = '#6af';
		ctxM.shadowBlur = 30;
		ctxM.drawImage(canvasMonitor,0,0);
		
		film[i] = document.createElement('img');
		film[i].src = canvasMonitor.toDataURL();
		
		//save frames
		//frames_shadowed[i] = ctx.getImageData(0, 0, canvasMonitor.width, canvasMonitor.height);
		
		ctxM.shadowBlur = 0;
	}
}

move.callCount = 0;
move.lastStamp;
function move(){
	
	////measure timing////
	timeStamp = new Date();
	
	var callInterval = timeStamp - move.lastStamp;
	
	if(timeStamp != move.lastStamp && move.callCount > 100){
		rateDisplay.innerHTML = Math.floor(10000 / callInterval) / 10;
		move.callCount = 0;
	}
	
	move.lastStamp = timeStamp;
	move.callCount++;
	
	////calculate force////
	
	//var forces_x = [];
	//var forces_y = [];
	
	for(var u in userList){
		user = userList[u];
		if(user.out){
			kuser = {};
			kuser.skeleton = [];
			for(var j in user.skeleton){
				kuser.skeleton[j] = {};
				kuser.skeleton[j].position = [];				
				kuser.skeleton[j] = {};
				kuser.skeleton[j].position = [];
				kuser.skeleton[j].position[0] = user.skeleton[j].position[0];
				kuser.skeleton[j].position[1] = user.skeleton[j].position[1];
				kuser.skeleton[j].position[2] = minDepth;
			}
		}else{
			kuser = kuserList[u];
		}
		for(var j in kuser.skeleton){
			if(!user.skeleton[j]){//for user just in
				user.skeleton[j] = {};
				userList[u].skeleton[j].position = [];
				userList[u].skeleton[j].position[0] = kuser.skeleton[j].position[0];
				userList[u].skeleton[j].position[1] = kuser.skeleton[j].position[1];
				userList[u].skeleton[j].position[2] = minDepth;
			}
			node = user.skeleton[j].position;
			knode = kuser.skeleton[j].position;
			//console.log([node, knode]);
			dx = node[0] - knode[0];
			dy = node[1] - knode[1];
			dz = node[2] - knode[2];
			
			node[0] -= dx * setting.smoothC;
			node[1] -= dy * setting.smoothC;
			node[2] -= dz * setting.smoothC;
			
			if(user.out && node[2]-minDepth<100)
			{
				delete userList[u];
				break;
			}
			
			
		}
		
		
	}
	
	//visit atokirinas
	for(var a = 0; a < atokirinaList.length; a++){
		var atokirina = atokirinaList[a];
		
		fx = 0;
		fy = 0;
								
		////AA repel////
		
		for(var b = 0; b < atokirinaList.length; b++){
			var btokirina = atokirinaList[b];
			
			if(b != a){
				var dx = atokirina.x - btokirina.x;
				var dy = atokirina.y - btokirina.y;
				var r_sq = dx*dx + dy*dy;
				
				var rr = setting.repelR
				if(r_sq > rr*rr){
					continue;
				}
				
				var force = (1 / r_sq) * setting.repelAA;
				fx += force * dx;
				fy += force * dy;
			}
		}
		
		////AH repel////
		
		for(var u in userList){
			var user = userList[u];
			for(var j in user.skeleton){
				node = user.skeleton[j]
				nodeX = node.position[0];
				nodeY = node.position[1];
				nodeZ = node.position[2]; //1406~2923
				
				var dx = atokirina.x - util.kToScreenX(nodeX,nodeY,nodeZ);
				var dy = atokirina.y - util.kToScreenY(nodeX,nodeY,nodeZ);
				var r_sq = dx*dx + dy*dy;
				
				var rr = setting.repelR
				if(r_sq > rr*rr){
					continue;
				}
				
				//var force = 1 / (r_sq) * util.kToScreenZ(nodeX,nodeY,nodeZ) * setting.repelAH;
				var force = 1 / (r_sq) * setting.repelAH;
				
				if(user.jake){
					force -= 1 / r_sq * setting.attractAJ;
				}

				fx += force * dx;
				fy += force * dy;
			}
			
			for(var j of jointConnection)
			{
				//console.log([d_par,(x2-x1)*(x2-x1)+(y2-y1)*(y2-y1)]);
				//console.log([j])
				if(!(user.skeleton[j[0]] && user.skeleton[j[1]]))continue;
				x1=util.kToScreenX(user.skeleton[j[0]].position[0], user.skeleton[j[0]].position[1], user.skeleton[j[0]].position[2]);
				y1=util.kToScreenY(user.skeleton[j[0]].position[0], user.skeleton[j[0]].position[1], user.skeleton[j[0]].position[2]);
				z1=util.kToScreenZ(user.skeleton[j[0]].position[0], user.skeleton[j[0]].position[1], user.skeleton[j[0]].position[2]);
				x2=util.kToScreenX(user.skeleton[j[1]].position[0], user.skeleton[j[1]].position[1], user.skeleton[j[1]].position[2]);
				y2=util.kToScreenY(user.skeleton[j[1]].position[0], user.skeleton[j[1]].position[1], user.skeleton[j[1]].position[2]);
				//console.log([x1,x2,y1,y2]);
				
				
				if(!(isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)))continue;
				
				ax=atokirina.x-x1;
				ay=atokirina.y-y1;
				
				d_par=ax*(x2-x1)+ay*(y2-y1);
				//console.log([d_par,(x2-x1)*(x2-x1)+(y2-y1)*(y2-y1)]);
				if(d_par>=0 && d_par<=(x2-x1)*(x2-x1)+(y2-y1)*(y2-y1))
				{
					normal_x=y1-y2;
					normal_y=-x1+x2;
					
					normal_length=Math.sqrt(normal_x*normal_x+normal_y*normal_y);
					
					if(normal_length==0)continue;
					
					//console.log([x1,y1,x2,y2,normal_x,normal_y,normal_length])
					normal_x/=normal_length;
					normal_y/=normal_length;
					r=ax*normal_x+ay*normal_y;
					
					if(r > rr || r<-rr){
						continue;
					}
					
					//if(r<100 && r>-100)
					//{
						//force = 1 / r * z1 * setting.repelAH;
						force = 1 / r * setting.repelAH;
						fx+=force*normal_x;
						fy+=force*normal_y;
						
					//}
					
				}
											
				
			}
		}
		
		////wander////
		
		dvx = setting.windVecX - atokirina.vx;
		dvy = setting.windVecY - atokirina.vy;
		atokirina.vx += dvx * setting.windDamp;
		atokirina.vy += dvy * setting.windDamp;
		
		////write force////
		//forces_x[a] = fx;
		//forces_y[a] = fy;
	//}
	
	////move////
	
	//for(var a = 0; a < atokirinaList.length; a++){
		//var atokirina = atokirinaList[a];
		atokirina.vx += fx < setting.fMax ? fx : setting.fMax; //+ (-1 + Math.random()*2) * 0.001;
		atokirina.vy += fy < setting.fMax ? fy : setting.fMax; //+ (-1 + Math.random()*2) * 0.001;
		atokirina.x += atokirina.vx;
		atokirina.y += atokirina.vy;
		
		var v_sq = (atokirina.vx * atokirina.vx + atokirina.vy * atokirina.vy);
		
		var liftV = 0.3;
		var pushV = 0.1;
		if(atokirina.flap){
			atokirina.phase += setting.flapOmg;
			atokirina.y -= liftV;
			atokirina.x += pushV;
			if(atokirina.phase < Math.PI && atokirina.phase > Math.PI / 6){
				atokirina.flap = false;
			}
		}else{
			if(v_sq > setting.flapV || atokirina.phase > Math.PI && Math.random() < setting.flapP){
				atokirina.flap = true;
			}
			atokirina.phase = Math.PI*2 - setting.flapC * (Math.PI*2 - atokirina.phase);
			atokirina.y += setting.fallV;
		}
		atokirina.phase %= Math.PI*2;
		
		//atokirina.phase += setting.swimStep + v_sq * setting.swimStepGain;
		//atokirina.phase %= Math.PI*2;
		
		////replace at border////
		 
		var borderR = 60;
		var tooOver = 300;
		if(atokirina.x > setting.screenWidth + borderR || atokirina.x < -tooOver || !isFinite(atokirina.x)){
			atokirina.x = - borderR;
			atokirina.y = Math.random() * setting.screenHeight;
		}
		if(atokirina.y < -borderR || atokirina.y > setting.screenWidth + tooOver || !isFinite(atokirina.y)){
			atokirina.y = setting.screenHeight + borderR; 
			atokirina.x = Math.random() * setting.screenWidth;
		}
	}
	
	draw();
}

function draw(){
	var t = 0;
	var frame_index;
	
	//clear aquarium
	if(windowAquarium && windowAquarium.document.getElementById('canvasAquarium')){
		var canvasAquarium = windowAquarium.document.getElementById('canvasAquarium')
		if(canvasAquarium)
		{
			ctxA = canvasAquarium.getContext('2d');
		}
		//ctxA.globalCompositeOperation = 'lighter';	
	}
	
	//clear monitor
	ctxM.clearRect(0, 0, canvasMonitor.width, canvasMonitor.height);
	if(ctxA){
		ctxA.clearRect(0, 0, canvasAquarium.width, canvasAquarium.height);
	}
	
	////drawSeeds////
	
	for(var i = 0; i < atokirinaList.length; i++){
		var atokirina = atokirinaList[i];
		
		ctxM.fillStyle = "green";
		util.pointCtx(ctxM, setting.monitorScale * atokirina.x, setting.monitorScale * atokirina.y);
		
		if(ctxA){
			frame_index = Math.floor(atokirinaList[i].phase / (Math.PI*2) * setting.frameCount);
			if(0 <= frame_index && frame_index < setting.frameCount){
				ctxA.drawImage(film[frame_index], atokirinaList[i].x - setting.filmSizeX/2, atokirinaList[i].y - setting.filmSizeY/2);
				//util.pointCtx(ctxA, atokirina.x, atokirina.y);
			}else{
				console.log("draw: invalid frame");
			}
		}
	}
	
	////draw action nodes////
	
	for(var u in userList){
		user = userList[u];
		for(var j in user.skeleton){
			
			ctxM.fillStyle = "#0ff";
			ctxA.fillStyle = "#0ff";
			
			for(var j in user.skeleton){
				node = user.skeleton[j];
				nodeX = node.position[0];
				nodeY = node.position[1];
				nodeZ = node.position[2]; //1406~2923
				
				alpha = util.kToScreenZ(nodeX,nodeY,nodeZ);
				// alpha = 0.1;
				ctxA.fillStyle = ctxM.fillStyle = 'rgba(0,255,255,' + alpha + ')';
				
				//ctxM.fillText(j, setting.monitorScale * util.kToScreenX(nodeX,nodeY,nodeZ), setting.monitorScale * util.kToScreenY(nodeX,nodeY,nodeZ));
				ctxM.fillRect(setting.monitorScale * util.kToScreenX(nodeX,nodeY,nodeZ) - 5, setting.monitorScale * util.kToScreenY(nodeX,nodeY,nodeZ) - 5, 10, 10);
				
				if(ctxA && aquaDebug){
					util.pointCtx(ctxA, util.kToScreenX(nodeX,nodeY,nodeZ), util.kToScreenY(nodeX,nodeY,nodeZ));	
				}
			}
		}
	}
	for(var u in kuserList){
		kuser = kuserList[u];
		for(var j in kuser.skeleton){
			
			ctxM.fillStyle = "#00f";
			ctxA.fillStyle = "#00f";
			
			for(var j in kuser.skeleton){
				node = kuser.skeleton[j];
				nodeX = node.position[0];
				nodeY = node.position[1];
				nodeZ = node.position[2]; //1406~2923
				
				alpha = util.kToScreenZ(nodeX,nodeY,nodeZ);
				ctxA.fillStyle = ctxM.fillStyle = 'rgba(0,0,255,' + alpha + ')';
				
				ctxM.fillText(j, setting.monitorScale * util.kToScreenX(nodeX,nodeY,nodeZ), setting.monitorScale * util.kToScreenY(nodeX,nodeY,nodeZ));
				
				if(ctxA && aquaDebug){
					util.pointCtx(ctxA, util.kToScreenX(nodeX,nodeY,nodeZ), util.kToScreenY(nodeX,nodeY,nodeZ));	
				}
			}
		}
	}
	
	////draw calibration points////
	
	if(ctxA && aquaDebug){
		ctxA.fillStyle = "yellow";
		util.pointCtx(ctxA, setting.screenWidth/2, setting.screenHeight/2);	
		util.pointCtx(ctxA, setting.screenWidth-3, setting.screenHeight/2);
		util.pointCtx(ctxA, setting.screenWidth/2, setting.screenHeight-3);
	}
	
	animationID = requestAnimationFrame(move);
}
