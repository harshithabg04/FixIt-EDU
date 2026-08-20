const complaintForm = document.getElementById('complaintForm');

complaintForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(complaintForm);

  try {
    const res = await fetch('http://localhost:5000/api/complaints', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      alert('✅ Complaint submitted successfully!');
      complaintForm.reset();
    } else {
      alert(`❌ Failed: ${data.message}`);
    }
  } catch (err) {
    alert('❌ Error submitting complaint');
    console.error(err);
  }
});
