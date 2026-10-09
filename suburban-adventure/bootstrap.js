try {
    await import('./main.js');
} catch (error) {
    console.error('Neighborhood startup failed:', error);
    const startup = document.getElementById('startup');
    const message = document.getElementById('startup-message');
    message.textContent = 'The neighborhood could not load. Try loading a fresh copy.';
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Error details';
    const description = document.createElement('p');
    description.textContent = error?.message || String(error);
    details.append(summary, description);
    startup.append(details);
    const retry = document.createElement('button');
    retry.textContent = 'Load a fresh copy';
    retry.onclick = () => {
        const url = new URL(location.href);
        url.searchParams.set('reload', String(Date.now()));
        location.replace(url.href);
    };
    startup.append(retry);
}
