import api from './api';

// Central place to register API endpoints used by the web app
api.register('analyze', { path: '/analyze', method: 'POST' });

// Register additional endpoints here as needed

export default {};
