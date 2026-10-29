import express from 'express';
import { app } from './backend/index.ts';

const server = express();
server.use(app);

export default server;
