const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function setupStorage() {
  try {
    console.log('Setting up Supabase Storage via raw SQL...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('attachments', 'attachments', true)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log('Bucket created/updated.');
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Public Access for attachments" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Access for attachments" 
      ON storage.objects FOR ALL 
      USING (bucket_id = 'attachments')
      WITH CHECK (bucket_id = 'attachments');
    `);
    console.log('Policy created.');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
setupStorage();
