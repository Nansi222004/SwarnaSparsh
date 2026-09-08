export const downloadImage = (imageUrl, fileName) => {
    fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'download.png';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(err => {
            console.error("Failed to download image:", err);
            // Fallback for cross-origin issues
            const a = document.createElement('a');
            a.href = imageUrl;
            a.target = '_blank';
            a.download = fileName || 'download.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
};

export const downloadSvgNode = (svgNode, fileName = 'barcode.svg') => {
    if (!svgNode) return;

    try {
        const serializer = new XMLSerializer();
        const svgMarkup = serializer.serializeToString(svgNode);
        const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Failed to download SVG node:', err);
    }
};

export const downloadTextFile = (content, fileName = 'download.txt', mimeType = 'text/plain;charset=utf-8') => {
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Failed to download text file:', err);
    }
};
