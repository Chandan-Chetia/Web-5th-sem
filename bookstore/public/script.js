const modal = document.getElementById('order-modal');
const form = document.getElementById('order-form');
const message = document.getElementById('form-message');
const bookInput = document.getElementById('book-input');
const selectedBook = document.getElementById('selected-book');
const quantity = document.getElementById('quantity');
const total = document.getElementById('total');

let currentPrice = 0;

// Called by the "Buy Now" buttons in index.html
function buyBook(name, price) {
  currentPrice = price;
  bookInput.value = name;
  selectedBook.textContent = name + ' - ₹' + price;
  message.textContent = '';
  form.reset();
  updateTotal();
  modal.hidden = false;
}

function closeForm() {
  modal.hidden = true;
}

function updateTotal() {
  total.textContent = 'Total: ₹' + currentPrice * (Number(quantity.value) || 1);
}

quantity.addEventListener('input', updateTotal);
document.getElementById('close-order').addEventListener('click', closeForm);
modal.addEventListener('click', (e) => { if (e.target === modal) closeForm(); });

// Send the form data to the server
form.addEventListener('submit', async (e) => {
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
    message.textContent = 'Order placed! Order ID: ' + result.id + ' (Total ₹' + result.total + ')';
    setTimeout(closeForm, 2500);
  } catch (err) {
    message.style.color = 'red';
    message.textContent = err.message || 'Something went wrong';
  }
});
