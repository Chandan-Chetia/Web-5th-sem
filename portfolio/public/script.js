// Keep the copyright year current.
document.getElementById('year').textContent = new Date().getFullYear();

// Highlight the navigation link for the section currently in view.
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-inner a');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${entry.target.id}`;
      link.classList.toggle('active', isActive);
    });
  });
}, { rootMargin: '-25% 0px -65% 0px' });

sections.forEach((section) => observer.observe(section));

// ---- Contact form: send the data to the server ----
const form = document.getElementById('contact-form');
const message = document.getElementById('form-message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    message.style.color = 'green';
    message.textContent = 'Thank you! Your message has been sent.';
    form.reset();
  } catch (err) {
    message.style.color = 'red';
    message.textContent = err.message || 'Something went wrong';
  }
});
