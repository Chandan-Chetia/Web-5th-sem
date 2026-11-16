const modal = document.getElementById('order-modal');
const form = document.getElementById('order-form');
const message = document.getElementById('form-message');
const itemSelect = document.getElementById('item-select');

function openForm(item) {
  if (item) itemSelect.value = item;
  message.textContent = '';
  modal.hidden = false;
}
function closeForm() { modal.hidden = true; }

// "Order Now" button in the hero section
document.getElementById('open-order').addEventListener('click', () => openForm());

// "Order" buttons on each menu card (pre-selects that food)
document.querySelectorAll('.order-button').forEach(btn => {
  btn.addEventListener('click', () => openForm(btn.dataset.name));
});

document.getElementById('close-order').addEventListener('click', closeForm);
modal.addEventListener('click', e => { if (e.target === modal) closeForm(); });

// Send the form data to the server
form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    message.style.color = 'green';
    message.textContent = 'Order placed! Order ID: ' + result.id;
    form.reset();
    setTimeout(closeForm, 2000);
  } catch (err) {
    message.style.color = 'red';
    message.textContent = err.message || 'Something went wrong';
  }
});
