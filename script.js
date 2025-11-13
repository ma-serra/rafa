const imageUpload = document.getElementById('imageUpload');
const previewImage = document.getElementById('previewImage');
const promptInput = document.getElementById('promptInput');
const generateButton = document.getElementById('generateButton');
const generatedImage = document.getElementById('generatedImage');
const loadingMessage = document.getElementById('loadingMessage');
const pasteImageUrl = document.getElementById('pasteImageUrl');
const imageUploadArea = document.getElementById('imageUploadArea');

let currentInputImageSource = null;

// Function to update the preview and the source variable
function updateInputImage(source) {
    currentInputImageSource = source;
    if (source) {
        previewImage.src = source;
        previewImage.style.display = 'block';
    } else {
        previewImage.src = '#';
        previewImage.style.display = 'none';
    }
}

// Clear all input methods (file input, URL input, and current image source)
function clearAllInputMethods() {
    imageUpload.value = null; // Clear file input
    pasteImageUrl.value = ''; // Clear URL input
    updateInputImage(null); // Clear preview and source
}

imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            clearAllInputMethods();
            updateInputImage(e.target.result); // e.target.result is a Data URL
        };
        reader.readAsDataURL(file);
    } else {
        // If file input is cleared without selecting a file, also clear others if no active source
        if (!currentInputImageSource) { // Only clear if no other source is active
            clearAllInputMethods();
        }
    }
});

pasteImageUrl.addEventListener('input', () => {
    const url = pasteImageUrl.value.trim();
    if (url) {
        // Basic URL validation
        if (url.startsWith('http://') || url.startsWith('https://')) {
            clearAllInputMethods();
            pasteImageUrl.value = url; // Ensure the input field retains the valid URL
            updateInputImage(url); // URL is passed directly
        } else {
            // If the user types an invalid URL, clear the preview but keep the text
            updateInputImage(null);
        }
    } else {
        updateInputImage(null);
    }
});

// Drag and drop functionality
imageUploadArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    imageUploadArea.classList.add('drag-over'); // Visual feedback
});

imageUploadArea.addEventListener('dragleave', (event) => {
    event.preventDefault();
    imageUploadArea.classList.remove('drag-over');
});

imageUploadArea.addEventListener('drop', (event) => {
    event.preventDefault();
    imageUploadArea.classList.remove('drag-over');
    clearAllInputMethods();

    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            updateInputImage(e.target.result); // e.target.result is a Data URL
        };
        reader.readAsDataURL(file);
    }
});

imageUploadArea.addEventListener('paste', async (event) => {
    event.preventDefault(); // Prevent default paste behavior
    clearAllInputMethods();

    // Check for image files in clipboard
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    updateInputImage(e.target.result); // e.target.result is a Data URL
                };
                reader.readAsDataURL(file);
                return; // Only process the first image found
            }
        }
    }

    // Check for text (URL) in clipboard
    const text = event.clipboardData.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        pasteImageUrl.value = text;
        updateInputImage(text); // URL is passed directly
    }
    // If neither file nor valid URL, then nothing happens, all inputs remain cleared.
});

// Function to convert a URL to a Data URL (for websim.imageGen)
async function urlToDataUrl(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

generateButton.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();

    if (!currentInputImageSource) {
        alert('Please upload, paste an image, or provide an image URL first.');
        return;
    }

    if (!prompt) {
        alert('Please enter a prompt.');
        return;
    }

    generateButton.disabled = true;
    loadingMessage.style.display = 'block';
    generatedImage.style.display = 'none';

    try {
        // Call websim.imageGen with the uploaded image and prompt
        const result = await websim.imageGen({
            prompt: prompt,
            image_inputs: [
                {
                    url: currentInputImageSource,
                },
            ],
            // You can add other options like aspect_ratio here if desired
            // aspect_ratio: "1:1", 
        });

        if (result && result.url) {
            generatedImage.src = result.url;
            generatedImage.style.display = 'block';
        } else {
            alert('Failed to generate image. No URL returned.');
        }

    } catch (error) {
        console.error('Error generating image:', error);
        alert('An error occurred during image generation. Please try again.');
    } finally {
        generateButton.disabled = false;
        loadingMessage.style.display = 'none';
    }
});