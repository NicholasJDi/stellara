(() => {
	const script = document.currentScript;
	const css = new URL("player.css", script.src).href;

	if (!document.querySelector(`link[href="${css}"]`)) {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = css;
		document.head.appendChild(link);
	}

	const { theme, mode, loop } = script.dataset;
	const player = document.createElement('player');
	if (theme === "light") {
		player.classList.add('light');
	} else {
		player.classList.add('dark');
	}

	player.innerHTML = `
		<div class="player-details">
			<div class="player-cover"><img class="player-cover-art"></div>
			<p class="player-title">Unknown</p>
			<p class="player-artist">by Unknown</p>
		</div>
		<div class="player-controls">
			<button class="player-button loop" >
				<svg class="player-loop" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1.25 8A4.75 4.75 0 0 1 6 3.25h4a4.75 4.75 0 1 1 0 9.5H5.31l.72.72-1.06 1.06L2.44 12l2.53-2.53 1.06 1.06-.72.72H10a3.25 3.25 0 0 0 0-6.5H6a3.25 3.25 0 0 0-2.923 4.673l-1.101 1.101A4.73 4.73 0 0 1 1.25 8" fill="currentColor"/></svg>
			</button>
			<button class="player-button previous">
				<svg class="player-previous" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.444 3A.447.447 0 0 0 4 3.45v17.1c0 .248.199.45.444.45h1.778a.447.447 0 0 0 .445-.45v-7.988L19.32 20.57a.444.444 0 0 0 .68-.382V3.812a.444.444 0 0 0-.68-.382L6.667 11.438V3.45A.447.447 0 0 0 6.222 3z" fill="currentColor"/></svg>
			</button>
			<button class="player-button play-pause">
				<svg class="player-play" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12.322 7.576a.5.5 0 0 1 0 .848l-6.557 4.098A.5.5 0 0 1 5 12.098V3.902a.5.5 0 0 1 .765-.424z" fill="currentColor"/></svg>
				<svg class="player-pause" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M10 4.5c0-.276-.252-.5-.563-.5H5.563C5.252 4 5 4.224 5 4.5v15c0 .276.252.5.563.5h3.875c.31 0 .562-.224.562-.5zm9 0c0-.276-.252-.5-.563-.5h-3.875c-.31 0-.562.224-.562.5v15c0 .276.252.5.563.5h3.874c.311 0 .563-.224.563-.5z" fill="currentColor"/></svg>
			</button>
			<button class="player-button next">
				<svg class="player-next" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17.778 3a.447.447 0 0 0-.445.45v7.988L4.68 3.43a.444.444 0 0 0-.68.382v16.376c0 .354.384.569.68.382l12.653-8.007v7.987c0 .248.2.45.445.45h1.778a.447.447 0 0 0 .444-.45V3.45a.447.447 0 0 0-.444-.45z" fill="currentColor"/></svg>
			</button>
			<div class="player-volume">
				<button class="player-button volume">
					<svg class="player-volume-normal" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.146 1.854A.5.5 0 0 1 8 2.207v11.586a.5.5 0 0 1-.854.354L4 11H1.5a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5H4zM15 8a6 6 0 0 1-5.5 5.98v-1.508a4.5 4.5 0 0 0 0-8.945V2.021A6 6 0 0 1 15 8" fill="currentColor"/><path d="M12 8a3 3 0 0 1-2.5 2.959V5.04A3 3 0 0 1 12 8" fill="currentColor"/></svg>
					<svg class="player-volume-low" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.146 1.854A.5.5 0 0 1 8 2.207v11.586a.5.5 0 0 1-.854.354L4 11H1.5a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5H4zM12 8a3 3 0 0 1-2.5 2.959V5.04A3 3 0 0 1 12 8" fill="currentColor"/></svg>
					<svg class="player-volume-muted" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.146 1.854A.5.5 0 0 1 8 2.207v11.586a.5.5 0 0 1-.854.354L4 11H1.5a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5H4zm6.324 8.676L12 9.06l-1.47 1.47-1.06-1.06L10.94 8 9.47 6.53l1.06-1.06L12 6.94l1.47-1.47 1.06 1.06L13.06 8l1.47 1.47z" fill="currentColor"/></svg>
				</button>
				<div class="player-volume-box">
					<input class="player-volume-bar" type="range"/>
				</div>
			</div>
		</div>
		<div class="player-info">
			<p class="player-time">0</p>
			<input class="player-bar" type="range"/>
			<p class="player-length">0</p>
		</div>
	`;
	script.parentNode.insertBefore(player, script);

	const art = player.querySelector('.player-cover-art');
	const title = player.querySelector('.player-title');
	const artist = player.querySelector('.player-artist');

	const time = player.querySelector('.player-time');
	const length = player.querySelector('.player-length');
	const bar = player.querySelector('.player-bar');

	const playPause = player.querySelector('.player-button.play-pause');
	const nextButton = player.querySelector('.player-button.next');
	const previousButton = player.querySelector('.player-button.previous');

	const loopButton = player.querySelector('.player-button.loop');
	const volumeButton = player.querySelector('.player-button.volume');
	const volumeBar = player.querySelector('.player-volume-bar');

	const existing = window.player || {};
	let nextHandler = existing.next || null;
	let previousHandler = existing.previous || null;

	let data = existing.data || JSON.parse(localStorage.getItem('player') || '{}');
	let playing = sessionStorage.getItem('player-playing') === 'true';
	let volume = Number(localStorage.getItem('player-volume') || '0.5');
	if (!isFinite(volume)) volume = 0.5

	let volumeSeeking = false;
	let timeSeeking = false;
	let lengthSeconds = 0;
	let lengthMinutes = 0;
	let lengthHours = 0;

	const audio = new Audio(data?.song);
	Object.defineProperties(audio, {
		clear: {
			value: clear
		},
		next: {
			get() {
				return nextHandler;
			},
			set(handler) {
				nextHandler = typeof handler === 'function' ? handler : null;
				nextButton.classList.toggle('visible', Boolean(nextHandler));
			}
		},
		previous: {
			get() {
				return previousHandler;
			},
			set(handler) {
				previousHandler = typeof handler === 'function' ? handler : null;
				previousButton.classList.toggle('visible', Boolean(previousHandler));
			}
		},
		data: {
			get() {
				return data;
			},
			set(d) {
				data = d
				reset()
			}
		},
	});

	audio.next = nextHandler;
	audio.previous = previousHandler;

	function reset() {
		if (!data.song) {
			clear();
			return;
		}
		audio.volume = volume;
		playing = sessionStorage.getItem('player-playing') === 'true';
		if (audio.src !== data.song) {
			audio.src = data.song;
		}
		const artistList = Array.isArray(data.artist) ? data.artist.join(', ') : data.artist ?? '';
		art.parentElement.classList.toggle('hidden', !data.art);
		art.src = data.art;
		title.textContent = data.title ?? 'Unknown';
		artist.textContent = `by ${artistList ?? 'Unkown'}`;

		player.classList.add('shown');

		localStorage.setItem('player', JSON.stringify(data));
		navigator.mediaSession.metadata = new MediaMetadata({
			title: data.title ?? '',
			artist: artistList,
			artwork: data.art ? [{ src: data.art }] : []
		});
	}

	function clear() {
		audio.pause();
		player.classList.remove('shown');
		localStorage.removeItem('player');
		sessionStorage.removeItem('player-playing');
		data = {};
		navigator.mediaSession.metadata = null;
		navigator.mediaSession.playbackState = 'none';
	}

	function next() {
		if (nextHandler) {
			data = nextHandler(data.id);
			sessionStorage.setItem('player-playing', true)
			reset();
		}
	}

	function previous() {
		if (previousHandler) {
			data = previousHandler(data.id);
			sessionStorage.setItem('player-playing', true)
			reset();
		}
	}

	audio.onloadedmetadata = () => {
		audio.currentTime = data.time || 0;
	};

	audio.oncanplay = () => {
		if (playing) audio.play()
	};

	audio.onplay = () => {
		playing = true;
		playPause.classList.add('pressed');
		sessionStorage.setItem('player-playing', playing);
		navigator.mediaSession.playbackState = 'playing';
	};

	audio.onpause = () => {
		playing = false;
		playPause.classList.remove('pressed');
		sessionStorage.setItem('player-playing', playing);
		navigator.mediaSession.playbackState = 'paused';
	};

	audio.ondurationchange = () => {
		const lengthRaw = audio.duration;
		lengthSeconds = Math.floor(lengthRaw);
		lengthMinutes = Math.floor(lengthRaw / 60);
		lengthHours = Math.floor(lengthRaw / 3600);
		length.textContent = `${lengthHours > 0 ? lengthHours.toString() + ":" : ""}${lengthMinutes > 0 ? (lengthHours > 0 ? (lengthMinutes % 60).toString().padStart(2, "0") + ":" : (lengthMinutes % 60).toString() + ":") : ""}${lengthSeconds > 0 ? (lengthMinutes > 0 ? (lengthSeconds % 60).toString().padStart(2,"0") : (lengthSeconds % 60).toString()) : "0"}`;
		bar.max = Math.floor(lengthRaw);

		const timeRaw = audio.currentTime || 0;
		const timeSeconds = Math.floor(timeRaw);
		const timeMinutes = Math.floor(timeRaw / 60);
		const timeHours = Math.floor(timeRaw / 3600);
		time.textContent = `${lengthHours > 0 ? timeHours.toString().padStart(lengthHours.toString().length,"0") + ":" : ""}${lengthMinutes > 0 ? (lengthHours > 0 ? (timeMinutes % 60).toString().padStart(2, "0") + ":" : (timeMinutes % 60).toString().padStart((lengthMinutes % 60).toString().length,"0") + ":") : ""}${lengthSeconds > 0 ? (lengthMinutes > 0 ? (timeSeconds % 60).toString().padStart(2,"0") : (timeSeconds % 60).toString().padStart((lengthSeconds % 60).toString().length,"0")) : "0"}`;
	};

	let lastSecond = -1;
	audio.ontimeupdate = () => {
		const current = Math.floor(audio.currentTime || -1);
		if (current !== lastSecond) {
			lastSecond = current;
			if (!timeSeeking) {
				const timeRaw = audio.currentTime || 0;
				const timeSeconds = Math.floor(timeRaw);
				const timeMinutes = Math.floor(timeRaw / 60);
				const timeHours = Math.floor(timeRaw / 3600);
				time.textContent = `${lengthHours > 0 ? timeHours.toString().padStart(lengthHours.toString().length,"0") + ":" : ""}${lengthMinutes > 0 ? (lengthHours > 0 ? (timeMinutes % 60).toString().padStart(2, "0") + ":" : (timeMinutes % 60).toString().padStart((lengthMinutes % 60).toString().length,"0") + ":") : ""}${lengthSeconds > 0 ? (lengthMinutes > 0 ? (timeSeconds % 60).toString().padStart(2,"0") : (timeSeconds % 60).toString().padStart((lengthSeconds % 60).toString().length,"0")) : "0"}`;
				bar.value = timeSeconds;
			}

		}
	};

	audio.onvolumechange = () => {
		volume = audio.volume
		localStorage.setItem('player-volume', volume);
		if (!volumeSeeking) {
			volumeBar.value = volume * 100;
			if (volume === 0) {
				volumeButton.classList.remove('low');
				volumeButton.classList.add('muted');
			} else if (volume <= 0.5) {
				volumeButton.classList.remove('muted');
				volumeButton.classList.add('low');
			} else {
				volumeButton.classList.remove('low');
				volumeButton.classList.remove('muted');
			}
		}
	};

	audio.onended = () => {
		if (mode !== "reversed") {
			next();
		} else {
			previous();
		}
	};

	audio.onerror = clear;

	bar.oninput = () => {
		const timeRaw = bar.value || 0;
		const timeSeconds = Math.floor(timeRaw);
		const timeMinutes = Math.floor(timeRaw / 60);
		const timeHours = Math.floor(timeRaw / 3600);
		time.textContent = `${lengthHours > 0 ? timeHours.toString().padStart(lengthHours.toString().length,"0") + ":" : ""}${lengthMinutes > 0 ? (lengthHours > 0 ? (timeMinutes % 60).toString().padStart(2, "0") + ":" : (timeMinutes % 60).toString().padStart((lengthMinutes % 60).toString().length,"0") + ":") : ""}${lengthSeconds > 0 ? (lengthMinutes > 0 ? (timeSeconds % 60).toString().padStart(2,"0") : (timeSeconds % 60).toString().padStart((lengthSeconds % 60).toString().length,"0")) : "0"}`;
		audio.currentTime = bar.value;
	};

	bar.onpointerup = () => {
		timeSeeking = false;
	};

	bar.onpointerdown = () => timeSeeking = true;

	volumeBar.oninput = () => {
		audio.volume = volumeBar.value / 100;
		if (volumeBar.value == 0) {
			volumeButton.classList.remove('low');
			volumeButton.classList.add('muted');
		} else if (volumeBar.value <= 50) {
			volumeButton.classList.remove('muted');
			volumeButton.classList.add('low');
		} else {
			volumeButton.classList.remove('low');
			volumeButton.classList.remove('muted');
		}
	};

	volumeBar.onpointerup = () => {
		volumeSeeking = false;
	};

	volumeBar.onpointerdown = () => volumeSeeking = true;

	volumeButton.onpointerdown = () => volumeButton.classList.toggle('pressed');
	document.addEventListener('click', (event) => {
		if (!volumeButton.parentElement.contains(event.target) ) volumeButton.classList.remove('pressed');
	});

	if (loop === undefined) loopButton.onpointerdown = () => {
		audio.loop = loopButton.classList.toggle('pressed');
	};
	audio.loop = loopButton.classList.toggle('pressed', (loop !== undefined || data.loop || false));

	playPause.onpointerdown = () => {
		if (playing) {
			audio.pause();
		} else {
			audio.play();
		}
	};

	nextButton.onpointerdown = next;
	previousButton.onpointerdown = previous;

	window.addEventListener('beforeunload', () => {
		sessionStorage.setItem('player-playing', !audio.paused);
		localStorage.setItem('player-volume', audio.volume);

		data.time = audio.currentTime || 0;
		if (loop === undefined) data.loop = audio.loop || false;


		localStorage.setItem('player', JSON.stringify(data));
	});

	reset();
	window.player = audio;

	navigator.mediaSession?.setActionHandler('play', () => {
		audio.play();
	});

	navigator.mediaSession?.setActionHandler('pause', () => {
		audio.pause();
	});

	navigator.mediaSession?.setActionHandler('stop', () => {
		clear();
	});

	navigator.mediaSession?.setActionHandler('seekto', (seekTime) => {
		audio.currentTime = seekTime || 0;
	});

	navigator.mediaSession?.setActionHandler('seekforward', (seekOffset) => {
		audio.currentTime += seekOffset;
	});

	navigator.mediaSession?.setActionHandler('seekbackward', (seekOffset) => {
		audio.currentTime -= seekOffset;
	});

	navigator.mediaSession?.setActionHandler('nexttrack', () => {
		next();
	});

	navigator.mediaSession?.setActionHandler('previoustrack', () => {
		previous();
	});
})();