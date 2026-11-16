const form = document.getElementById('register-form');
const message = document.getElementById('form-message');

// Send the form data to the server
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    message.style.color = 'green';
    message.textContent = 'Registration successful! Your ID: ' + result.id;
    form.reset();
  } catch (err) {
    message.style.color = 'red';
    message.textContent = err.message || 'Something went wrong';
  }
});
