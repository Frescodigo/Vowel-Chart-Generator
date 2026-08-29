const canvas = document.querySelector(".visualizer");

const FPS = 30;

let isSmoothed = true;
let pause = false;
document.addEventListener("keydown", (event) => {
	const keyName = event.key;

	if (keyName === " ") {
		isSmoothed = !isSmoothed;
	} else if (keyName === "p") {
		pause = !pause
	}
});

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
	console.log("mediaDevices.getUserMedia() method is supported");
	const constraints = { audio: true };

	const onSuccess = function(stream) {
		console.log("success!");


		const audioContext = new AudioContext();
		const source = audioContext.createMediaStreamSource(stream);
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 8192 // apparently bigger is better for frequency detail, must be a power of 2
		analyser.smoothingTimeConstant = 0; // range of [0, 1], is used for temporal smoothing, default is 0.8
		analyser.maxDecibels = -5;
		const binCount = analyser.frequencyBinCount;
		let freqDomain = new Uint8Array(binCount);

		source.connect(analyser);

		const drawContext = canvas.getContext("2d");

		draw();

		function draw() {

			const WIDTH = canvas.width;
			const HEIGHT = canvas.height;

			if (pause) {
				requestAnimationFrame(draw);
				return;
			}

			drawContext.clearRect(0, 0, WIDTH, HEIGHT);

			// put decibel value from 0->255 assuming 255 is loudest
			analyser.getByteFrequencyData(freqDomain);
			freqDomain = freqDomain.slice(0, 4096)


			// smooth data;
			console.log(isSmoothed);
			if (isSmoothed) {
				freqDomain = smooth(freqDomain);
			}

			// peaks
			const peaks = findPeaks(freqDomain);

			const barWidth = WIDTH / binCount;
			for (let i = 0; i < binCount; i++) {
				const value = freqDomain[i];
				const percent = value / 255;
				const barHeight = percent * HEIGHT;
				const offset = HEIGHT - barHeight - 1;
				// const offset = 0;
				const hue = i / binCount * 360;

				drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
				drawContext.fillRect(i * barWidth, offset, barWidth, barHeight);
			}

			for (let i = 0; i < peaks.length; i++) {

				// bullshit for drawing a circle
				const freq = peaks[i];
				const x = freq * barWidth;
				const y = HEIGHT - (freqDomain[freq] * HEIGHT / 255);
				// const y = freqDomain[freq] * HEIGHT / 255;
				const r = 3;

				drawContext.beginPath();
				drawContext.fillStyle = "blue";
				drawContext.arc(x, y, r, 0, 2 * Math.PI, false);
				drawContext.fill();
			}
			setTimeout(draw, 1000 / FPS);
		}
	}

	const onFailure = function(err) {
		console.error(err);
	}

	navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onFailure);

} else {
	alert("Your browser does not support audio capture.");
}

function smooth(data) {
	const smoothed = new Uint8Array(data.length);
	const WINDOW_SIZE = 16;
	let windowSum = 0;
	for (let i = 0; i < WINDOW_SIZE; i++) {
		windowSum += data[i];
	}
	for (let i = 0; i < data.length - WINDOW_SIZE; i++) {
		smoothed[i] = windowSum / WINDOW_SIZE;
		windowSum += data[i + WINDOW_SIZE] - data[i];
	}

	return smoothed;
}

// finds local maxima
// algorithm borrowed from scipy
function findPeaks(data) {
	const peaks = []

	const minHeight = 20;

	let i = 200; // maxima can't be first sample, also skip the first 200 hZ
	// const iMax = data.length - 1; // maxima can't be last sample
	const iMax = 2500;
	// find any local maxima
	for (let i = 200; i < 2500; i++) {
		if (data[i] < minHeight) continue;
		// we know that sample at i is bigger than the sample before
		if (data[i - 1] < data[i]) {

			let iAhead = i + 1;

			// increment lookahead while it's the same as the sample at i
			while (iAhead < iMax && data[iAhead] === data[i]) {
				iAhead++;
			}

			// if the next unequal sample is less than sample at i, it's a peak
			if (data[iAhead] < data[i]) {
				const peak = Math.floor((i + iAhead - 1) / 2);
				peaks.push(peak);
				i = iAhead;
			}
		}
	}

	const minDistance = 50;

	const priority = [];
	for (let i = 0; i < peaks.length; i++) {
		priority[i] = data[peaks[i]];
	}

	let priorityToPosition = argSort(priority);

	const toss = new Uint8Array(peaks.length);
	// priority is the heights at the peak, we want the tallest peaks
	for (let i = peaks.length - 1; i >= 0; i--) {
		// get the position of the peak
		const j = priorityToPosition[i];
		console.log(j);

		// don't need to evalue peaks that we already eliminated
		if (toss[j] === 1) {
			continue;
		}

		// toss out all peaks to the left that are too close
		for (let k = j - 1; k >= 0 && peaks[j] - peaks[k] < minDistance; k--) {
			toss[k] = 1;
		}

		// toss out all peaks to the right that are too close
		for (let k = j + 1; k < peaks.length && peaks[k] - peaks[j] < minDistance; k++) {
			toss[k] = 1;
		}
	}

	const keep = [];
	for (let i = 0; i < peaks.length; i++) {
		if (!toss[i]) {
			keep.push(peaks[i]);
		}
	}

	return keep;
}

// this is replicates the behavior of np.argsort()
function argSort(array) {
	return array.map((v, i) => [v,i]).sort().map(([_,i]) => i);
}


