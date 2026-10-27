import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });
await import('../server.ts');
