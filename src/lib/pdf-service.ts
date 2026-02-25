import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface PDFData {
  quotation: any
  items: any[]
  settings: any
  user: any
  selectedTerms?: { title: string; text: string }[]
  currency?: 'INR' | 'USD'
  validityData?: { validityDate?: string; validityDays?: number }
}

export const generateQuotationPDF = async ({
  quotation,
  items,
  settings,
  user,
  selectedTerms,
  currency = 'INR',
  validityData
}: PDFData) => {

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const margin = 15
  const contentBottomLimit = pageHeight - 30

  const currencySymbol = currency === 'INR' ? 'Rs.' : '$'
  const currencyLabel = currency === 'INR' ? 'INR' : 'USD'

  let pageNumber = 1

  const drawPageBorder = () => {

    doc.setDrawColor(0, 82, 156)
    doc.setLineWidth(1.2)
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10)

    doc.setDrawColor(255, 102, 0)
    doc.setLineWidth(0.8)
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14)

    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.3)

    doc.rect(
      margin + 10,
      pageHeight - 20,
      pageWidth - (margin * 2) - 20,
      8
    )

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(0)

    doc.text(
      "Write us: info@raiselabequip.com / sales@raiselabequip.com | Contact: +91 91777 70365",
      pageWidth / 2,
      pageHeight - 14.5,
      { align: "center" }
    )
  }

  const drawHeader = (logoBase64: string) => {

    if (logoBase64) {
      doc.addImage(logoBase64, "JPEG", margin, 12, 70, 25)
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(0, 82, 156)

    doc.text("RAISE LAB EQUIPMENT", pageWidth - margin, 18, { align: "right" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(60)

    const address =
      "C-6, B1, Industrial Park, Moula Ali,\nHyderabad, Secunderabad,\nTelangana 500040"

    doc.text(address, pageWidth - margin, 24, {
      align: "right",
      lineHeightFactor: 1.4
    })

    doc.setDrawColor(0, 82, 156)
    doc.setLineWidth(0.5)
    doc.line(margin, 42, pageWidth - margin, 42)

    doc.setDrawColor(255, 102, 0)
    doc.setLineWidth(0.3)
    doc.line(margin, 43, pageWidth - margin, 43)

    doc.setTextColor(0)
  }

  const drawPageNumber = () => {

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(0)

    doc.text(
      `Page ${pageNumber}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    )
  }

  const ensurePageSpace = (neededHeight: number, logoBase64: string) => {

    if (currentY + neededHeight > contentBottomLimit) {

      doc.addPage()

      pageNumber++

      drawPageBorder()
      drawHeader(logoBase64)
      drawPageNumber()

      doc.setTextColor(0)

      currentY = 50
    }
  }

  let logoBase64 = ""

  try {
    logoBase64 = await getBase64ImageFromURL('/quotation-logo.jpg')
  } catch {}

  const itemImages: Record<string, any> = {}

  await Promise.all(
    items.map(async (item) => {
      if (!item.image_url) return
      try {
        itemImages[item.id] =
          await getBase64ImageWithDimensions(item.image_url)
      } catch {}
    })
  )

  drawPageBorder()
  drawHeader(logoBase64)
  drawPageNumber()

  let currentY = 50
  let isFirstPage = true

  items.forEach((item, index) => {

    if (index > 0) {

      doc.addPage()

      pageNumber++

      drawPageBorder()
      drawHeader(logoBase64)
      drawPageNumber()

      doc.setTextColor(0)

      currentY = 50
    }

    if (isFirstPage) {

      autoTable(doc, {
        startY: currentY,
        body: [[
          {
            content: `To\n\n${quotation.customer_name}`,
            styles: { fontStyle: "bold", fontSize: 10 }
          },
          {
            content:
              `Quote No : ${quotation.quotation_number}\n` +
              `Date : ${new Date().toLocaleDateString()}\n` +
              `Validity : 30 Days`,
            styles: { fontSize: 10, fontStyle: "bold" }
          }
        ]],
        theme: "grid",
        margin: { left: margin, right: margin }
      })

      currentY = (doc as any).lastAutoTable.finalY + 12

      isFirstPage = false
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(0, 82, 156)

    doc.text(
      "Technical & Commercial Offer",
      pageWidth / 2,
      currentY,
      { align: "center" }
    )

    currentY += 8

    doc.setTextColor(0)
    doc.setFontSize(12)

    doc.text(`For ${item.name}`, pageWidth / 2, currentY, { align: "center" })

    currentY += 12

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Description:", margin, currentY)

    currentY += 6

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    const desc = doc.splitTextToSize(
      item.description || "",
      pageWidth - (margin * 2)
    )

    doc.text(desc, margin, currentY)

    currentY += desc.length * 5 + 5

    const imageData = itemImages[item.id]

    if (item.image_format === "wide" && imageData) {

      ensurePageSpace(85, logoBase64)

      const maxWidth = pageWidth - (margin * 2) - 40
      const ratio = maxWidth / imageData.width

      const imgWidth = imageData.width * ratio
      const imgHeight = imageData.height * ratio

      const x = margin + 20

      doc.addImage(
        imageData.base64,
        "JPEG",
        x,
        currentY,
        imgWidth,
        imgHeight
      )

      currentY += imgHeight + 12
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text("FEATURES:", margin, currentY)

    currentY += 6

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    const featureWidth =
      item.image_format === "tall"
        ? (pageWidth - margin * 2) * 0.55
        : pageWidth - margin * 2

    const featureStartY = currentY

    item.features?.forEach((f: string) => {

      const split = doc.splitTextToSize(f, featureWidth)

      ensurePageSpace(split.length * 5, logoBase64)

      doc.text("•", margin, currentY)
      doc.text(split, margin + 5, currentY)

      currentY += split.length * 5
    })

    if (item.image_format === "tall" && imageData) {

      const imgWidth = (pageWidth - margin * 2) * 0.35

      const ratio = imgWidth / imageData.width

      const imgHeight = imageData.height * ratio

      const x = pageWidth - margin - imgWidth

      doc.addImage(
        imageData.base64,
        "JPEG",
        x,
        featureStartY,
        imgWidth,
        imgHeight
      )

      currentY = Math.max(currentY, featureStartY + imgHeight + 10)
    }

    if (item.specs?.length) {

      ensurePageSpace(20, logoBase64)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(0)

      doc.text("Specifications:", margin, currentY)

      currentY += 6

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)

      item.specs.forEach((s: any) => {

        ensurePageSpace(10, logoBase64)

        doc.text("•", margin, currentY)
        doc.text(`${s.key}: ${s.value}`, margin + 5, currentY)

        currentY += 6
      })
    }

    ensurePageSpace(30, logoBase64)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("Commercial Offer:", margin, currentY)

    currentY += 6

    autoTable(doc, {
      startY: currentY,
      head: [["S.No", "Description", "Qty", `Price (${currencyLabel})`]],
      body: [[
        "01",
        item.name,
        "1",
        `${currencySymbol} ${item.price}`
      ]],
      theme: "grid",
      margin: { left: margin, right: margin }
    })

    currentY = (doc as any).lastAutoTable.finalY + 10
  })

  doc.addPage()

  pageNumber++

  drawPageBorder()
  drawHeader(logoBase64)
  drawPageNumber()

  currentY = 55

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(0)

  doc.text("Terms And Conditions:", margin, currentY)

  doc.save(`${quotation.quotation_number}_Quotation.pdf`)

  return doc.output("blob")
}

const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {

    const img = new Image()

    img.crossOrigin = "anonymous"

    img.onload = () => {

      const canvas = document.createElement("canvas")

      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")

      ctx?.drawImage(img, 0, 0)

      resolve(canvas.toDataURL("image/jpeg", 0.85))
    }

    img.onerror = reject

    img.src = url
  })
}

const getBase64ImageWithDimensions = (url: string) => {
  return new Promise<any>((resolve, reject) => {

    const img = new Image()

    img.crossOrigin = "anonymous"

    img.onload = () => {

      const canvas = document.createElement("canvas")

      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")

      ctx?.drawImage(img, 0, 0)

      resolve({
        base64: canvas.toDataURL("image/jpeg", 0.85),
        width: img.width,
        height: img.height
      })
    }

    img.onerror = reject

    img.src = url
  })
}
