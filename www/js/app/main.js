define(function (require) {
    // Load any app-specific modules
    // with a relative require call,
    // like:
    // var util = require('./util');

	var deletePicture = function(faceKey)
	{
		var request =
			db
			.transaction(["FaceFiles"], "readwrite")
			.objectStore("FaceFiles")
			.delete(faceKey);
        
        request.onsuccess = function(event) {
        	var linkToDelete = document.querySelector('a[href="#face_' + faceKey + '"]').parentNode;
        	linkToDelete.parentNode.removeChild(linkToDelete);
        	console.log(faceKey + " cleared.");
        };
	};
	
	var showPicture = function(event)
	{
		var viewShow = document.getElementById('view-show');
		var fullImage = this.querySelector('img').cloneNode();
		if (viewShow.querySelector('#show-picture').childNodes.length > 0) {
			viewShow.querySelector('#show-picture').removeChild(viewShow.querySelector('#show-picture').childNodes[0]);
		}
		viewShow.querySelector('#show-picture').appendChild(fullImage);
		viewShow.removeAttribute('style');
		viewShow.className = 'slide-up-in';
		viewShow.querySelector('.btn-delete').dataset.faceKey = this.dataset.faceKey;
		
		return false;
	};
	
	var addImageInList = function(imgObject)
	{
		if (imgObject.file)
		{
			var newLi = document.createElement('li');
	        newLi.setAttribute('role', "listitem");
	        
	        var newA = document.createElement('a');
	        newA.href = "#face_" + imgObject.key;
	        newA.dataset.faceKey = imgObject.key;
	        newA.onclick = showPicture;
	        
	        var newImg = document.createElement('img');
	
	        // Get window.URL object
	        var URL = window.URL || window.webkitURL;
	        var imgUrl = URL.createObjectURL(imgObject.file);
	        
	        newImg.src = imgUrl;
	        newA.appendChild(newImg);
	        newLi.appendChild(newA);
	        
	        document.querySelector('.photo-list').appendChild(newLi);
		}
	};
	
    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
    }
    
    // IndexedDB
    window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
        IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
        dbVersion = 1;

    // IndexedDB connection
    var db;
    
    // Create/open database
    var request = indexedDB.open("DailyFace", dbVersion);
     
    request.onerror = function(event) {
    	alert("Error while opening IndexedDB database");
    };
    
    request.onsuccess = function (event) {
        console.log("Success creating/accessing IndexedDB database");
        db = request.result;
     
        db.onerror = function (event) {
            console.log("Error creating/accessing IndexedDB database: " + event.target.errorCode);
        };
        
        var objectStore = db.transaction("FaceFiles").objectStore("FaceFiles");

        objectStore.openCursor().onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor)
          {
        	  addImageInList(cursor.value);
              
              console.log("Key " + cursor.key);
              cursor.continue();
          }
        };
    };
     
    // For future use. Currently only in latest Firefox versions
    request.onupgradeneeded = function (event) {
    	var db = event.target.result;
    	
    	var objectStore = db.createObjectStore("FaceFiles", { kePath: "key" });
    	objectStore.createIndex("collection", "collection", { unique: false });
    };
    
    var userMediaFile;
    var streamObj;
    
    document.getElementsByClassName('btn-take')[0].addEventListener('click', function() {
    	document.getElementById('view-take').removeAttribute('style');
    	document.getElementById('view-take').className = 'slide-up-in';
    	
    	userMediaFile = null;
    	
    	// init picture shoot
    	var streaming = false;
    	var video = document.querySelector('#view-take video');
    	var canvas = document.querySelector('#view-take canvas#shot');
    	var canvasRuler = document.querySelector('#view-take canvas#ruler');
    	var imgPreview = document.querySelector('#view-take img');
    	var shootButton = document.querySelector('#view-take .btn-shoot');
    	var width = 320;
    	var height = 0;
    	var eyesPosition = 50;
    	var mouthPosition = 200;
    	var middlePosition = 120;
    	
    	navigator.getMedia = (
			navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia
        );
    	
    	navigator.getMedia(
    		{
    			video: true,
    			audio: false
    		},
    		function(stream)
    		{
    			streamObj = stream;
    			video.src = window.URL.createObjectURL(stream);
    			video.play();
    		},
    		function(err)
    		{
    			console.log("An error occured! " + err);
    		}
    	);
    	
    	video.addEventListener('playing', function(ev) {
    		if (!streaming)
    		{
    			// Hack : the videoWidth property should be available after the 'playing' event has fired, but this is not the case in Firefox.
    			var interval = setInterval(function() {
    				if (video.videoWidth > 0) {
    					clearInterval(interval);
    				}
    				else {
    					return false;
    				}
    				console.log("video.videoWidth : " + video.videoWidth);
	    			height = video.videoHeight / (video.videoWidth/width);
	    			video.setAttribute('width', width);
	    			video.setAttribute('height', height);
	    			canvas.setAttribute('width', width);
	    			canvas.setAttribute('height', height);
	    			canvasRuler.setAttribute('width', width);
	    			canvasRuler.setAttribute('height', height);
	    			
	    			video.parentElement.style.height = height + 'px';
	    			
	    			var context = canvasRuler.getContext('2d');
	    			context.lineWidth = 6;
	    			
	    			// eyes ruler
	    			context.beginPath();
	    			context.moveTo(0, eyesPosition);
	    			context.lineTo(width, eyesPosition);
	    			context.stroke();
	    			
	    			// mouth ruler
	    			context.beginPath();
	    			context.moveTo(0, mouthPosition);
	    			context.lineTo(width, mouthPosition);
	    			context.stroke();
	    			
	    			// middle ruler
	    			context.beginPath();
	    			context.moveTo(middlePosition, 0);
	    			context.lineTo(middlePosition, height);
	    			context.stroke();
	    			
	    			streaming = true;
    			}, 100);
    		}
    	}, false);
    	
    	function takePicture()
    	{
    		canvas.width = width;
    		canvas.height = height;
    		canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    		var previewDataUrl = canvas.toDataURL('image/png');
    		imgPreview.setAttribute('src', previewDataUrl);
    		
    		userMediaFile = canvas.mozGetAsFile('tmpFace', 'image/png');
    	}
    	
    	shootButton.addEventListener('click', function(event) {
    		takePicture();
    		event.preventDefault();
    	}, false);
    });
    
    document.getElementsByClassName('btn-cancel')[0].addEventListener('click', function() {
    	document.getElementById('view-take').className = 'slide-down-out';
    	streamObj.stop();
    	//document.getElementById('view-take').style.display = 'none';
    });
    
    document.getElementsByClassName('btn-close')[0].addEventListener('click', function() {
    	document.getElementById('view-show').className = 'slide-down-out';
    	//document.getElementById('view-take').style.display = 'none';
    });
    
    document.getElementsByClassName('btn-delete')[0].addEventListener('click', function() {
    	deletePicture(this.dataset.faceKey);
    	
    	document.getElementById('view-show').className = 'slide-down-out';
    	//document.getElementById('view-take').style.display = 'none';
    });
    
    document.getElementsByClassName('btn-ok')[0].addEventListener('click', function()
    {
    	streamObj.stop();
    	var files = document.querySelector('#take-picture').files;
    	
    	if (userMediaFile) {
    		fileToSave = userMediaFile;
    	}
    	else if (files.length > 0) {
    		fileToSave = files[0];
    	}
    	
    	if (fileToSave)
    	{
            document.getElementById('view-take').className = 'slide-down-out';
            
            // Open a transaction to the database
            var transaction = db.transaction(["FaceFiles"], "readwrite");
            
            var snapDate = new Date();
            
            var imgObject = {
            	file: fileToSave,
            	collection: 'me',
            	date: snapDate,
            	key: 'me_' + snapDate.getTime()
            };
            
            // Revoking ObjectURL
            //URL.revokeObjectURL(imgURL);
            
            // Put the blob into the database
            var request = transaction.objectStore("FaceFiles").add(imgObject, imgObject.key);
            
            request.onsuccess = function(event) {
            	addImageInList(imgObject);
            };
	    	document.getElementById('view-take').className = 'slide-down-out';
	    	//document.getElementById('view-take').style.display = 'none';
    	}
    });
});