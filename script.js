const canvas = document.querySelector("canvas");

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
	console.log("mediaDevices.getUserMedia() method is supported");
	const constraints = { audio: true };

	const onSuccess = function(stream) {
		console.log("success!");


		const audioContext = new AudioContext();
		const source = audioContext.createMediaStreamSource(stream);
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 2 ** 13 // apparently bigger is better for frequency detail, must be a power of 2
		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		source.connect(analyser);

		const canvasContext = canvas.getContext("2d");
		draw();

		function draw() {
			requestAnimationFrame(draw);

			const WIDTH = canvas.width;
			const HEIGHT = canvas.height;

			// put decibel value from 0->255 assuming 255 is loudest
			analyser.getByteFrequencyData(dataArray);
			
			// smoothe and find local maxima
			const peaks = findPeaks(dataArray);

			console.log("start debug");
			for (let peak of peaks) {
				console.log(`peak at [${peak}] : ${dataArray[peak]}`)
			}
		}
	}

	const onFailure = function(err) {
		console.error(err);
	}

	navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onFailure);

} else {
	alert("Your browser does not support audio capture.");
}


// finds local maxima
// algorithm borrowed from scipy
function findPeaks(data) {
	peaks = []

	// smoothe data
	const smoothed = new Uint8Array(data.length);
	const WINDOW_SIZE = 8;
	let window_sum = 0;
	for (let i = 0; i < WINDOW_SIZE; i++) {
		window_sum += data[i];
	}
	for (let i = 0; i < data.length - WINDOW_SIZE; i++) {
		smoothed[i] = window_sum / WINDOW_SIZE;
		window_sum += data[i + WINDOW_SIZE] - data[i];
	}

	console.log("smoothed: ", smoothed);
	console.log("data: ", data);

	let i = 1; // maxima can't be first sample
	const iMax = data.length - 1; // maxima can't be last sample
	// find any local maxima
	while (i < iMax) {
		// we know that sample at i is bigger than the sample before
		if (smoothed[i - 1] < smoothed[i]) {
			let iAhead = i + 1;

			// increment lookahead while it's the same as the sample at i
			while (iAhead < iMax && smoothed[iAhead] == smoothed[i]) {
				iAhead++;
			}

			// if the next unequal sample is less than sample at i, it's a peak
			if (smoothed[iAhead] < smoothed[i]) {
				const peak = Math.floor((i + iAhead - 1) / 2);
				peaks.push(peak);
				i = iAhead;
			}
		}
		i++;
	}

	// trim the fat late

	return peaks;
}

