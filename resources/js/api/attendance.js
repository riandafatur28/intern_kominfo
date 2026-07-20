import axios from 'axios';

/**
 * Submit a WFH attendance check-in for a session.
 *
 * Backend contract (POST /api/wfh/attendance):
 * - photo:   required image (jpg/jpeg/png, max 2MB)
 * - session: optional, one of 'pagi' | 'sore' (default 'pagi')
 * - date:    optional, must be today; WFH only allowed on configured days (default Friday)
 *
 * @param {Object} args - { photo: File, session?: 'pagi'|'sore', date?: 'YYYY-MM-DD' }
 */
export async function checkIn({ photo, session, date }) {
    const fd = new FormData();
    fd.append('photo', photo);
    if (session) fd.append('session', session);
    if (date) fd.append('date', date);

    const res = await axios.post('/api/wfh/attendance', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}
