import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const backupConfig = async (configName: string, data: any): Promise<string> => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${configName}-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    logger.info(`Configuration backed up: ${filename}`);
    return filepath;
  } catch (error) {
    logger.error('Failed to backup configuration', { error, configName });
    throw error;
  }
};

export const restoreConfig = async (filename: string): Promise<any> => {
  try {
    const filepath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filename}`);
    }

    const data = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Failed to restore configuration', { error, filename });
    throw error;
  }
};

export const listBackups = async (configName?: string): Promise<string[]> => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    
    if (configName) {
      return files.filter(f => f.startsWith(configName));
    }
    
    return files;
  } catch (error) {
    logger.error('Failed to list backups', { error });
    return [];
  }
};


