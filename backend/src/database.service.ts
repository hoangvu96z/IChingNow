import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  tokens: number;
  history: Array<{
    id: string;
    createdAt: string;
    question: string;
    primaryHexName: string;
    changedHexName: string | null;
    aiInterpretation: string;
  }>;
}

export interface DBData {
  users: User[];
}

@Injectable()
export class DatabaseService {
  private readonly dbFile = path.resolve(process.cwd(), 'database.json');

  constructor() {
    if (!fs.existsSync(this.dbFile)) {
      fs.writeFileSync(this.dbFile, JSON.stringify({ users: [] }, null, 2));
    }
  }

  readDB(): DBData {
    try {
      const data = fs.readFileSync(this.dbFile, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return { users: [] };
    }
  }

  writeDB(data: DBData): void {
    fs.writeFileSync(this.dbFile, JSON.stringify(data, null, 2));
  }
}
