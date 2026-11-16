const form = document.getElementById('registration-form');
const message = document.getElementById('form-message');
const dobInput = document.getElementById('dob');

// Prevent selecting a future date of birth.
dobInput.max = new Date().toISOString().split('T')[0];

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const student = {
    fullName: formData.get('fullName').trim(),
    fatherName: formData.get('fatherName').trim(),
    dateOfBirth: formData.get('dob'),
    email: formData.get('email').trim(),
    phone: formData.get('phone').trim(),
    gender: formData.get('gender'),
    course: formData.get('course'),
    address: formData.get('address').trim(),
    hobbies: formData.getAll('hobbies')
  };

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  message.textContent = 'Saving registration...';
  message.className = 'form-message';

  try {
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to save registration.');
    }

    message.textContent = `${result.message} Thank you, ${student.fullName}.`;
    message.className = 'form-message success';
  } catch (error) {
    message.textContent = error.message || 'Unable to save registration.';
    message.className = 'form-message error';
  } finally {
    submitButton.disabled = false;
  }
});

form.addEventListener('reset', () => {
  message.textContent = '';
  message.className = 'form-message';
});
