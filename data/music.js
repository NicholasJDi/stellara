import { sortDataBySchemeMode, sortDataBySearch } from "./search-sort.js";

export default searchSort;

const noResultsText = document.querySelector('.no-results-text');

let loadFailed = false;
let hashHandled = false;

async function fetchJsonData(url, backup = {}) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Network response was not ok ${response.status} ${response.statusText}`);
		}
		return await response.json();
	} catch (error) {
		console.error(`Error fetching or parsing JSON: ${error}`);
		return backup;
	}
}

const songListItems = new Map();
const visibleSongListItems = new Set();

const data = new Map();

const dropdown = document.querySelector('.dropdown');
const dropdownDownload = dropdown.querySelector('#download-with-art');
const dropdownDownloadNoArt = dropdown.querySelector('#download-no-art');
const dropdownDownloadLibrary = dropdown.querySelector('#download-library');
const dropdownDownloadArt = dropdown.querySelector('#download-art-high-res');
const dropdownOpenMenu = dropdown.querySelector('#open-menu');

const trackInfoMenu = document.querySelector('.track-info-menu');
const rawDataMenu = trackInfoMenu.querySelector('.raw-data-menu');
const menuCloseButton = trackInfoMenu.querySelector('.close-info-menu-button');
const menuSizeButton = trackInfoMenu.querySelector('.size-info-menu-button');
const rawDataButton = trackInfoMenu.querySelector('.raw-data-menu-button');
const trackInfoButton = trackInfoMenu.querySelector('.track-info-menu-button');

const infoMenu = trackInfoMenu.querySelector('.info-menu');

const rawData = await fetchJsonData("https://nicholasjdi.github.io/stellara/data/music/data.json", null);
const searchScheme = await fetchJsonData("https://nicholasjdi.github.io/stellara/data/music/search.json", null);
const sortScheme = await fetchJsonData("https://nicholasjdi.github.io/stellara/data/music/sort.json", null);
const songList = document.querySelector('.song-list');
if (rawData && searchScheme && sortScheme && songList) {
	try {
		const typeMap = {
			single: 'Single',
			remix: 'Remix',
			album: 'Album',
			ep: 'EP'
		};
		// populate songList
		for (const song of rawData) {
			// prepare stuff
			const id = song.id;
			if (!id) {
				console.error(`${JSON.stringify(song)} does not include an id`);
				continue;
			}
			const art = song.art ?? song.art_high_res ?? '';
			const art_high_res = song.art_high_res ?? song.art ?? '';
			if (!art || !art_high_res) {
				console.warn(`${JSON.stringify(song)} does not include art`);
			}
			const title = song.title ?? 'Missing Title :<';
			const artists = song.artists?.join(', ') ?? 'Missing Artist(s) :<';
			const date = getDateString(song.date) ?? 'Unknown';
			const album = song.album ?? song.title ?? '';
			const type = typeMap[song.type?.toLowerCase()] ?? 'Unknown';

			// save data
			data.set(id, song);

			// build the item
			const songListItem = document.createElement("div");
			songListItem.className = 'song-list-item';
			songListItem.id = id;

			// set the items content
			songListItem.innerHTML = `
				<a class="cover-art link" target="_blank" href="${art_high_res}">
					<img class="cover-art image" src="${art}" onerror="this.style.visibility='hidden'">
				</a>
				<div class="content-box">
					<div class="details-box">
						<p class="title-text">${title}</p>
						<p class="artist-text">${artists}</p>
					</div>
					<div class="right-box">
						<div class="info-box">
							<div class="date-box">
								<p class="date-text">${date}</p>
							</div>
							<div class="type-box">
								<p class="type-text ${type.toLowerCase()}" title="${album}">${type}</p>
							</div>
						</div>
						<div class="dropdown-box">
							<button class="play-button"><svg width="1.3em" height="1.3em" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12.322 7.576a.5.5 0 0 1 0 .848l-6.557 4.098A.5.5 0 0 1 5 12.098V3.902a.5.5 0 0 1 .765-.424z" fill="currentColor"/></svg> Play</button>
							<button class="dropdown-button">V</button>
						</div>
					</div>
				</div>
			`

			// add the item
			songListItems.set(id, songListItem);
			songList.appendChild(songListItem);
		}

		songList.addEventListener('click', (event) => {
			if (!dropdown) return;

			const button = event.target.closest('.dropdown-button');
			if (!button) return;

			const songItem = button.closest('.song-list-item');
			const dropdownBox = button.closest('.dropdown-box');

			if (!songItem || !dropdownBox) return;

			const id = songItem.id;

			handleDropdownClick(id, dropdownBox);
		});

		songList.addEventListener('click', (event) => {
			const button = event.target.closest('.play-button');
			if (!button) return;

			const songItem = button.closest('.song-list-item');
			if (!songItem) return;
			const id = songItem.id;

			playSong(id);
		});

		document.addEventListener('click', (event) => {
			if (!dropdown.classList.contains('open')) return;

			if (!dropdown.parentElement.contains(event.target)) {
				hideDropdown(dropdown.parentElement);
			}
		});

		if (dropdownOpenMenu) {
			dropdownOpenMenu.onclick = () => {
				const songItem = dropdownOpenMenu.closest('.song-list-item');
				if (!songItem) return;
				const id = songItem.id;

				showTrackInfoMenu(id);
				hideDropdown(dropdown.parentElement);
			};
		}

		if (menuCloseButton) {
			menuCloseButton.onclick = () => {
				hideTrackInfoMenu();
			};
		}

		if (menuSizeButton) {
			menuSizeButton.onclick = () => {
				const isFull = trackInfoMenu.classList.toggle('full');
				menuSizeButton.textContent = isFull ? '–' : '□';

				// force layout recalculation
				requestAnimationFrame(() => {
					trackInfoMenu.style.display = 'none';
					trackInfoMenu.offsetHeight; // force reflow
					trackInfoMenu.style.display = '';
				});
			};
		}

		if (rawDataMenu) {
			if (rawDataButton) {
				rawDataButton.onclick = () => {
					rawDataMenu.classList.add('visible');
					if (rawDataMenu.id != trackInfoMenu.id) {
						rawDataMenu.id = trackInfoMenu.id;
						setRawDataMenuContent(rawDataMenu.id);
					}
				};
			}
			if (trackInfoButton) {
				trackInfoButton.onclick = () => {
					rawDataMenu.classList.remove('visible');
				};
			}
		}

		window.addEventListener('hashchange', handleHash);

	} catch (e) {
		console.error(`${e}`)
	}
} else {
	loadFailed = true;
	console.error(`Failed to fetch Json data, listData: ${!!rawData}; searchScheme: ${!!searchScheme}; sortScheme: ${!!sortScheme}; songList: ${!!songList};`);
}

function getDateString(date) {
	if (!date) return;
	const nums = date.split('-');
	if (nums.length != 3) return;
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const index = Number(nums[1]) - 1;
	return `${months[index]} ${nums[2]}, ${nums[0]}`;
}

function searchSort(query, sort, reverse) {
	if (loadFailed) return;
	const sorted = sortDataBySchemeMode(rawData, sortScheme, sort);
	const data = sortDataBySearch(sorted, searchScheme, query);
	const ids = data.map(item => item.id).filter(Boolean);
	if (reverse) ids.reverse();
	musicListUpdate(ids);
	if (hashHandled) return;
	handleHash();
	hashHandled = true;
}

function musicListUpdate(ids) {
	songList.classList.add('hidden');

	// remove previous
	for (const songListItem of visibleSongListItems) {
		songListItem.classList.remove("visible");
	}
	visibleSongListItems.clear();

	if (ids.length === 0) {
		// no results
		if (noResultsText) {
			noResultsText.classList.add("visible");
			visibleSongListItems.add(noResultsText);
		}
	} else {
		// add new
		const fragment = document.createDocumentFragment();

		for (const id of ids) {
			const songListItem = songListItems.get(id);
			if (!songListItem) continue;

			songListItem.classList.add("visible");
			fragment.appendChild(songListItem);
			visibleSongListItems.add(songListItem);
		}

		songList.appendChild(fragment);
	}
	songList.classList.remove('hidden');
}

function handleHash() {
	const id = window.location.hash.slice(1);
	if (!id) return;

	const item = songList.querySelector(`#${CSS.escape(id)}`);
	if (!item) return;

	if (item.classList.contains('visible')) {
		item.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
	}

	if (trackInfoMenu.classList.contains('visible')) {
		hideTrackInfoMenu();
	}
	showTrackInfoMenu(id);
}

function handleDropdownClick(id, dropdownBox) {
	if (dropdown.classList.contains('open')) {
		hideDropdown(dropdown.parentElement);
		if (dropdown.parentElement !== dropdownBox) {
			setDropdownContent(id)
			showDropdown(dropdownBox);
		}
	} else {
		if (dropdown.parentElement !== dropdownBox) {
			setDropdownContent(id)
		}
		showDropdown(dropdownBox);
	}
}

function setDropdownContent(id) {
	const song = data.get(id)
	const withArt = song.file_art;
	const noArt = song.file;
	const library = song.file_library;
	const art = song.art_high_res ?? song.art;

	if (withArt) {
		dropdownDownload.classList.remove('hidden');
		dropdownDownload.href = withArt;
	} else {
		dropdownDownload.classList.add('hidden');
	}

	if (noArt) {
		dropdownDownloadNoArt.classList.remove('hidden');
		dropdownDownloadNoArt.href = noArt;
	} else {
		dropdownDownloadNoArt.classList.add('hidden');
	}

	if (library) {
		dropdownDownloadLibrary.classList.remove('hidden');
		dropdownDownloadLibrary.href = library;
	} else {
		dropdownDownloadLibrary.classList.add('hidden');
	}

	if (art) {
		dropdownDownloadArt.classList.remove('hidden');
		dropdownDownloadArt.href = art;
	} else {
		dropdownDownloadArt.classList.add('hidden');
	}
}

function showDropdown(dropdownBox) {
	dropdownBox.appendChild(dropdown);
	dropdownBox.querySelector('.play-button').style.zIndex = 101;
	dropdownBox.querySelector('.dropdown-button').style.zIndex = 101;
	dropdown.classList.add('open');
}

function hideDropdown(dropdownBox) {
	dropdown.classList.remove('open');
	dropdownBox.querySelector('.play-button').style.zIndex = '';
	dropdownBox.querySelector('.dropdown-button').style.zIndex = '';
}

function showTrackInfoMenu(id) {
	if (id !== trackInfoMenu.id) {
		trackInfoMenu.id = id;
		setTrackInfoMenuContent(id);
	}

	history.replaceState(null, '', `#${id}`);
	trackInfoMenu.classList.add('visible');
}

function hideTrackInfoMenu() {
	trackInfoMenu.classList.remove('visible');
	rawDataMenu.classList.remove('visible');
	history.replaceState(null, '', window.location.pathname + window.location.search);
}

function setTrackInfoMenuContent(id) {
	// clean
	infoMenu.style = '';

	// prepare
	const song = data.get(id);
	const background = song.art_full;

	// set
	if (background) {
		infoMenu.style.backgroundImage = `url("${background}")`;
	}
}

function setRawDataMenuContent(id) {
	const song = data.get(id);

	const raw = [];
	for (const [key, value] of Object.entries(song)) {
		const title = `<h3 class="raw-data-title">${key.replaceAll('_',' ')}</h3>`
		const text = `<p class="raw-data-text">${Array.isArray(value) ? value.join(', ') : isValidUrl(value) ? `<a target="_blank" href="${value}">${value}</a>` : value}</p>`
		const data = `<div class="raw-data-item">${title}${text}</div>`
		raw.push(data);
	}
	rawDataMenu.innerHTML = raw.join('\n');
}

function isValidUrl(string) {
	try {
		new URL(string);
		return true;
	} catch (err) {
		return false;
	}
}

function playSong(id) {
	const song = data.get(id);
	const src = song.file_art ?? song.file ?? song.file_library ?? '';
	let playerData = {};
	if (!window.playerAudio) {
		window.playerPrepare();
		window.playerNext = nextSong;
		window.playerPrevious = previousSong;
	}
	playerData.id = id;
	playerData.title = song.title ?? 'Unknown';
	playerData.artist = song.artists?.join(', ') ?? 'Unknown';
	playerData.art = song.art ?? song.art_high_res ?? '';
	playerData.song = src;
	playerData.time = 0;

	if (playerData.song) {
		sessionStorage.setItem('player-playing', true);
		localStorage.setItem('player', JSON.stringify(playerData));
	} else {
		localStorage.removeItem('player');
		sessionStorage.removeItem('player-playing');

		if (window.playerHide) {
			window.playerHide();
		}
	}
	window.playerAudio.pause();
	window.playerAudio.src = src;
	window.playerAudio.play().catch(() => { if (window.playerHide) window.playerHide(); });
}

function nextSong(currentId) {
	console.log(currentId)
	if (!currentId) return;

	const items = [...visibleSongListItems].filter(el =>
		el.classList?.contains('song-list-item')
	);

	if (items.length === 0) {
		playSong(currentId);
		return;
	}

	const currentIndex = items.findIndex(el => el.id === currentId);
	const nextIndex = currentIndex === -1 || currentIndex === items.length - 1 ? 0 : currentIndex + 1;

	const nextItem = items[nextIndex];
	playSong(nextItem.id);
}

function previousSong(currentId) {
	console.log(currentId)
	if (!currentId) return;

	const items = [...visibleSongListItems].filter(el =>
		el.classList?.contains('song-list-item')
	);

	if (items.length === 0) {
		playSong(currentId);
		return;
	}

	const currentIndex = items.findIndex(el => el.id === currentId);
	const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;

	const prevItem = items[prevIndex];
	playSong(prevItem.id);
}

if (window.playerAudio) {
	window.playerNext = nextSong;
	window.playerPrevious = previousSong;
}