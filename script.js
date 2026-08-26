const record = document.querySelector(".record")
const stop = document.querySelector(".stop")
const soundClips = document.querySelector(".sound-clips")
const canvas = document.querySelector(".visualizer")
const mainSection = document.querySelector(".main-controls")

// disable the stop button while not recording
stop.disabled = true;

// visualizer setup, create audio context and canvas context
let audioCtx;
const canvasCtx = canvas.getContext("2d");

// giant ass block for audio recording
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
	console.log("mediaDevices.getUserMedia() method is supported");

	const constraints = { audio: true };
	let chunks = [];

	let onSuccess = function (stream) {
		const mediaRecorder = new MediaRecorder(stream);

		visualize(stream);

		record.onclick = function () {
			mediaRecorder.start();

			console.log(mediaRecorder.state);
			console.log("Recorder started.");

			record.style.background = "red";
			record.style.color = "white"

			stop.disabled = false;
			record.disabled = true;
		};

		stop.onclick = function () {
			mediaRecorder.stop();

			console.log(mediaRecorder.state);
			console.log("Recorder stopped.");

			record.style.background = "";
			record.style.color = "";

			stop.disabled = true;
			record.disabled = false;
		};

		mediaRecorder.onstop = function (e) {
			console.log("last data to read (after stop() called).");

			const clipName = prompt(
				"enter a name for your sound clip?",
				"couldnt think of one"
			);

			const clipContainer = document.createElement("article");
			const clipLabel = document.createElement("p");
			const audio = document.createElement("audio");
			const deleteButton = document.createElement("button");

			clipContainer.classList.add("clip");
			audio.setAttribute("controls", "");
			deleteButton.textContent = "Delete";
			deleteButton.className = "delete"

			if (clipName === null) {
				clipLabel.textContent = "My unnamed clip";
			} else {
				clipLabel.textContent = clipName;
			}

			clipContainer.appendChild(audio);
			clipContainer.appendChild(clipLabel);
			clipContainer.appendChild(deleteButton);
			soundClips.appendChild(clipContainer);
			
			// audio.controls = true;
			console.log(chunks);
			const blob = new Blob(chunks, { type: mediaRecorder.mimeType });

			// analyze blob ??
			const analyser = audioCtx.newAnalyser();
			analyser.fftSize = 4096;


			chunks = [];
			const audioURL = window.URL.createObjectURL(blob);
			audio.src = audioURL;
			console.log(" recorder stopped agian");

			deleteButton.onclick = function (e) {
				e.target.closest(".clip").remove();
			};
			

		};

		mediaRecorder.ondataavailable = function (e) {
			console.log("chunks and shit");
			console.log(chunks);
			chunks.push(e.data);
			console.log(chunks);
		};
	};

	let onError = function (err) {
		console.log("the following error occured ", err);
	};

	navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
} else {
	alert("Your browser does not support audio capture.");
}

function visualize(stream) {
	if(!audioCtx) {
		audioCtx = new AudioContext();
	}

	const source = audioCtx.createMediaStreamSource(stream);

	const bufferLength = 2048;
	const analyser = audioCtx.createAnalyser();
	analyser.fftSize = bufferLength;
	const dataArray = new Uint8Array(bufferLength);

	source.connect(analyser);

	draw();

	function draw() {
		const WIDTH = canvas.width;
		const HEIGHT = canvas.height;

		requestAnimationFrame(draw);

		analyser.getByteTimeDomainData(dataArray);

		canvasCtx.fillStyle = "rgb(200, 200, 200)";
		canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

		canvasCtx.lineWidth = 2;
		canvasCtx.strokeStyle = "rgb(0, 0, 0)"

		canvasCtx.beginPath();

		let sliceWidth = WIDTH / bufferLength;
		let x = 0;

		for (let i = 0; i < bufferLength; i++) {
			let v = dataArray[i] / 128.0;
			let y = (v * HEIGHT) / 2;

			if (i === 0) {
				canvasCtx.moveTo(x, y);
			} else {
				canvasCtx.lineTo(x, y);
			}
			x += sliceWidth;
		}


		canvasCtx.lineTo(WIDTH, HEIGHT / 2);
		canvasCtx.stroke();
	}
}
