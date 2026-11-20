import { sortDataBySchemeMode, sortDataBySearchTags } from "./search-sort.js";

function debounce(func, delay) {
	let timeoutId;
	return function(...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(func.apply(this, args), delay);
	};
}

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

function isValidUrl(string) {
	try {
		new URL(string);
		return true;
	} catch (err) {
		return false;
	}
}

function getDateString(date) {
	if (!date) return;
	const nums = date.split('T')[0].split('-');
	if (nums.length != 3) return;
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const index = Number(nums[1]) - 1;
	return `${months[index]} ${nums[2]}, ${nums[0]}`;
}

function updateParam(param, value = null) {
	const url = new URL(window.location.href);
	if (url.searchParams.get(param) === value) return;

	if (value) {
		url.searchParams.set(param, value);
	} else {
		url.searchParams.delete(param);
	}
	window.history.replaceState({}, '', url);
}


const typeMap = {
	single: 'Single',
	remix: 'Remix',
	album: 'Album',
	ep: 'EP'
};

const searchbar = document.querySelector('.searchbar');
const sort = document.querySelector('.sort');
const sortDropdown = document.querySelector('.sort-dropdown');

const dropdown = document.querySelector('.dropdown');
const dropdownDownload = dropdown.querySelector('#download-with-art');
const dropdownDownloadNoArt = dropdown.querySelector('#download-no-art');
const dropdownDownloadLibrary = dropdown.querySelector('#download-library');
const dropdownDownloadArt = dropdown.querySelector('#download-art-high-res');
const dropdownOpenMenu = dropdown.querySelector('#open-menu');

const menu = document.querySelector('.menu');
const sizeMenuButton = menu.querySelector('.size-menu-button');
const dataMenuButton = menu.querySelector('.data-menu-button');
const infoMenuButton = menu.querySelector('.info-menu-button');
const infoMenu = menu.querySelector('.info-menu');
const dataMenu = menu.querySelector('.data-menu');

const songList = document.querySelector('.song-list');
const noResultsText = songList.querySelector('.no-results-text');

const searchScheme = await fetchJsonData("https://stellara.nicholasjdi.dev/data/music/search.json");
const sortScheme = await fetchJsonData("https://stellara.nicholasjdi.dev/data/music/sort.json");

const songListItems = new Map();
const visibleSongListItems = new Set();

const data = new Map();

let rawData = '';

let searchQuery = ''
let sortMode = ''


function loadData(d) {
	rawData = d;
	// reset stuff
	noResultsText.classList.remove('visible');
	songListItems.forEach(item => item.remove());
	visibleSongListItems.clear();
	songListItems.clear();
	data.clear();

	// create items
	const fragment = document.createDocumentFragment();
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
			<a class="cover-art link" target="_blank">
				<img class="cover-art image" onerror="this.style.visibility='hidden'">
			</a>
			<div class="content-box">
				<div class="details-box">
					<p class="title-text"></p>
					<p class="artist-text"></p>
				</div>
				<div class="right-box">
					<div class="info-box">
						<div class="date-box">
							<p class="date-text"></p>
						</div>
						<div class="type-box">
							<a class="url-modifier type-text"></a>
						</div>
					</div>
					<div class="dropdown-box">
						<a class="url-modifier play-button"><svg width="1.3em" height="1.3em" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12.322 7.576a.5.5 0 0 1 0 .848l-6.557 4.098A.5.5 0 0 1 5 12.098V3.902a.5.5 0 0 1 .765-.424z" fill="currentColor"/></svg> Play</a>
						<button class="dropdown-button">V</button>
					</div>
				</div>
			</div>
		`;

		// assign the items data
		songListItem.querySelector('.title-text').textContent = title;
		songListItem.querySelector('.artist-text').textContent = artists;
		songListItem.querySelector('.date-text').textContent = date;

		const typeText = songListItem.querySelector('.type-text');
		typeText.textContent = type;
		typeText.classList.add(type.toLowerCase());
		typeText.title = album;
		typeText.href = `?q=${encodeURIComponent(`type:${type} ${type === 'EP' || type === 'Album' ? 'album' : 'title'}:"${album}"`)}`;

		const playButton = songListItem.querySelector('.play-button');
		playButton.href = `?player=${encodeURIComponent(id)}`

		const link = songListItem.querySelector('.cover-art.link');
		link.href = art_high_res;

		const cover = songListItem.querySelector('.cover-art.image');
		cover.src = art;

		// add the item
		songListItems.set(id, songListItem);
		fragment.appendChild(songListItem);
	}
	songList.appendChild(fragment);
}

function updateList(ids) {
	// remove previous
	visibleSongListItems.forEach(item => item.classList.remove('visible'));
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

const search = debounce(() => {
	if (!sortMode || !Object.keys(sortScheme).includes(sortMode)) {
		sortMode = "default";
	}

	const sorted = sortDataBySchemeMode(rawData, sortScheme, sortMode);
	const data = sortDataBySearchTags(sorted, searchScheme, searchQuery);
	const ids = data.map(item => item.id).filter(Boolean);

	updateList(ids);
}, 300);

function syncWithURL() {
	const newSearchParams = new URLSearchParams(window.location.search);
	const newQueryParam = newSearchParams.get('q') || '';
	const newSortParam = newSearchParams.get('sort') || '';
	const newPlayerParam = newSearchParams.get('player') || '';

	let searchPls = false;
	if (newQueryParam !== searchQuery) {
		searchQuery = newQueryParam;
		searchbar.value = searchQuery;
		searchPls = true;
	}
	if (newSortParam !== sortMode) {
		sortMode = newSortParam;
		searchPls = true;
	}
	if (searchPls) {
		search();
	}
	if (newPlayerParam && newPlayerParam !== window.player.data.id) {
		playSong(newPlayerParam);
	}

	handleHash();
}


// url modifier
document.addEventListener("click", event => {
	const modifier = event.target.closest('.url-modifier');
	if (!modifier) return;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

	event.preventDefault();

	const href = modifier.getAttribute('href') || '';
	const url = new URL(window.location.href);
	const patch = new URL(href, window.location.href);

	if (href.includes("?")) {
		for (const [key, value] of patch.searchParams.entries()) {
			if (value === "") {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, value);
			}
		}
	}

	if (href.includes("#")) {
		url.hash = patch.hash;
	}

	window.history.replaceState({}, '', url);
	syncWithURL();
});

// search
searchbar.addEventListener("input", event => {
	searchQuery = event.target.value;
	search(searchQuery, sortMode);
});
searchbar.addEventListener("change", event => {
	const value = event.target.value.trim();
	updateParam('q', value)
});

// sort
sort.addEventListener("click", () => {
	sortDropdown.classList.toggle('open');
});
document.addEventListener("click", event => {
	if (!sortDropdown.classList.contains('open')) return;

	if (!sortDropdown.parentElement.contains(event.target) || event.target === searchbar) {
		sortDropdown.classList.remove('open');
	}
});

// dropdown
songList.addEventListener("click", event => {
	const button = event.target.closest('.dropdown-button');
	if (!button) return;

	const dropdownBox = button.closest('.dropdown-box');
	const songListItem = dropdownBox.closest('.song-list-item');

	if (!dropdownBox || !songListItem) return;

	const id = songListItem.id;
	const playButton = dropdownBox.querySelector('.play-button');
	const dropdownButton = dropdownBox.querySelector('.dropdown-button');

	const open = dropdown.classList.contains('open');
	dropdown.classList.remove('open');
	dropdown.parentElement.querySelector('.play-button').style.zIndex = '';
	dropdown.parentElement.querySelector('.dropdown-button').style.zIndex = '';
	if (dropdown.parentElement !== dropdownBox) {
		const song = data.get(id)
		const withArt = song.file_art;
		const noArt = song.file;
		const library = song.file_library;
		const art = song.art_high_res ?? song.art;

		dropdownOpenMenu.href = `#${encodeURIComponent(id)}`;

		if (!dropdownDownload.classList.toggle('hidden', !withArt)) {
			dropdownDownload.href = withArt;
		}

		if (!dropdownDownloadNoArt.classList.toggle('hidden', !noArt)) {
			dropdownDownloadNoArt.href = noArt;
		}

		if (!dropdownDownloadLibrary.classList.toggle('hidden', !library)) {
			dropdownDownloadLibrary.href = library;
		}

		if (!dropdownDownloadArt.classList.toggle('hidden', !art)) {
			dropdownDownloadArt.href = art;
		}
	} else if (open) return;
	dropdownBox.appendChild(dropdown);
	playButton.style.zIndex = 101;
	dropdownButton.style.zIndex = 101;
	dropdown.classList.add('open');
});
document.addEventListener("click", event => {
	if (!dropdown.classList.contains('open')) return;

	if (!dropdown.parentElement.contains(event.target)) {
		dropdown.classList.remove('open');
		dropdown.parentElement.querySelector('.play-button').style.zIndex = '';
		dropdown.parentElement.querySelector('.play-button').style.zIndex = '';
	}
});

// info menu
window.addEventListener('hashchange', event => {
	event.preventDefault()
	handleHash();
});
function handleHash() {
	const id = window.location.hash.slice(1);

	if (data.has(id)) {
		const songListItem = songListItems.get(id);
		if (songListItem?.classList.contains("visible")) {
			songListItem.scrollIntoView({
				behavior: 'smooth',
				block: 'center'
			});
		}

		if (id !== menu.id) {
			menu.id = id;

			// clean
			infoMenu.style = '';

			// prepare
			const song = data.get(id);
			const background = song.art_full;
			const links = song.links;

			// set
			if (background) {
				infoMenu.style.backgroundImage = `url("${background}")`;
			}
		}

		if (dropdown.classList.contains('open')) {
			dropdown.classList.remove('open');
			dropdown.parentElement.querySelector('.play-button').style.zIndex = '';
			dropdown.parentElement.querySelector('.play-button').style.zIndex = '';
		}
		menu.classList.add('visible');
	} else {
		menu.classList.remove('visible');
		dataMenu.classList.remove('visible');
	}
}
infoMenuButton.onpointerdown = () => {
	dataMenu.classList.remove('visible');
}

// data menu
dataMenuButton.onpointerdown = () => {
	if (dataMenu.id !== menu.id) {
		dataMenu.id = menu.id;
		dataMenu.innerHTML = '';
		dataMenu.appendChild(dataMenuElement(data.get(menu.id)));
	}
	dataMenu.classList.add('visible');
};
function dataMenuElement(d, title = false) {
	let element = null;
	if (typeof d === "object") {
		element = document.createDocumentFragment();
		if (Array.isArray(d)) {
			d.forEach(value => element.appendChild(dataMenuElement(value)));
		} else {
			for (const [key, value] of Object.entries(d)) {
				element.appendChild(dataMenuElement(key, true))
				element.appendChild(dataMenuElement(value))
			}
		}
		const space = document.createElement('hr');
		space.classList.add('data-space');
		element.appendChild(space);
	} else if (title) {
		element = document.createElement('h3');
		element.textContent = d.toString();
		element.classList.add('data-title');
	} else {
		if (isValidUrl(d)) {
			element = document.createElement('a');
			element.textContent = d;
			element.target = "_blank";
			element.href = d;
		} else {
			element = document.createElement('p');
			element.textContent = d.toString();
		}
		element.classList.add('data-text');
	}

	return element;
}

// menu full
sizeMenuButton.onpointerdown = () => menuFull();
function menuFull(full = undefined) {
	const isFull = menu.classList.toggle('full', full);
	sizeMenuButton.textContent = isFull ? '–' : '□';
	
	requestAnimationFrame(() => {
		menu.style.display = 'none';
		menu.offsetHeight; // force reflow
		menu.style.display = '';
	});

	localStorage.setItem('menu-full', isFull);
}


// loading
const searchParams = new URLSearchParams(window.location.search);
const queryParam = searchParams.get('q') || '';
const sortParam = searchParams.get('sort') || '';
const playerParam = searchParams.get('player') || '';
const dataParam = searchParams.get('data') || 'https://stellara.nicholasjdi.dev/data/music/data.json';

searchQuery = queryParam;
sortMode = sortParam;
loadData( await fetchJsonData( isValidUrl(dataParam) ? dataParam : `https://stellara.nicholasjdi.dev/data/music/data/${dataParam}.json`, []));
search();

menuFull(localStorage.getItem('menu-full') === 'true');
handleHash();


// player controls
if (!window.player) window.player = {};

function playSong(id) {
	if (!data.has(id)) return;
	const song = data.get(id);
	const src = song.file_art ?? song.file ?? song.file_library ?? '';
	let playerData = {};
	playerData.id = id;
	playerData.title = song.title ?? 'Unknown';
	playerData.artist = song.artists ?? 'Unknown';
	playerData.art = song.art ?? song.art_high_res ?? '';
	playerData.song = src;
	playerData.time = 0;
	sessionStorage.setItem('player-playing', true);
	window.player.data = playerData;
}

window.player.next = (currentId) => {
	const items = [...visibleSongListItems].filter(el =>
		el.classList?.contains('song-list-item')
	);

	const currentIndex = items.findIndex(el => el.id === currentId);
	const nextIndex = currentIndex === -1 || currentIndex === items.length - 1 ? 0 : currentIndex + 1;

	const id = items[nextIndex]?.id;
	if (!id) return {};

	updateParam("player", id);

	const song = data.get(id);
	const src = song.file_art ?? song.file ?? song.file_library ?? '';
	let playerData = {};
	playerData.id = id;
	playerData.title = song.title ?? 'Unknown';
	playerData.artist = song.artists ?? 'Unknown';
	playerData.art = song.art ?? song.art_high_res ?? '';
	playerData.song = src;
	playerData.time = 0;
	return playerData;
}

window.player.previous = (currentId) => {
	const items = [...visibleSongListItems].filter(el =>
		el.classList?.contains('song-list-item')
	);

	const currentIndex = items.findIndex(el => el.id === currentId);
	const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;

	const id = items[prevIndex]?.id;
	if (!id) return {};

	updateParam("player", id);

	const song = data.get(id);
	const src = song.file_art ?? song.file ?? song.file_library ?? '';
	let playerData = {};
	playerData.id = id;
	playerData.title = song.title ?? 'Unknown';
	playerData.artist = song.artists ?? 'Unknown';
	playerData.art = song.art ?? song.art_high_res ?? '';
	playerData.song = src;
	playerData.time = 0;
	return playerData;
}

if (playerParam !== window.player.data?.id) playSong(playerParam);