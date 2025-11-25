const API_BASE = 'http://localhost:3000/api/v1';
let charts = {};

// Hiển thị lỗi
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '❌ ' + message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Format tiền tệ (Tiếng Việt, VND)
function formatCurrency(value) {
    const numValue = Number(value);
    if (isNaN(numValue)) return '-'; 
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(numValue);
}

// Tải dữ liệu tổng quan (Giống Dashboard)
async function loadDashboard() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`${API_BASE}/reports/dashboard?date=${today}`);
        if (!res.ok) throw new Error('Không thể tải dữ liệu tổng quan');
        const data = await res.json();
            
        document.getElementById('revenue').textContent = formatCurrency(data.revenue);
        document.getElementById('newCustomers').textContent = data.newCustomers || 0;
        document.getElementById('activeComputers').textContent = data.activeComputers || 0;
        document.getElementById('pendingOrders').textContent = data.pendingOrders || 0;
    } catch (error) {
        showError(error.message);
    }
}

// Tải doanh thu theo ngày (Biểu đồ Line)
async function loadRevenueDaily() {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const from = document.getElementById('dateFrom').value || thirtyDaysAgo.toISOString().split('T')[0];
        const to = document.getElementById('dateTo').value || today.toISOString().split('T')[0];
            
        const res = await fetch(`${API_BASE}/reports/revenue/daily?from=${from}&to=${to}`);
        if (!res.ok) throw new Error('Không thể tải doanh thu theo ngày');
        const data = await res.json();
            
        if (charts.revenueDaily) charts.revenueDaily.destroy();
        const ctx = document.getElementById('revenueDaily').getContext('2d');
        charts.revenueDaily = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Doanh Thu (VND)',
                    data: data.datasets?.[0]?.data || [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return formatCurrency(value); }
                        }
                    }
                }
            }
        });
    } catch (error) {
        showError(error.message);
    }
}

// Tải doanh thu theo tháng (Biểu đồ Bar)
async function loadRevenueMonthly() {
    try {
        const res = await fetch(`${API_BASE}/reports/revenue/monthly`);
        if (!res.ok) throw new Error('Không thể tải doanh thu theo tháng');
        const data = await res.json();
            
        if (charts.revenueMonthly) charts.revenueMonthly.destroy();
        const ctx = document.getElementById('revenueMonthly').getContext('2d');
        charts.revenueMonthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Doanh Thu (VND)',
                    data: data.datasets?.[0]?.data || [],
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return formatCurrency(value); }
                        }
                    } 
                }
            }
        });
    } catch (error) {
        showError(error.message);
    }
}

// Tải sử dụng máy tính (Biểu đồ Doughnut)
async function loadComputerUsage() {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const from = document.getElementById('dateFrom').value || thirtyDaysAgo.toISOString().split('T')[0];
        const to = document.getElementById('dateTo').value || today.toISOString().split('T')[0];
            
        const res = await fetch(`${API_BASE}/reports/computers/usage?from=${from}&to=${to}&limit=10`);
        if (!res.ok) throw new Error('Không thể tải sử dụng máy tính');
        const data = await res.json();
            
        if (charts.computerUsage) charts.computerUsage.destroy();
        const ctx = document.getElementById('computerUsage').getContext('2d');
        charts.computerUsage = new Chart(ctx, {
            type: 'doughnut',
            data: {
                // Hiển thị tổng số giờ trong nhãn
                labels: data.data?.map(d => `Máy ${d.name} (${(d.totalMinutes/60).toFixed(1)}h)`) || [],
                datasets: [{
                    data: data.data?.map(d => d.totalMinutes) || [],
                    backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30b0fe', '#5eead4', '#f87171']
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const totalMinutes = context.parsed;
                                const totalHours = (totalMinutes / 60).toFixed(2);
                                return ` ${context.label.split('(')[0].trim()}: ${totalMinutes} phút (${totalHours} giờ)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        showError(error.message);
    }
}

// Tải trạng thái máy tính (Biểu đồ Pie)
async function loadComputerStatus() {
    try {
        const res = await fetch(`${API_BASE}/reports/computers/status`);
        if (!res.ok) throw new Error('Không thể tải trạng thái máy tính');
        const data = await res.json();
            
        // Cập nhật thẻ thống kê số
        document.getElementById('statusAvailable').textContent = data.available || 0;
        document.getElementById('statusInUse').textContent = data.inUse || 0;
        document.getElementById('statusMaintenance').textContent = data.maintenance || 0;
            
        // Vẽ biểu đồ Pie
        if (charts.statusChart) charts.statusChart.destroy();
        const ctx = document.getElementById('statusChart').getContext('2d');
        charts.statusChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Có Sẵn', 'Đang Sử Dụng', 'Bảo Trì'],
                datasets: [{
                    data: [data.available, data.inUse, data.maintenance],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b']
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false 
            }
        });
    } catch (error) {
        showError(error.message);
    }
}

// Tải sản phẩm bán chạy (Bảng)
async function loadTopProducts() {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const from = document.getElementById('dateFrom').value || thirtyDaysAgo.toISOString().split('T')[0];
        const to = document.getElementById('dateTo').value || today.toISOString().split('T')[0];
            
        const res = await fetch(`${API_BASE}/reports/products/selling?from=${from}&to=${to}&limit=10`);
        if (!res.ok) throw new Error('Không thể tải sản phẩm bán chạy');
        const data = await res.json();
            
        const tbody = document.getElementById('topProducts');
        tbody.innerHTML = data.data?.map(p => `
            <tr>
                <td>${p.name || 'N/A'}</td>
                <td>${p.qtySold || 0}</td>
                <td>${formatCurrency(p.revenue || 0)}</td>
            </tr>
        `).join('') || '<tr><td colspan="3">Không có dữ liệu</td></tr>';
    } catch (error) {
        showError(error.message);
    }
}

// Tải top khách hàng (Bảng)
async function loadTopCustomers() {
    try {
        const res = await fetch(`${API_BASE}/reports/customers/top-balance?limit=10`);
        if (!res.ok) throw new Error('Không thể tải top khách hàng');
        const data = await res.json();
            
        const tbody = document.getElementById('topCustomers');
        tbody.innerHTML = data.data?.map(c => `
            <tr>
                <td>${c.name || 'Khách ẩn danh'}</td>
                <td>${formatCurrency(c.balance || 0)}</td>
            </tr>
        `).join('') || '<tr><td colspan="2">Không có dữ liệu</td></tr>';
    } catch (error) {
        showError(error.message);
    }
}

// Tải cảnh báo tồn kho (Bảng)
async function loadInventory() {
    try {
        const res = await fetch(`${API_BASE}/reports/inventory/alert?threshold=10`);
        if (!res.ok) throw new Error('Không thể tải cảnh báo tồn kho');
        const data = await res.json();
            
        const tbody = document.getElementById('inventory');
        tbody.innerHTML = data.data?.map(i => `
            <tr>
                <td>${i.name || 'N/A'}</td>
                <td><span class="badge ${i.quantity <= i.threshold ? 'badge-danger' : 'badge-warning'}">${i.quantity || 0}</span></td>
                <td>${i.threshold || 10}</td>
            </tr>
        `).join('') || '<tr><td colspan="3">Không có cảnh báo</td></tr>';
    } catch (error) {
        showError(error.message);
    }
}

// Tải tất cả dữ liệu
async function loadData() {
    // Đặt lại trạng thái loading
    document.getElementById('revenue').textContent = '...';
    document.getElementById('newCustomers').textContent = '...';
    document.getElementById('activeComputers').textContent = '...';
    document.getElementById('pendingOrders').textContent = '...';
    document.getElementById('statusAvailable').textContent = '...';
    document.getElementById('statusInUse').textContent = '...';
    document.getElementById('statusMaintenance').textContent = '...';
    document.getElementById('topProducts').innerHTML = '<tr><td colspan="3" class="loading">Đang tải dữ liệu...</td></tr>';
    document.getElementById('topCustomers').innerHTML = '<tr><td colspan="2" class="loading">Đang tải dữ liệu...</td></tr>';
    document.getElementById('inventory').innerHTML = '<tr><td colspan="3" class="loading">Đang tải dữ liệu...</td></tr>';
    
    // Tải dữ liệu
    await Promise.all([
        loadDashboard(),
        loadRevenueDaily(),
        loadRevenueMonthly(),
        loadComputerUsage(),
        loadComputerStatus(),
        loadTopProducts(),
        loadTopCustomers(),
        loadInventory()
    ]);
}

// Tải dữ liệu khi trang load
document.addEventListener('DOMContentLoaded', loadData);