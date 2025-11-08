import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// Mock AWS SDK
const mockGetObjectCommand = jest.fn<any>();
const mockR2Client = {
  send: jest.fn<any>()
};

jest.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: mockGetObjectCommand,
  S3Client: jest.fn(() => mockR2Client)
}));

jest.mock('../r2Client', () => ({
  r2Client: mockR2Client,
  BUCKET_NAME: 'test-bucket'
}));

describe('Request Handler Service', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    
    // Import the app after mocks are set up
    const requestHandlerApp = require('../index');
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('request-handler');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Static File Serving', () => {
    it('should serve index.html for root path', async () => {
      const mockFileContent = '<html><body>Hello World</body></html>';
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from(mockFileContent);
        }
      };

      mockR2Client.send.mockResolvedValueOnce({
        Body: mockStream
      });

      const response = await request(app)
        .get('/')
        .set('Host', 'abc123.localhost')
        .expect(200);

      expect(response.text).toBe(mockFileContent);
      expect(response.headers['content-type']).toContain('text/html');
      expect(mockGetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'dist/abc123/index.html'
      });
    });

    it('should serve CSS files with correct content type', async () => {
      const mockCSS = 'body { margin: 0; }';
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from(mockCSS);
        }
      };

      mockR2Client.send.mockResolvedValueOnce({
        Body: mockStream
      });

      const response = await request(app)
        .get('/styles.css')
        .set('Host', 'abc123.localhost')
        .expect(200);

      expect(response.text).toBe(mockCSS);
      expect(response.headers['content-type']).toContain('text/css');
    });

    it('should serve JavaScript files with correct content type', async () => {
      const mockJS = 'console.log("Hello World");';
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from(mockJS);
        }
      };

      mockR2Client.send.mockResolvedValueOnce({
        Body: mockStream
      });

      const response = await request(app)
        .get('/app.js')
        .set('Host', 'abc123.localhost')
        .expect(200);

      expect(response.text).toBe(mockJS);
      expect(response.headers['content-type']).toContain('application/javascript');
    });

    it('should serve JSON files with correct content type', async () => {
      const mockJSON = '{"name": "test"}';
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from(mockJSON);
        }
      };

      mockR2Client.send.mockResolvedValueOnce({
        Body: mockStream
      });

      const response = await request(app)
        .get('/data.json')
        .set('Host', 'abc123.localhost')
        .expect(200);

      expect(response.text).toBe(mockJSON);
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should serve image files with correct content type', async () => {
      const mockImageBuffer = Buffer.from('fake-png-data');
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield mockImageBuffer;
        }
      };

      mockR2Client.send.mockResolvedValueOnce({
        Body: mockStream
      });

      const response = await request(app)
        .get('/image.png')
        .set('Host', 'abc123.localhost')
        .expect(200);

      expect(response.headers['content-type']).toContain('image/png');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent files', async () => {
      const error = new Error('NoSuchKey');
      error.name = 'NoSuchKey';
      mockR2Client.send.mockRejectedValueOnce(error);

      const response = await request(app)
        .get('/nonexistent.html')
        .set('Host', 'abc123.localhost')
        .expect(404);

      expect(response.text).toContain('File Not Found');
      expect(response.text).toContain('abc123');
    });

    it('should return 404 for non-existent deployment', async () => {
      mockR2Client.send.mockResolvedValueOnce({
        Body: null
      });

      const response = await request(app)
        .get('/')
        .set('Host', 'nonexistent.localhost')
        .expect(404);

      expect(response.text).toContain('Deployment Not Found');
      expect(response.text).toContain('nonexistent');
    });

    it('should handle R2 service errors', async () => {
      const error = new Error('Service Unavailable');
      mockR2Client.send.mockRejectedValueOnce(error);

      const response = await request(app)
        .get('/test.html')
        .set('Host', 'abc123.localhost')
        .expect(404);

      expect(response.text).toContain('File Not Found');
    });

    it('should return 404 for favicon requests', async () => {
      const response = await request(app)
        .get('/favicon.ico')
        .set('Host', 'abc123.localhost')
        .expect(404);

      expect(response.text).toBe('Not found');
    });
  });

  describe('Service Info Page', () => {
    it('should show service info for direct access to request handler', async () => {
      const response = await request(app)
        .get('/')
        .set('Host', 'request-handler-service.onrender.com')
        .expect(200);

      expect(response.text).toContain('ShipStream Request Handler');
      expect(response.text).toContain('How it works');
      expect(response.text).toContain('Service Status');
    });
  });

  describe('Subdomain Parsing', () => {
    it('should extract deployment ID from subdomain', async () => {
      const mockFileContent = '<html>Test</html>';
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from(mockFileContent);
        }
      };

      mockR2Client.send.mockResolvedValueOnce({
        Body: mockStream
      });

      await request(app)
        .get('/test.html')
        .set('Host', 'my-deployment-123.example.com')
        .expect(200);

      expect(mockGetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'dist/my-deployment-123/test.html'
      });
    });

    it('should handle complex subdomain structures', async () => {
      const mockFileContent = '<html>Test</html>';
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from(mockFileContent);
        }
      };

      mockR2Client.send.mockResolvedValueOnce({
        Body: mockStream
      });

      await request(app)
        .get('/')
        .set('Host', 'abc-123-def.staging.example.com')
        .expect(200);

      expect(mockGetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'dist/abc-123-def/index.html'
      });
    });
  });
});