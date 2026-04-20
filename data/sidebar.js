const sidebar = document.querySelector('.sidebar');
if (sidebar) {
	const btn = document.querySelector('.sidebar-toggle');
	const searchParams = new URLSearchParams(window.location.search);
	const sidebarParam = searchParams.get('sidebar');
	let isOpen = true;

	// Prevent animation on initial load
	sidebar.classList.add('no-anim');
	if (!sidebarParam && (!sidebar.classList.contains('closed') && !sidebar.classList.contains('open'))) {
		// Restore saved state (if any)
		if (sessionStorage.getItem('sidebar-open') !== 'false') {
			sidebar.classList.add('open');
		} else {
			sidebar.classList.remove('open');
		}
	} else if ((sidebarParam === 'open' && !sidebar.classList.contains('closed')) || sidebar.classList.contains('open')) {
		sidebar.classList.remove('open');
		// Force the sidebar to be open
		if (document.documentElement.clientWidth > 800) {
			sidebar.classList.add('open');
		} else {
			sidebar.classList.remove('open');
		}
	} else {
		sidebar.classList.remove('closed');
		// Force the sidebar to be closed
		if (document.documentElement.clientWidth > 800) {
			sidebar.classList.remove('open');
		} else {
			sidebar.classList.add('open');
		}
	}

	// Save initial state
	isOpen = sidebar.classList.contains('open');
	sessionStorage.setItem('sidebar-open', isOpen ? 'true' : 'false');

	// Allow animations after initial state is applied
	setTimeout(() => { sidebar.classList.remove('no-anim'); }, 1000);

	if (btn) {
		// Toggle sidebar on button click and save state
		btn.addEventListener('click', ()=>{
			isOpen = sidebar.classList.toggle('open');
			sidebar.classList.remove('no-anim');
			sessionStorage.setItem('sidebar-open', isOpen ? 'true' : 'false');
		});
	}
}