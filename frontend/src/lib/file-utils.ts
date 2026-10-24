/**
 * Utility to convert an image URL to a File object.
 * This is useful for backend APIs that strictly require binary file uploads
 * even for existing images during updates.
 */
export async function urlToFile(url: string, fileName: string = 'image.jpg'): Promise<File | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const blob = await response.blob();
        const mimeType = blob.type || 'image/jpeg';

        return new File([blob], fileName, { type: mimeType });
    } catch (error) {
        console.error("Error converting URL to File:", error);
        return null;
    }
}
