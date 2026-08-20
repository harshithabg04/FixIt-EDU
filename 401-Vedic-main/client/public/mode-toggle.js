document.addEventListener('DOMContentLoaded', () => {
  const modeToggleBtn = document.getElementById('modeToggle');
  const body = document.body;

  // On load, apply saved mode from localStorage
  const savedMode = localStorage.getItem('mode');
  if (savedMode === 'dark') {
    body.classList.add('dark-mode');
    modeToggleBtn.textContent = '☀️';
  } else {
    body.classList.remove('dark-mode');
    modeToggleBtn.textContent = '🌙';
  }

  modeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
      modeToggleBtn.textContent = '☀️';
      localStorage.setItem('mode', 'dark');
    } else {
      modeToggleBtn.textContent = '🌙';
      localStorage.setItem('mode', 'light');
    }
  });
});
