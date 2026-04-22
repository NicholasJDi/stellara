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

	prepareAudio(data.song);
} catch (e) {
	if (e) console.error('Invalid player data', e);
}

function playerStop() {
	if (window.playerHide) {
		window.playerHide();
		localStorage.removeItem('player');
		sessionStorage.removeItem('player-playing');
		updateState(true, true);
		window.playerAudio = null;
		data = null;
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
		if (data?.time) {
			audio.currentTime = data.time;
		}
		if (data?.volume) {
			audio.volume = data.volume;
			updateVolume(data.volume * 100);
		}
		if (data?.playing) {
			audio.play().catch(() => { document.addEventListener('click', () => { audio.play().catch(() => {}); updatePlayer(); updateState(); }, { once: true }); });
		}
		if (!isMusic) {
			audio.loop = true;
		}
		if (loaded) {
			updatePlayer();
			updateState();
		}
	};

	audio.onended = () => { if (window.playerNext) window.playerNext(data.id); };

	audio.onerror = playerStop;

	let lastSecond = -1;
	audio.ontimeupdate = () => {
		const current = Math.floor(window.playerAudio.currentTime);
		if (current !== lastSecond) {
			lastSecond = current;
			if (loaded) updateState();
		}
	};

	audio.onplay = () => { if (loaded) updateState(true); }
	audio.onpause = () => { if (loaded) updateState(true); }
	audio.onseeked = () => { if (loaded) updateState(true); }

	window.playerAudio = audio
}
window.playerPrepare = prepareAudio;

window.addEventListener('beforeunload', () => {
	if (!window.playerAudio) return;

	sessionStorage.setItem('player-playing', !window.playerAudio.paused);
	localStorage.setItem('player-volume', window.playerAudio.volume);

	const saved = localStorage.getItem('player');
	if (!saved) return;

	const state = JSON.parse(saved);
	if (!state) return;

	state.time = window.playerAudio.currentTime || 0;
	state.loop = window.playerAudio.loop || false;


	localStorage.setItem('player', JSON.stringify(state));
});

let updatePlayer = () => {console.warn('updatePlayer() was called before load')};
let updateState = () => {console.warn('updateState() was called before load')};
let updateVolume = () => {console.warn('updateVolume() was called before load')}
document.addEventListener("DOMContentLoaded", () => {
	const player = document.querySelector('.player');
	if (!player) return;
	if (window.playerAudio || isMusic) {
		// Basic Integration
		const art = player.querySelector('.player-cover-art');
		const title = player.querySelector('.player-title');
		const artist = player.querySelector('.player-artist');

		const time = player.querySelector('.player-time');
		const length = player.querySelector('.player-length');
		const bar = player.querySelector('.player-bar');

		const playPause = player.querySelector('.player-button.play-pause');
		const loop = player.querySelector('.player-button.loop');
		
		const volume = player.querySelector('.player-button.volume');
		const volumeBar = player.querySelector('.player-volume-bar');

		let seeking = false;

		let lengthRaw = 0;
		let lengthSeconds = 0;
		let lengthMinutes = 0;
		let lengthHours = 0;
		updatePlayer = () => {
			// UI Update
			art.parentElement.classList.toggle('hidden', !data?.art)
			art.src = data?.art;
			title.textContent = data?.title ?? 'Unknown';
			artist.textContent = `by ${data?.artist ?? 'Unkown'}`;
			lengthRaw = window.playerAudio.duration;
			lengthSeconds = Math.floor(lengthRaw);
			lengthMinutes = Math.floor(lengthRaw / 60);
			lengthHours = Math.floor(lengthRaw / 3600);
			length.textContent = `${lengthHours > 0 ? lengthHours.toString() + ":" : ""}${lengthMinutes > 0 ? (lengthHours > 0 ? (lengthMinutes % 60).toString().padStart(2, "0") + ":" : (lengthMinutes % 60).toString() + ":") : ""}${lengthSeconds > 0 ? (lengthMinutes > 0 ? (lengthSeconds % 60).toString().padStart(2,"0") : (lengthSeconds % 60).toString()) : "0"}`;
			bar.max = Math.floor(lengthRaw);
			if (data?.song) player.classList.add('shown');
			syncMediaSession();
		};
		
		updateState = (sync = false, clear = false) => {
			// Playing Update
			playPause.classList.toggle('pressed', !window.playerAudio.paused);
			// Time Update
			const timeRaw = window.playerAudio.currentTime;
			const timeSeconds = Math.floor(timeRaw);
			const timeMinutes = Math.floor(timeRaw / 60);
			const timeHours = Math.floor(timeRaw / 3600);
			time.textContent = `${lengthHours > 0 ? timeHours.toString().padStart(lengthHours.toString().length,"0") + ":" : ""}${lengthMinutes > 0 ? (lengthHours > 0 ? (timeMinutes % 60).toString().padStart(2, "0") + ":" : (timeMinutes % 60).toString().padStart((lengthMinutes % 60).toString().length,"0") + ":") : ""}${lengthSeconds > 0 ? (lengthMinutes > 0 ? (timeSeconds % 60).toString().padStart(2,"0") : (timeSeconds % 60).toString().padStart((lengthSeconds % 60).toString().length,"0")) : "0"}`;
			if (!seeking) bar.value = Math.floor(timeRaw);
			if (sync) syncMediaSession(clear);
		};

		updateVolume = (override) => {
			if (override) volumeBar.value = override;
			if (window.playerAudio) window.playerAudio.volume = volumeBar.value / 100;

			if (volumeBar.value == 0) {
				volume.classList.remove('low');
				volume.classList.add('muted');
			} else if (volumeBar.value <= 50) {
				volume.classList.remove('muted');
				volume.classList.add('low');
			} else {
				volume.classList.remove('low');
				volume.classList.remove('muted');
			}
		};

		function syncMediaSession(clear = false) {
			if (navigator.mediaSession && window.playerAudio) {

				if (!clear) {
					navigator.mediaSession.metadata = new MediaMetadata({
						title: data?.title ?? '',
						artist: data?.artist ?? '',
						artwork: data?.art ? [{ src: data.art }] : []
					})
				
					navigator.mediaSession.playbackState = window.playerAudio.paused ? 'paused' : 'playing';
				} else {
					navigator.mediaSession.metadata = null;
					navigator.mediaSession.playbackState = 'none';
				}
			}
		}

		window.playerHide = () => { player.classList.remove('shown'); syncMediaSession(true); };

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

		volume.onclick = () => { volume.classList.toggle('pressed'); };
		document.addEventListener('click', (event) => { if (!volume.parentElement.contains(event.target) ) volume.classList.remove('pressed'); });

		updateVolume(data?.volume * 100);
		volumeBar.oninput = () => { updateVolume(); };

		if (isMusic) loop.onpointerdown = () => { if ( window.playerAudio) window.playerAudio.loop = loop.classList.toggle('pressed'); };
		loop.classList.toggle('pressed', (data?.loop || !isMusic));

		navigator.mediaSession?.setActionHandler('play', () => {
			if (window.playerAudio) window.playerAudio.play();
		});

		navigator.mediaSession?.setActionHandler('pause', () => {
			if (window.playerAudio) window.playerAudio.pause();
		});

		navigator.mediaSession?.setActionHandler('stop', () => {
			playerStop();
		});

		navigator.mediaSession?.setActionHandler('seekto', (seekTime) => {
			if (window.playerAudio) window.playerAudio.currentTime = seekTime || 0;
		});

		navigator.mediaSession?.setActionHandler('seekforward', (seekOffset) => {
			if (window.playerAudio) window.playerAudio.currentTime = window.playerAudio.currentTime + seekOffset;
		});
		navigator.mediaSession?.setActionHandler('seekbackward', (seekOffset) => {
			if (window.playerAudio) window.playerAudio.currentTime = window.playerAudio.currentTime - seekOffset;
		});
	}

	if (isMusic) {
		player.classList.add('expanded');

		const next = player.querySelector('.player-button.next');
		const previous = player.querySelector('.player-button.previous');

		next.onpointerdown = () => { if (window.playerNext) window.playerNext(data.id); }
		previous.onpointerdown = () => { if (window.playerNext) window.playerPrevious(data.id); }

		navigator.mediaSession?.setActionHandler('nexttrack', () => {
			if (window.playerNext) window.playerNext(data?.id);
		});

		navigator.mediaSession?.setActionHandler('previoustrack', () => {
			if (window.playerPrevious) window.playerPrevious(data?.id);
		});
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
	data.playing = sessionStorage.getItem('player-playing') === 'true';
	data.volume = Number(localStorage.getItem('player-volume') || '0.5');

	if (update) {
		updatePlayer();
		updateState();
	}
}