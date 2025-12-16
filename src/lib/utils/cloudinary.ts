export async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'ml_default') // Free preset - no API key needed!
    formData.append('cloud_name', 'demo') // Replace with YOUR cloud name

    try {
        const response = await fetch(
            'https://api.cloudinary.com/v1_1/demo/image/upload', // Replace 'demo' with YOUR cloud name
            {
                method: 'POST',
                body: formData
            }
        )
        const data = await response.json()
        return data.secure_url
    } catch (error) {
        console.error('Upload failed:', error)
        throw error
    }
}