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
    
    console.log(`Found ${validThreadIds.size} existing embroidery threads`);

    // Read and parse CSV
    const fileContent = fs.readFileSync('/Users/leilanigreer/Downloads/IsacordNumber2.csv', 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Validate non-empty threadIds in CSV
    const invalidThreads = records.filter(r => r.threadId && !validThreadIds.has(r.threadId));
    if (invalidThreads.length > 0) {
      console.log('\nFound invalid threadIds:');
      invalidThreads.forEach(r => {
        console.log(`Number: ${r.number}, ThreadId: ${r.threadId}`);
      });
      throw new Error('Invalid threadIds found in CSV');
    }

    // Delete existing records
    console.log('Deleting existing records...');
    await prisma.isacordNumber.deleteMany();

    // Create new records
    console.log('Importing new records...');
    let created = 0;
    let withThread = 0;
    let withoutThread = 0;

    for (const record of records) {
      await prisma.isacordNumber.create({
        data: {
          number: record.number.toString(),
          threadId: record.threadId || null,  // Handle empty threadId
          isStockThread: record.isStockThread.toLowerCase() === 'true',
          wawakColorName: record.wawakColorName,
          wawakItemNumber: record.wawakItemNumber ? record.wawakItemNumber.toString() : null
        }
      });
      created++;
      
      if (record.threadId) {
        withThread++;
      } else {
        withoutThread++;
      }

      if (created % 100 === 0) {
        console.log(`Created ${created} records...`);
      }
    }

    console.log('\nImport completed successfully!');
    console.log(`Total records created: ${created}`);
    console.log(`Records with threadId: ${withThread}`);
    console.log(`Records without threadId: ${withoutThread}`);
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importIsacordNumbers();