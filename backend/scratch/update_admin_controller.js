const fs = require('fs');
const path = 'src/modules/admin/controllers/product.controller.js';
let content = fs.readFileSync(path, 'utf8');

const target = 'discount: Number(variant.discount) || 0,';
const replacement = 'discount: Number(variant.discount) || 0,\n    diamondSpecs: {\n      carat: String(variant.diamondSpecs?.carat || "").trim(),\n      clarity: String(variant.diamondSpecs?.clarity || "").trim(),\n      color: String(variant.diamondSpecs?.color || "").trim(),\n      cut: String(variant.diamondSpecs?.cut || "").trim(),\n      shape: String(variant.diamondSpecs?.shape || "").trim(),\n      diamondCount: Number(variant.diamondSpecs?.diamondCount) || 0\n    },';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully updated Admin controller');
} else {
    console.error('Target not found in Admin controller');
    process.exit(1);
}
