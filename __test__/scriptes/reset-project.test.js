const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

jest.mock('fs');
jest.mock('path');

describe('reset-project.js', () => {
    const mockRename = jest.fn((_, __, callback) => callback(null));
    const mockMkdir = jest.fn((_, __, callback) => callback(null));
    const mockWriteFile = jest.fn((_, __, callback) => callback(null));

    beforeAll(() => {
        fs.rename = mockRename;
        fs.mkdir = mockMkdir;
        fs.writeFile = mockWriteFile;
    });

    test('rename /app to /app-example', () => {
        require('../../scripts/reset-project');
        expect(mockRename).toHaveBeenCalledWith(
            path.join(process.cwd(), 'app'),
            path.join(process.cwd(), 'app-example'),
            expect.any(Function)
        );
    });

    test('create new /app directory', () => {
        require('../../scripts/reset-project');
        expect(mockMkdir).toHaveBeenCalledWith(
            path.join(process.cwd(), 'app'),
            { recursive: true },
            expect.any(Function)
        );
    });

    test('create app/index.tsx file', () => {
        require('../../scripts/reset-project');
        expect(mockWriteFile).toHaveBeenCalledWith(
            path.join(process.cwd(), 'app', 'index.tsx'),
            expect.stringContaining('Edit app/index.tsx to edit this screen.'),
            expect.any(Function)
        );
    });

    test('should create app/_layout.tsx file', () => {
        require('../../scripts/reset-project');
        expect(mockWriteFile).toHaveBeenCalledWith(
            path.join(process.cwd(), 'app', '_layout.tsx'),
            expect.stringContaining('<Stack.Screen name="index" />'),
            expect.any(Function)
        );
    });
});