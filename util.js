var sx;
var sy;
var sqrtTable;
util = {
	initSqrtTable: function(){
		
	},
	targetX: function(e){
		return e.pageX - e.target.offsetLeft;
	},
	targetY: function(e){
		return e.pageY - e.target.offsetTop;
	},
	targetM: function(e){
		return {
			x: e.pageX - e.target.offsetLeft,
			y: e.pageY - e.target.offsetTop,
		}
	},
	pointCtx: function(ctx, x, y){
		ctx.fillRect(x - 2, y - 2, 5, 5);
	},
	inverseMatrix: function(a)
	{
		var determinant=0;
		var b=[[],[],[]];
		for(var i=0;i<3;i++)
			determinant = determinant + (a[0][i]*(a[1][(i+1)%3]*a[2][(i+2)%3] - a[1][(i+2)%3]*a[2][(i+1)%3]));
		
		for(var i=0;i<3;i++){
			for(var j=0;j<3;j++)
				b[j][i]=((a[(i+1)%3][(j+1)%3] * a[(i+2)%3][(j+2)%3]) - (a[(i+1)%3][(j+2)%3]*a[(i+2)%3][(j+1)%3]))/ determinant;
		}
		return b;
	},
	
	getCalibrationPoint: function()
	{
		var jointIndex=9;
		for(var user of kuserList){
			if(user){
				return [user.skeleton[jointIndex].position[0],user.skeleton[jointIndex].position[1],user.skeleton[jointIndex].position[2]];
			}
		}
	},

	calibrateOrigin: function()
	{
		setting.screenOrigin=this.getCalibrationPoint();
		console.log(setting.screenOrigin);
	},

	calibrateBasis: function(index)
	{
		var vector=this.getCalibrationPoint();
		var o=setting.screenOrigin;
		for(var i=0;i<3;i++)setting.sToKinectMatrix[i][index]=(vector[i]-o[i]);
		setting.kToScreenMatrix=this.inverseMatrix(setting.sToKinectMatrix);
	},
	
	/*
	kToScreenX: function(x,y,z){
		sx = (x * setting.invertX * setting.scaleX) + setting.screenWidth/2 + setting.shiftX;
		//console.log(sx);
		return sx;
	},
	kToScreenY: function(x,y,z){
		sy = (y * setting.invertY * setting.scaleY) + setting.screenHeight/2 + setting.shiftY;
		//console.log(sy);
		return sy;
	},
	kToScreenZ: function(x,y,z){
		return (z - 1500) / 1500;
	},
	*/
	
	kToScreenX: function(x,y,z){
		var a=setting.kToScreenMatrix;
		var o=setting.screenOrigin;
		xn=a[0][0]*(x-o[0])+a[0][1]*(y-o[1])+a[0][2]*(z-o[2]);
		//return xn*setting.screenWidth;
		return (xn+1)/2*setting.screenWidth;
	},
	kToScreenY: function(x,y,z){
		var a=setting.kToScreenMatrix;
		var o=setting.screenOrigin;
		yn=a[1][0]*(x-o[0])+a[1][1]*(y-o[1])+a[1][2]*(z-o[2]);
		//return yn*setting.screenHeight;
		return (yn+1)/2*setting.screenHeight;
	},
	kToScreenZ: function(x,y,z){
		var a=setting.kToScreenMatrix;
		var o=setting.screenOrigin;
		zn=a[2][0]*(x-o[0])+a[2][1]*(y-o[1])+a[2][2]*(z-o[2]);
		return 1-zn;
	},
	sToKinectX: function(x,y,z){
		return (x - setting.shiftX - setting.screenWidth/2) / setting.scaleX * setting.invertX;
	},
	sToKinectY: function(x,y,z){
		return (y - setting.shiftY - setting.screenHeight/2) / setting.scaleY * setting.invertY;
	}
}
