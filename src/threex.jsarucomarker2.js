var THREEx = THREEx || {}

/**
 * Handle jsaruco markers
 */
THREEx.JsArucoMarker2 = function(){
	var jsArucoMarker = this
	this.debugEnabled = true
	var modelSize = 35.0; // millimeter

	var canvasElement = document.createElement('canvas')
	var context = canvasElement.getContext("2d");

	if( this.debugEnabled ){
		document.body.appendChild(canvasElement)
		canvasElement.style.position = 'absolute'
		canvasElement.style.top = '0px'
		canvasElement.style.left = '0px'
		canvasElement.style.opacity = 0.2
	}

	/**
	 * Detect Marker in a videoElement or imageElement
	 * @param {HTMLElement} srcElement - the source element
	 * @return {Object[]} - array of found markers
	 */
	this.detectMarkers	= function(srcElement){		
		if( srcElement instanceof HTMLVideoElement ){
			// if no new image for srcElement do nothing
			if (srcElement.readyState !== srcElement.HAVE_ENOUGH_DATA){
				return []
			}

			canvasElement.width = srcElement.videoWidth/2
			canvasElement.height = srcElement.videoHeight/2
		}else if( srcElement instanceof HTMLImageElement ){
			if( srcElement.naturalWidth === 0 ){
				return []				
			}
			canvasElement.width = srcElement.naturalWidth/10
			canvasElement.height = srcElement.naturalHeight/10
		}else console.assert(false)

		// get imageData from srcElement
		context.drawImage(srcElement, 0, 0, canvasElement.width, canvasElement.height);
		var imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);

		// detect markers
		var detector = new AR.Detector();
		var markers = detector.detect(imageData);

		// display markers on canvas for debug
		if( this.debugEnabled ){
			drawDebug(markers, canvasElement)
		}
		
		// return the result
		return markers
	}
	
	/**
	 * convert a jsaruco marker to a THREE.Object3D
	 * 
	 * @param {Object[]} marker   - a found marker
	 * @param {THREE.Object3D} object3d - the object3d to move
	 */
	this.markerToObject3D = function(marker, object3d){
		// convert corners coordinate - not sure why
		var corners = []//marker.corners;
		for (var i = 0; i < marker.corners.length; ++ i){
			corners.push({
				x : marker.corners[i].x - (canvasElement.width / 2),
				y : (canvasElement.height / 2) - marker.corners[i].y,
			})
		}
		// compute the pose from the canvas
		var posit = new POS.Posit(modelSize, canvasElement.width);
		var pose = posit.pose(corners);
		console.assert(pose !== null)

		//////////////////////////////////////////////////////////////////////////////////
		//		Translate pose to THREE.Object3D
		//////////////////////////////////////////////////////////////////////////////////
		var rotation = pose.bestRotation
		var translation = pose.bestTranslation

		object3d.scale.x = modelSize;
		object3d.scale.y = modelSize;
		object3d.scale.z = modelSize;

		object3d.rotation.x = -Math.asin(-rotation[1][2]);
		object3d.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
		object3d.rotation.z =  Math.atan2(rotation[1][0], rotation[1][1]);

		object3d.position.x =  translation[0];
		object3d.position.y =  translation[1];
		object3d.position.z = -translation[2];
	}

	return
	
	//////////////////////////////////////////////////////////////////////////////////
	//		Comments
	//////////////////////////////////////////////////////////////////////////////////

	/**
	* draw corners on a canvas - useful to debug
	*
	* @param {Object[]} markers - array of found markers
	*/
	function drawDebug(markers, canvasElement){
		var context = canvasElement.getContext("2d");
		context.lineWidth = 3;

		for (var i = 0; i < markers.length; ++ i){
			var marker = markers[i]
			var corners = marker.corners;

			context.strokeStyle = "red";
			context.beginPath();

			for (var j = 0; j < corners.length; ++ j){
				var corner = corners[j];
				context.moveTo(corner.x, corner.y);
				corner = corners[(j + 1) % corners.length];
				context.lineTo(corner.x, corner.y);
			}

			context.stroke();
			context.closePath();

			context.strokeStyle = "green";
			context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
			// console.log('marker', marker.id)

			context.fillStyle = "blue";
			context.font = "bold 10px Arial";
			context.fillText("id: "+marker.id, corners[0].x, corners[0].y);
		}
	};
}
