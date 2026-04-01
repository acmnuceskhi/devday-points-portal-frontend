import { toPng } from 'html-to-image'

export async function exportElementAsImage(elementId: string, fileNamePrefix: string): Promise<void> {
    const element = document.getElementById(elementId)
    if (!element) {
        throw new Error('Could not find export target on this page.')
    }

    const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#130808',
        skipFonts: true,
    })

    const link = document.createElement('a')
    const datePart = new Date().toISOString().slice(0, 10)
    link.href = dataUrl
    link.download = `${fileNamePrefix}-${datePart}.png`
    link.click()
}
