// 🔐 Redirect to login if token is missing
const token = localStorage.getItem('adminToken');
if (!token) {
  window.location.href = 'admin-login.html';
}

const complaintList = document.getElementById('complaintList');

// 📥 Load all complaints (authorized)
async function loadComplaints() {
  try {
    const res = await fetch('http://localhost:5000/api/complaints', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('Unauthorized or Failed to Fetch');
    }

    const complaints = await res.json();

    complaintList.innerHTML = complaints.map((c) => `
      <div class="card">
        <h3>${c.title}</h3>
        <p><strong>By:</strong> ${c.userName} (${c.userEmail})</p>
        <p><strong>Location:</strong> ${c.location}</p>
        <p><strong>Description:</strong> ${c.description}</p>
        ${c.photoUrl ? `<img src="${c.photoUrl}" alt="photo" style="max-width: 100%; height: auto;">` : ''}
        <p><strong>Status:</strong> <span class="status">${c.status}</span></p><p><strong>Status:</strong> <span class="status" style="color: ${
  c.status === 'Resolved' ? 'green' :
  c.status === 'In Progress' ? '#ffc107' :
  'red'
}">${c.status}</span></p>


        <label>Update Status: </label>
        <select onchange="updateStatus('${c._id}', this.value)">
          <option value="">--Select--</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>
    `).join('');
  } catch (err) {
    complaintList.innerHTML = "<p>⚠️ Failed to load complaints. Please login again.</p>";
    console.error(err);
    localStorage.removeItem('adminToken');
    window.location.href = 'admin-login.html';
  }
}

// 🔄 Update complaint status
async function updateStatus(id, newStatus) {
  try {
    const res = await fetch(`http://localhost:5000/api/complaints/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      loadComplaints(); // Refresh the list
    } else {
      alert('❌ Failed to update status');
    }
  } catch (err) {
    alert('❌ Server error while updating status');
    console.error(err);
  }
}

// 🚪 Logout function
function logout() {
  localStorage.removeItem('adminToken');
  window.location.href = 'admin-login.html';
}

// 🏁 Initial call
loadComplaints();
