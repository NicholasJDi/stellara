import searchSort from "./music.js";

const searchbar = document.querySelector('.searchbar');
const sort = document.querySelector('.sort');
const sortDropdown = document.querySelector('.sort-dropdown');

if (searchbar && sort && sortDropdown) {
	const queryParamName = 'q';
	const sortParamName = 'sort';

	const searchParams = new URLSearchParams(window.location.search);
	const queryParam = searchParams.get(queryParamName);
	const sortParam = searchParams.get(sortParamName);
	
	const search = debounce(searchSort, 300);

	let searchQuery = queryParam;
	let sortMode = sortParam;

	if (!searchQuery) searchQuery = "";
	if (!sortMode) sortMode = "";
	else {
		sortDropdown.querySelector(`#${CSS.escape(sortMode)}`)?.classList.add('selected')
	}
	searchbar.value = searchQuery;
	searchSort(searchQuery, sortMode);

	searchbar.addEventListener("input", (event) => {
		searchQuery = event.target.value;
		search(searchQuery, sortMode);
	});

	searchbar.addEventListener("change", (event) => {
		const value = event.target.value.trim();
		const url = new URL(window.location.href);
		if (value) {
			url.searchParams.set(queryParamName, value);
		} else {
			url.searchParams.delete(queryParamName);
		}
		window.history.pushState({}, '', url);
	});

	sortDropdown.addEventListener("click", (event) => {
		if (!sortDropdown.contains(event.target)) return;
		const id = event.target.id;
		
		if (id) {
			sortMode = id;
			sortDropdown.querySelectorAll('.sort-dropdown-item.selected').forEach((sortItem) => {
				sortItem.classList.remove('selected');
			});
			event.target.classList.add('selected');

			search(searchQuery, sortMode);
			
			const url = new URL(window.location.href);
			url.searchParams.set(sortParamName, sortMode);
			window.history.pushState({}, '', url);
		}
	});

	sort.addEventListener("click", () => {
		sortDropdown.classList.toggle('open');
	});

	document.addEventListener("click", (event) => {
		if (!sortDropdown.classList.contains('open')) return;

		if (!sortDropdown.parentElement.contains(event.target) || event.target === searchbar) {
			sortDropdown.classList.remove('open');
		}
	});
}

function debounce(func, delay) {
	let timeoutId;
	return function(...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			func.apply(this, args);
		}, delay);
	};
}