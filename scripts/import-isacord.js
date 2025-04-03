import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

const prisma = new PrismaClient();

async function importIsacordNumbers() {
  try {
    // First, get all existing embroidery thread IDs
    const existingThreads = await prisma.embroideryThread.findMany({
      select: { id: true }
    });
    const validThreadIds = new Set(existingThreads.map(t => t.id));
    
    // Read and parse CSV
    const fileContent = fs.readFileSync('/Users/leilanigreer/Downloads/IsacordNumber2.csv', 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Validate non-empty threadIds in CSV
    const invalidThreads = records.filter(r => r.threadId && !validThreadIds.has(r.threadId));
    if (invalidThreads.length > 0) {
      console.error(`Found ${invalidThreads.length} invalid threadIds`);
      invalidThreads.forEach(r => {
        console.error(`Invalid thread: Number=${r.number}, ThreadId=${r.threadId}`);
      });
      return;
    }

    // Delete existing records
    await prisma.isacordNumber.deleteMany();

    // Import new records
    let created = 0;
    let withThread = 0;
    let withoutThread = 0;

    for (const record of records) {
      const isacordNumber = await prisma.isacordNumber.create({
        data: {
          number: record.number,
          threadId: record.threadId || null,
          description: record.description || null
        }
      });

      created++;
      if (isacordNumber.threadId) {
        withThread++;
      } else {
        withoutThread++;
      }
    }

    console.log(`Import completed: ${created} records (${withThread} with thread, ${withoutThread} without)`);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importIsacordNumbers();