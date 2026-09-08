const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.resolve(__dirname, '../src/modules/user/assets');
const STATE_FILE = path.resolve(__dirname, './processed-images.json');
const MAX_DIM = 1200; // Limit large dimensions to 1200px max width/height

// Load tracking state
let processedState = {};
if (fs.existsSync(STATE_FILE)) {
    try {
        processedState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (e) {
        console.warn('Could not parse state file, starting fresh.');
    }
}

// Save tracking state
function saveState() {
    fs.writeFileSync(STATE_FILE, JSON.stringify(processedState, null, 2));
}

// Recursive file walker
function getFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files);
        } else {
            const ext = path.extname(name).toLowerCase();
            if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                files.push(name);
            }
        }
    }
    return files;
}

async function compressImage(filePath) {
    const relativePath = path.relative(ASSETS_DIR, filePath);
    try {
        const stats = fs.statSync(filePath);
        const originalSize = stats.size;

        // Skip files that are already small (e.g., under 50KB) unless they are extremely large in dimensions
        if (originalSize < 50 * 1024 && !filePath.includes('family_wide_banner_4k')) {
            return;
        }

        // Check if already processed in a previous run
        if (processedState[relativePath] && processedState[relativePath] === originalSize) {
            // Already optimized size, skip
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        
        // Read file into buffer to prevent file lock
        const fileBuffer = fs.readFileSync(filePath);
        let image = sharp(fileBuffer);
        const metadata = await image.metadata();

        let width = metadata.width;
        let height = metadata.height;
        let needsResize = false;

        // Check if resize is required
        if (width > MAX_DIM || height > MAX_DIM) {
            needsResize = true;
            if (width > height) {
                height = Math.round(height * (MAX_DIM / width));
                width = MAX_DIM;
            } else {
                width = Math.round(width * (MAX_DIM / height));
                height = MAX_DIM;
            }
        }

        if (needsResize) {
            image = image.resize(width, height, { fit: 'inside' });
        }

        // Apply compression parameters depending on type
        let buffer;
        if (ext === '.png') {
            buffer = await image
                .png({
                    quality: 80,
                    compressionLevel: 9,
                    palette: true // Enables quantization (8-bit index PNG)
                })
                .toBuffer();
        } else {
            buffer = await image
                .jpeg({
                    quality: 75,
                    progressive: true
                })
                .toBuffer();
        }

        const newSize = buffer.length;

        // Only overwrite if we actually made it smaller!
        if (newSize < originalSize) {
            fs.writeFileSync(filePath, buffer);
            const savings = ((originalSize - newSize) / originalSize) * 100;
            console.log(`[Optimized] ${relativePath}`);
            console.log(`  Size: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(newSize / 1024).toFixed(1)}KB (-${savings.toFixed(1)}%)`);
            // Store new file size in state
            processedState[relativePath] = newSize;
        } else {
            console.log(`[Skipped] ${relativePath} (Already optimal)`);
            processedState[relativePath] = originalSize;
        }
        saveState();
    } catch (err) {
        console.error(`[Error] Failed to process ${relativePath}:`, err.message);
    }
}

async function run() {
    console.log(`Starting asset optimization in: ${ASSETS_DIR}`);
    const files = getFiles(ASSETS_DIR);
    console.log(`Found ${files.length} image files to analyze...`);

    let processedCount = 0;
    for (const file of files) {
        await compressImage(file);
        processedCount++;
    }

    console.log(`Optimization completed. Processed ${processedCount} files.`);
}

run();
