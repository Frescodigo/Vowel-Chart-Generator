if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
	// user media is supported on browser!
	navigator.getUserMedia(
		//constraints
		{
			audio: true,
		}
	)
	// callback if successful
	.then((stream) => {
		const mediaRecorder = new MediaRecorder(stream);
	})
	.catch((err) => {
		console.error(`oops: ${err}`);
	});
} else {
	alert("Your browser does not support audio capture.");
}
