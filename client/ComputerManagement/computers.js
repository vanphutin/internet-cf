const API = 'http://localhost:3000/api/v1/computers';
const token = localStorage.getItem('token'); 

window.addEventListener('DOMContentLoaded', loadComputers);

// -------------------- TOAST --------------------
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
}

// -------------------- LOAD MÁY --------------------
async function loadComputers() {
    const grid = document.getElementById('computerGrid');
    grid.innerHTML = '<p class="loading">Đang tải…</p>';
    clearForm();

    try {
        const q = document.getElementById('search').value.trim();
        const url = new URL(API);
        if (q) url.searchParams.set('q', q);

        const res = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();

        if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`);

        renderGrid(json.data);
    } catch(e) {
        grid.innerHTML = `<p class="text-red-500">Lỗi: ${e.message}</p>`;
        showToast(e.message);
    }
}

// -------------------- RENDER GRID --------------------
function renderGrid(list) {
    const grid = document.getElementById('computerGrid');
    if (!list || !list.length) { grid.innerHTML = '<p>Không có máy nào.</p>'; return; }

    window.selectCard = selectCard;

    grid.innerHTML = list.map((pc, i) => `
        <div class="pc-card fade-in" style="animation-delay:${i*0.05}s" 
             onclick="selectCard(this, ${pc.computer_id}, '${pc.name}', '${pc.ip_address}', '${pc.location}', '${pc.status}')">
            <h4 class="text-lg font-semibold mb-1">${pc.name}</h4>
            <div class="text-sm text-gray-500">${pc.ip_address}</div>
            <div class="text-sm text-gray-500">${pc.location || '-'}</div>
            <span class="inline-block mt-2 px-3 py-1 rounded-full text-white text-xs
                ${pc.status==='available'?'bg-green-500':''}
                ${pc.status==='in_use'?'bg-blue-500':''}
                ${pc.status==='maintenance'?'bg-yellow-500':''}">
                ${pc.status}
            </span>
        </div>
    `).join('');
}

// -------------------- CHỌN MÁY --------------------
function selectCard(element, id, name, ip, loc, st) {
    document.querySelectorAll('.pc-card').forEach(c => c.classList.remove('border-2','border-primary'));
    element.classList.add('border-2','border-primary');
    document.getElementById('computerIdHidden').value = id;
    document.getElementById('pcName').value = name;
    document.getElementById('pcIP').value = ip;
    document.getElementById('pcLocation').value = loc;
    document.getElementById('pcStatus').value = st;
}

// -------------------- FORM DATA --------------------
function getFormData() {
    return {
        name: document.getElementById('pcName').value.trim(),
        ip_address: document.getElementById('pcIP').value.trim(),
        location: document.getElementById('pcLocation').value.trim(),
        status: document.getElementById('pcStatus').value
    };
}

// -------------------- CRUD --------------------
window.addComputer = async function() {
    const body = getFormData();
    if (!body.name || !body.ip_address) return showToast('Tên và IP không được để trống');

    try {
        const res = await fetch(API, {
            method:'POST',
            headers:{ 'Content-Type':'application/json','Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message);
        showToast('Thêm máy thành công!');
        loadComputers();
    } catch(e){ showToast(e.message); }
}

window.updateComputer = async function() {
    const id = document.getElementById('computerIdHidden').value;
    if (!id) return showToast('Chưa chọn máy để sửa');

    const body = getFormData();
    try {
        const res = await fetch(`${API}/${id}`, {
            method:'PUT',
            headers:{ 'Content-Type':'application/json','Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message);
        showToast('Cập nhật thành công!');
        loadComputers();
    } catch(e){ showToast(e.message); }
}

window.deleteComputer = async function() {
    const id = document.getElementById('computerIdHidden').value;
    if (!id) return showToast('Chưa chọn máy để xóa');
    if(!confirm('Bạn có chắc chắn muốn xóa máy này?')) return;

    try {
        const res = await fetch(`${API}/${id}`, {
            method:'DELETE',
            headers:{ 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message);
        showToast('Đã xóa máy thành công!');
        loadComputers();
        clearForm();
    } catch(e){ showToast(e.message); }
}

window.clearForm = function() {
    document.getElementById('computerIdHidden').value = '';
    ['pcName','pcIP','pcLocation','pcStatus'].forEach(id => {
        document.getElementById(id).value = id==='pcStatus'?'available':'';
    });
    document.querySelectorAll('.pc-card').forEach(c => c.classList.remove('border-2','border-primary'));
}
