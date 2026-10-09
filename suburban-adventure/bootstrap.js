try {
    await import('./main.js');
} catch (error) {
    console.error(error);
    document.getElementById('startup-message').textContent = 'The neighborhood could not load. Check your connection and try again.';
    const retry = document.createElement('button');
    retry.textContent = 'Try again';
    retry.onclick = () => location.reload();
    document.getElementById('startup').append(retry);
}
