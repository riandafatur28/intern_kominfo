import axios from 'axios';

/**
 * Fetch the current authenticated user's profile (with team + field).
 */
export async function getProfile() {
    const res = await axios.get('/api/profile');
    return res.data.data;
}

/**
 * Update editable profile fields.
 * @param {Object} payload - { phone, position, rank }
 */
export async function updateProfile(payload) {
    const res = await axios.put('/api/profile', payload);
    return res.data;
}

/**
 * Change the current user's password.
 * @param {Object} payload - { current_password, password, password_confirmation }
 */
export async function changePassword(payload) {
    const res = await axios.post('/api/profile/password', payload);
    return res.data;
}
