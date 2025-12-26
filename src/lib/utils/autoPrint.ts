// src/lib/utils/autoPrint.ts - Auto Printer Detection
export class PrintManager {
    private printerDetected = false
    private printerName = ''

    // ✅ Detect if printer is available
    async detectPrinter(): Promise<boolean> {
        try {
            // Check Web Print API
            if ('getPrinters' in navigator) {
                const printers = await (navigator as any).getPrinters()
                if (printers && printers.length > 0) {
                    this.printerDetected = true
                    this.printerName = printers[0].name
                    console.log('🖨️ Printer detected:', this.printerName)
                    return true
                }
            }

            // Check if browser print is available
            if (typeof window.print === 'function') {
                this.printerDetected = true
                this.printerName = 'Browser Print'
                console.log('🖨️ Browser print available')
                return true
            }

            return false
        } catch (error) {
            console.warn('Printer detection failed:', error)
            return false
        }
    }

    // ✅ Auto-print receipt
    async autoPrint(receiptId: string): Promise<boolean> {
        try {
            await this.detectPrinter()

            if (!this.printerDetected) {
                console.warn('⚠️ No printer detected, using manual print')
                window.print()
                return true
            }

            // Try advanced printing APIs
            if ('printDocument' in navigator) {
                const element = document.getElementById(receiptId)
                if (element) {
                    await (navigator as any).printDocument(element)
                    console.log('✅ Auto-printed via API')
                    return true
                }
            }

            // Fallback to browser print
            window.print()
            console.log('✅ Printed via browser')
            return true
        } catch (error) {
            console.error('Print error:', error)
            window.print() // Fallback
            return false
        }
    }

    // ✅ Silent print (no dialog)
    async silentPrint(receiptId: string): Promise<boolean> {
        try {
            const element = document.getElementById(receiptId)
            if (!element) return false

            // Create iframe for silent print
            const iframe = document.createElement('iframe')
            iframe.style.display = 'none'
            document.body.appendChild(iframe)

            const iframeDoc = iframe.contentWindow?.document
            if (!iframeDoc) return false

            iframeDoc.open()
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Print Receipt</title>
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        body { margin: 0; padding: 10mm; font-family: monospace; }
                    </style>
                </head>
                <body>${element.innerHTML}</body>
                </html>
            `)
            iframeDoc.close()

            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 500))

            iframe.contentWindow?.print()

            // Cleanup after print
            setTimeout(() => document.body.removeChild(iframe), 1000)

            console.log('✅ Silent print completed')
            return true
        } catch (error) {
            console.error('Silent print error:', error)
            return false
        }
    }

    // ✅ Check printer status
    isPrinterReady(): boolean {
        return this.printerDetected
    }

    getPrinterName(): string {
        return this.printerName || 'No printer detected'
    }
}

export const printManager = new PrintManager()

// ✅ Auto-detect on load
if (typeof window !== 'undefined') {
    printManager.detectPrinter()
}