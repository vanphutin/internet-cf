const tableBody = document.querySelector('.customer-table tbody');

async function fetchComputers() {
    const url = `${BASE_URL}/computers?limit=50`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (response.ok && result.success) {
            renderTable(result.data);
        } else {
            throw new Error(result.message || 'Lỗi tải danh sách.');
        }

    } catch (error) {
        console.error("Error fetching computers:", error);
    }
}


async function createComputer() {

    const computerData = {
        name: document.getElementById("computerName").value,
        room: document.getElementById("room").value,
        note: document.getElementById("note").value
    };

    const url = `${BASE_URL}/computers`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: JSON.stringify(computerData)
        });

        const result = await response.json();

        if (response.status === 201 && result.success) {
            alert(`Tạo máy tính thành công! ID: ${result.insertId}`);
            fetchComputers();
            clearForm();
        } else {
            alert(result.message || "Lỗi thêm máy.");
        }
    } catch (error) {
        console.error("Error creating computer:", error);
    }
}


async function updateComputer() {

    const id = document.getElementById("computerId").value;

    if (!id) {
        alert("Hãy chọn 1 máy từ bảng để cập nhật!");
        return;
    }

    const computerData = {
        name: document.getElementById("computerName").value,
        room: document.getElementById("room").value,
        note: document.getElementById("note").value
    };

    const url = `${BASE_URL}/computers/${id}`;

    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: getAuthHeaders(true),
            body: JSON.stringify(computerData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert("Cập nhật thành công!");
            fetchComputers();
            clearForm();
        } else {
            alert(result.message || "Lỗi cập nhật.");
        }

    } catch (error) {
        console.error("Error updating computer:", error);
    }
}


async function deleteComputer(id) {
    if (!confirm(`Xác nhận xóa máy ID ${id}?`)) return;

    const url = `${BASE_URL}/computers/${id}`;

    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders(true)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(`Đã xóa thành công!`);
            fetchComputers();
            clearForm();
        } else {
            alert(result.message || "Lỗi xóa máy.");
        }

    } catch (error) {
        console.error("Error deleting computer:", error);
    }
}


function renderTable(computers) {
    tableBody.innerHTML = '';

    computers.forEach(computer => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${computer.id}</td>
            <td>${computer.name}</td>
            <td>${computer.room}</td>
            <td>${computer.note || ''}</td>
            <td>
                <span class="delete-icon" 
                      data-id="${computer.id}" 
                      style="cursor:pointer; color:red;">
                    🗑️
                </span>
            </td>
        `;

        row.addEventListener("click", () => {
            document.getElementById("computerId").value = computer.id;
            document.getElementById("computerName").value = computer.name;
            document.getElementById("room").value = computer.room;
            document.getElementById("note").value = computer.note || '';
        });

        tableBody.appendChild(row);
    });
}


function clearForm() {
    document.getElementById("computerId").value = "";
    document.getElementById("computerName").value = "";
    document.getElementById("room").value = "";
    document.getElementById("note").value = "";
}


document.addEventListener('DOMContentLoaded', () => {
    fetchComputers();

    
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('delete-icon')) {
            deleteComputer(target.dataset.id);
        }
    });

    ``
    document.getElementById("btnAdd").addEventListener("click", createComputer);
    document.getElementById("btnUpdate").addEventListener("click", updateComputer);
    document.getElementById("btnRefresh").addEventListener("click", clearForm);
});
