import api from './api';

// Central place to register API endpoints used by the web app
api.register('analyze', { path: '/analyze', method: 'POST' });

// Auth endpoints
api.register('authRegister', { path: '/auth/register', method: 'POST' });
api.register('authSignin', { path: '/auth/signin', method: 'POST' });

// Register additional endpoints here as needed

export default {};
