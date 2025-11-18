async function fetchDashboardData() {

    const today = new Date().toISOString().slice(0, 10);
    const url = `${BASE_URL}/reports/dashboard?date=${today}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Lỗi HTTP! Status: ${response.status}`);
        }

        const result = await response.json();

        const data = result.data;
        console.log('Dữ liệu Dashboard:', data);

    } catch (error) {
        console.error("Lỗi tải Dashboard:", error);
    }
}

document.addEventListener('DOMContentLoaded', fetchDashboardData);
