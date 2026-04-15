import { toPng } from 'html-to-image'

export async function exportElementAsImage(elementId: string, fileNamePrefix: string): Promise<void> {
    const element = document.getElementById(elementId)
    if (!element) {
        throw new Error('Could not find export target on this page.')
    }

    const exportWidth = element.scrollWidth || element.clientWidth
    const exportHeight = element.scrollHeight || element.clientHeight

    if (!exportWidth || !exportHeight) {
        throw new Error('Export template is not ready yet. Please try again.')
    }

    const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        width: exportWidth,
        height: exportHeight,
        skipFonts: true,
        style: {
            opacity: '1',
            visibility: 'visible',
        },
    })

    const link = document.createElement('a')
    const datePart = new Date().toISOString().slice(0, 10)
    link.href = dataUrl
    link.download = `${fileNamePrefix}-${datePart}.png`
    link.click()
}
