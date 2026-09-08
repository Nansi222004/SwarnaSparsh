const fs = require('fs');
const path = 'src/modules/seller/controllers/product.controller.js';
let content = fs.readFileSync(path, 'utf8');

const target = 'finalPrice: Number(v.finalPrice) || 0,';
const replacement = 'finalPrice: Number(v.finalPrice) || 0,\n    diamondSpecs: {\n      carat: String(v.diamondSpecs?.carat || "").trim(),\n      clarity: String(v.diamondSpecs?.clarity || "").trim(),\n      color: String(v.diamondSpecs?.color || "").trim(),\n      cut: String(v.diamondSpecs?.cut || "").trim(),\n      shape: String(v.diamondSpecs?.shape || "").trim(),\n      diamondCount: Number(v.diamondSpecs?.diamondCount) || 0\n    },';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully updated Seller controller');
} else {
    console.error('Target not found in Seller controller');
    process.exit(1);
}
