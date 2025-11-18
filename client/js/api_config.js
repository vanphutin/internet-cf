const BASE_URL = 'http://localhost:3000/api/v1';

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function getAuthHeaders(requiresAuth = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (requiresAuth) {
        const token = getAuthToken();
        if (!token) {
            console.error('Lỗi: Cần Token xác thực cho API này.');
            return headers;
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}
