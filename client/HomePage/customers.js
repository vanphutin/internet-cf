// customers.js

const API_URL = 'http://localhost:3000/api/v1/customers';
const token = localStorage.getItem('token'); 

function showToast(msg, isSuccess = true) {
    console.log(isSuccess ? 'Success:' : 'Error:', msg);
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 18px;border-radius:4px;z-index:9999;font-weight:bold;';
    
    if (isSuccess) {
        box.style.backgroundColor = '#4CAF50';
        box.style.color = 'white';
    } else {
        box.style.backgroundColor = '#f44336';
        box.style.color = '#fff';
    }
    
    box.textContent = msg;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
}

async function loadCustomers() {
    const tbody = document.getElementById('customerTableBody');
    tbody.innerHTML = '<tr><td colspan="7">Đang tải...</td></tr>';

    try {
        const username = document.getElementById('searchUsername').value.trim();
        const phone = document.getElementById('searchPhone').value.trim();

        const url = new URL(API_URL);
        if (username) url.searchParams.set('username', username);
        if (phone) url.searchParams.set('phone', phone);
        
        const res = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        
        if (!res.ok || !json.success) throw new Error(json.message || `Lỗi tải dữ liệu: HTTP Status ${res.status}`);
        
        renderTable(json.data);

    } catch (e) { 
        tbody.innerHTML = `<tr><td colspan="7" class="error">Lỗi tải dữ liệu: ${e.message}</td></tr>`;
        showToast(e.message, false);
    }
}

/**
 * ĐÃ SỬA: Đổi customer.id thành customer.customer_id để khớp với Database
 */
function renderTable(customers) {
    const tbody = document.getElementById('customerTableBody');
    if (!customers || customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Không tìm thấy khách hàng nào.</td></tr>';
        return;
    }

    window.handleEdit = handleEdit;
    window.handleDelete = handleDelete;
    window.handleTopup = handleTopup;

    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.customer_id}</td>
            <td>${customer.name}</td>
            <td>${customer.username}</td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.email || '-'}</td>
            <td>${(customer.balance || 0).toLocaleString('vi-VN')}</td>
            <td class="action-cell">
                <button class="btn-topup" onclick="handleTopup(${customer.customer_id}, '${customer.username}')">💰 Nạp</button>
                <button class="btn-edit" onclick="handleEdit(${customer.customer_id})">✏️ Sửa</button>
                <button class="btn-delete" onclick="handleDelete(${customer.customer_id}, '${customer.name}')">🗑️ Xóa</button>
            </td>
        </tr>
    `).join('');
}

window.openAddModal = async function() {
    const name = prompt("Nhập Tên:");
    const username = prompt("Nhập Username (bắt buộc):");
    const password = prompt("Nhập Password (bắt buộc):");
    const phone = prompt("Nhập Phone (tùy chọn):");
    const email = prompt("Nhập Email (tùy chọn):");

    if (!username || !password || !name) {
        return showToast('Tên, Username và Password là bắt buộc.', false);
    }
    
    const data = { name, username, password, phone, email };
    
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        
        if (!res.ok || !json.success) throw new Error(json.message || "Lỗi thêm khách hàng");
        
        showToast('Thêm khách hàng thành công!');
        loadCustomers();
    } catch (e) {
        showToast(e.message, false);
    }
}

async function handleTopup(id, username) {
    const amountStr = prompt(`Nạp tiền cho khách hàng ${username}. Nhập số tiền:`);
    const amount = Number(amountStr);
    
    if (isNaN(amount) || amount <= 0) {
        return showToast('Số tiền nạp không hợp lệ.', false);
    }

    if (!confirm(`Xác nhận nạp ${amount.toLocaleString('vi-VN')} VNĐ cho ${username}?`)) return;

    try {
        // Lưu ý: Đảm bảo backend có route PUT /api/v1/customers/topup/:id
        const res = await fetch(`${API_URL}/topup/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount })
        });
        const json = await res.json();
        
        if (!res.ok || !json.success) throw new Error(json.message || "Lỗi nạp tiền");
        
        showToast('Nạp tiền thành công!');
        loadCustomers();
    } catch (e) {
        showToast(e.message, false);
    }
}

async function handleEdit(id) {
    // Demo update name
    const newName = prompt("Nhập tên mới:");
    if(!newName) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: newName })
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Lỗi cập nhật");
        showToast('Cập nhật thành công!');
        loadCustomers();
    } catch(e) {
        showToast(e.message, false);
    }
}

async function handleDelete(id, name) {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name}" (ID: ${id})?`)) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        
        if (!res.ok || !json.success) throw new Error(json.message || "Lỗi xóa khách hàng");
        
        showToast('Đã xóa khách hàng thành công.');
        loadCustomers();
    } catch (e) {
        showToast(e.message, false);
    }
}

document.addEventListener('DOMContentLoaded', loadCustomers);