// employee.js


async function fetchComplaints(domain, token) {
  try {
    const response = await fetch(`/api/complaints?domain=${encodeURIComponent(domain)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch complaints');

    const complaints = await response.json();
    renderComplaints(complaints);
  } catch (error) {
    console.error(error);
  }
}

function renderComplaints(complaints) {
  const container = document.getElementById('complaintsContainer');
  container.innerHTML = '';
  complaints.forEach(c => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h4>${c.title}</h4>
      <p>${c.description}</p>
      <p>Status: ${c.status}</p>
      <button onclick="updateStatus('${c._id}', 'Resolved')">Mark Resolved</button>
    `;
    container.appendChild(div);
  });
}

async function updateStatus(complaintId, newStatus) {
  const token = localStorage.getItem('employeeToken');
  try {
    const response = await fetch(`/api/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (response.ok) {
      alert('Status updated');
      // Refresh complaints
      fetchComplaints(/* domain */ token);
    } else {
      alert('Failed to update status');
    }
  } catch (err) {
    console.error(err);
  }
}
