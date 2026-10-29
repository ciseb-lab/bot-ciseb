import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });
const { startServer } = await import('./index.ts');
await startServer();
