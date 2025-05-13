import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
// import mime from 'mime-types';
// import { ObjectId } from 'mongodb';
import pkg from 'mongodb';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

const { ObjectId } = pkg;

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager/';

export default class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const fileDocument = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : new ObjectId(parentId),
    };

    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(fileDocument);
      fileDocument.id = result.insertedId;
      return res.status(201).json({
        id: fileDocument.id,
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }

    if (!fs.existsSync(FOLDER_PATH)) fs.mkdirSync(FOLDER_PATH, { recursive: true });

    const filename = uuidv4();
    const localPath = path.join(FOLDER_PATH, filename);
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(localPath, buffer);

    fileDocument.localPath = localPath;

    const result = await dbClient.db.collection('files').insertOne(fileDocument);
    return res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static async getShow(req, res) {
    try {
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Not found' });
      }
      const linkedFile = await dbClient.db.collection('files').findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(userId),
      });
      // console.log(linkedFile);
      if (!linkedFile) {
        return res.status(404).json({ message: 'Not found' });
      }
      return res.status(200).json({
        id: linkedFile._id,
        userId: linkedFile.userId,
        name: linkedFile.name,
        type: linkedFile.type,
        isPublic: linkedFile.isPublic,
        parentId: linkedFile.parentId,
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: 'Error fetching file for the specified user', error });
    }
  }

  static async getIndex(req, res) {
    try {
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const parentId = req.query.parentId || '0';
      const page = parseInt(req.query.page, 10) || 0;
      const pageSize = 20;
      const skip = page * pageSize;

      const query = {
        userId: new ObjectId(userId),
        parentId: parentId === '0' ? 0 : new ObjectId(parentId),
      };

      const files = await dbClient.db.collection('files')
        .find(query)
        .skip(skip)
        .limit(pageSize)
        .toArray();

      const formattedFiles = files.map((file) => ({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      }));

      return res.status(200).json(formattedFiles);
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ 'Error fetching files for the specified parent data': error });
    }
  }
}
