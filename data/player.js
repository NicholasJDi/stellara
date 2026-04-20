const path = window.location.pathname.replace(/\/$/, '');
const isMusic = path.includes('/music');

let audio = null;
let data = null;

let loaded = false;

try {
	const saved = localStorage.getItem('player');
	if (!saved) throw null;

	data = JSON.parse(saved);
	if (!data?.song) throw null;
	data.playing = sessionStorage.getItem('player-playing') || false;

	prepareAudio(data.song);
} catch (e) {
	if (e) console.error('Invalid player data', e);
}

function playerError(e) {
	if (window.playerHide) {
		window.playerHide();
		localStorage.removeItem('player');
		sessionStorage.removeItem('player-playing');
	}
}

function prepareAudio(song) {
	if (song) {
		audio = new Audio(song);
	} else {
		audio = new Audio();
	}
	
	audio.onloadedmetadata = () => {
		if (loaded) {
			songChanged(false);
		}
		if (!isMusic) {
			audio.loop = true;
		}
		if (data?.time) {
			audio.currentTime = data.time;
		}
		if (data?.playing) {
			audio.play().catch(() => { document.addEventListener('click', () => { audio.play().catch(() => {}); }, { once: true }); });
		}
		if (loaded) {
			updateState();
		}
	};

	audio.onended = () => { if (window.playerNext) window.playerNext(data.id); };

	audio.onerror = playerError;
	
	let lastSecond = -1;
	audio.ontimeupdate = () => {
		const current = Math.floor(window.playerAudio.currentTime);
		if (current !== lastSecond) {
			lastSecond = current;
			if (loaded) updateState();
		}
	};
	
	window.playerAudio = audio
}
window.playerPrepare = prepareAudio;

window.addEventListener('beforeunload', () => {
	if (!window.playerAudio) return;

	const saved = localStorage.getItem('player');
	if (!saved) return;

	const state = JSON.parse(saved);
	if (!state) return;

	state.time = window.playerAudio.currentTime || 0;
	state.loop = window.playerAudio.loop || false;

	sessionStorage.setItem('player-playing', !window.playerAudio.paused || false);

	localStorage.setItem('player', JSON.stringify(state));
});

let playPause = null;
let updatePlayer = () => {console.warn('updatePlayer() was called before load')};
let updateState = () => {console.warn('updateState() was called before load')};
document.addEventListener("DOMContentLoaded", () => {
	const player = document.querySelector('.player');
	if (!player) return;
	if (window.playerAudio || isMusic) {
		// Basic Integration
		const art = player.querySelector('.player-cover-art');
		const title = player.querySelector('.player-title');
		const artist = player.querySelector('.player-artist');

		const loop = player.querySelector('.player-button.loop');
		const volume = player.querySelector('.player-button.volume'); // this is for later :3
		
		const time = player.querySelector('.player-time');
		const length = player.querySelector('.player-length');
		const bar = player.querySelector('.player-bar');

		playPause = player.querySelector('.player-button.play-pause');

		let seeking = false;

		let lengthRaw = 0;
		let lengthSeconds = 0;
		let lengthMinutes = 0;
		let lengthHours = 0;
		updatePlayer = () => {
			// UI Update
			art.classList.toggle('hidden', !data?.art)
			art.src = data?.art;
			title.textContent = data?.title || '';
			artist.textContent = `by ${data?.artist}`;
			lengthRaw = window.playerAudio.duration;
			lengthSeconds = Math.floor(lengthRaw);
			lengthMinutes = Math.floor(lengthRaw / 60);
			lengthHours = Math.floor(lengthRaw / 3600);
			length.textContent = `${lengthHours > 0 ? lengthHours.toString() + ":" : ""}${lengthMinutes > 0 ? (lengthHours > 0 ? (lengthMinutes % 60).toString().padStart(2, "0") + ":" : (lengthMinutes % 60).toString() + ":") : ""}${lengthSeconds > 0 ? (lengthMinutes > 0 ? (lengthSeconds % 60).toString().padStart(2,"0") : (lengthSeconds % 60).toString()) : "0"}`;
			bar.max = Math.floor(lengthRaw);
			playPause.classList.toggle('pressed', !window.playerAudio.paused);
			if (data?.song) player.classList.add('shown');
		}
		
		updateState = () => {
			// Time Update
			const timeRaw = window.playerAudio.currentTime;
			const timeSeconds = Math.floor(timeRaw);
			const timeMinutes = Math.floor(timeRaw / 60);
			const timeHours = Math.floor(timeRaw / 3600);
			time.textContent = `${lengthHours > 0 ? timeHours.toString().padStart(lengthHours.toString().length,"0") + ":" : ""}${lengthMinutes > 0 ? (lengthHours > 0 ? (timeMinutes % 60).toString().padStart(2, "0") + ":" : (timeMinutes % 60).toString().padStart((lengthMinutes % 60).toString().length,"0") + ":") : ""}${lengthSeconds > 0 ? (lengthMinutes > 0 ? (timeSeconds % 60).toString().padStart(2,"0") : (timeSeconds % 60).toString().padStart((lengthSeconds % 60).toString().length,"0")) : "0"}`;
			if (!seeking) bar.value = Math.floor(timeRaw);
		}

		window.playerHide = () => { player.classList.remove('shown') };

		bar.onpointerdown = () => { seeking = true; };
		document.addEventListener('mouseup', () => { seeking = false; });

		bar.oninput = () => { if (window.playerAudio) window.playerAudio.currentTime = bar.value; };

		playPause.onpointerdown = () => {
			const playing = !window.playerAudio.paused;
			playPause.classList.toggle('pressed', !playing);

			if (playing) {
				window.playerAudio.pause();
			} else {
				window.playerAudio.play();
			}
		};

		loop.onpointerdown = () => { if ( isMusic && window.playerAudio) window.playerAudio.loop = loop.classList.toggle('pressed'); };
		loop.classList.toggle('pressed', data?.loop || !isMusic ? true : false);
	}

	if (isMusic) {
		player.classList.add('expanded');
		
		const next = player.querySelector('.player-button.next');
		const previous = player.querySelector('.player-button.previous');
		
		next.onpointerdown = () => { if (window.playerNext) window.playerNext(data.id); }
		previous.onpointerdown = () => { if (window.playerNext) window.playerPrevious(data.id); }	
	}
	
	if (window.playerAudio) {
		updatePlayer();
		updateState();
	}

	loaded = true;
});

function songChanged(update = true) {
	const saved = localStorage.getItem('player');
	if (!saved) return;
	data = JSON.parse(saved);
	data.playing = sessionStorage.getItem('player-playing') || false;

	updatePlayer();
	if (update) updateState();
	if (playPause) playPause.classList.toggle('pressed', !window.playerAudio.paused);
}