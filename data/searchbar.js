import searchSort from "./music.js";

const searchbar = document.querySelector('.searchbar');

if (searchbar) {
	const queryParamName = 'q';
	const searchParams = new URLSearchParams(window.location.search);
	const queryParam = searchParams.get(queryParamName);
	const search = debounce(searchSort, 300);

	let searchQuery = queryParam;
	const sortMode = "default";
	const reverse = false;

	if (!searchQuery) searchQuery = "";

	searchbar.value = searchQuery;
	searchSort(searchQuery, sortMode, reverse);

	searchbar.addEventListener("input", (event) => {
		search(event.target.value, sortMode, reverse);
	});

	searchbar.addEventListener("change", function(event) {
		const value = event.target.value.trim();
		const url = new URL(window.location.href);
		if (value) {
			url.searchParams.set(queryParamName, value);
		} else {
			url.searchParams.delete(queryParamName);
		}
		window.history.pushState({}, '', url);
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