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
  const footerSafeY = pageHeight - 30

  const currencySymbol = currency === 'INR' ? 'Rs.' : '$'
  const currencyLabel = currency === 'INR' ? 'INR' : 'USD'

  // TOTAL PAGE COUNT FIX
  const totalPages = items.length + 1

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
    doc.rect(margin + 10, pageHeight - 20, pageWidth - (margin * 2) - 20, 8)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)

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

    doc.text(
      "RAISE LAB EQUIPMENT",
      pageWidth - margin,
      18,
      { align: "right" }
    )

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    const address =
      "C-6, B1, Industrial Park, Moula Ali,\nHyderabad, Secunderabad,\nTelangana 500040"

    doc.text(address, pageWidth - margin, 24, {
      align: "right",
      lineHeightFactor: 1.4
    })

    doc.setDrawColor(0, 82, 156)
    doc.line(margin, 42, pageWidth - margin, 42)

    doc.setDrawColor(255, 102, 0)
    doc.line(margin, 43, pageWidth - margin, 43)
  }

  const drawPageNumber = () => {

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)

    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    )
  }

  const ensureSpace = (requiredHeight: number) => {

    if (currentY + requiredHeight > footerSafeY) {

      doc.addPage()

      pageNumber++

      drawPageBorder()
      drawHeader(logoBase64)
      drawPageNumber()

      currentY = 50
    }
  }

  // LOAD LOGO
  let logoBase64 = ""

  try {
    logoBase64 = await getBase64ImageFromURL("/quotation-logo.jpg")
  } catch {}

  // LOAD ITEM IMAGES
  const itemImages: any = {}

  await Promise.all(
    items.map(async item => {

      if (!item.image_url) return

      try {

        const img = await getBase64ImageWithDimensions(item.image_url)

        itemImages[item.id] = img

      } catch {}
    })
  )

  drawPageBorder()
  drawHeader(logoBase64)
  drawPageNumber()

  let currentY = 50
  let isFirstPage = true

  for (const item of items) {

    if (!isFirstPage) {

      doc.addPage()

      pageNumber++

      drawPageBorder()
      drawHeader(logoBase64)
      drawPageNumber()

      currentY = 50
    }

    // TO BLOCK
    if (isFirstPage) {

      const validityDate = new Date(
        validityData?.validityDate ||
        quotation.validity_date ||
        quotation.created_at
      )

      const quoteNo = quotation.quotation_number

      const dateStr = new Date(
        quotation.created_at
      ).toLocaleDateString("en-GB").replace(/\//g, "-")

      const validStr = validityDate
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")

      autoTable(doc, {
        startY: currentY,
        body: [[
          {
            content:
              `To\n\n${quotation.customer_name}\n${quotation.customer_address || ""}`
          },
          {
            content:
              `Quote No : ${quoteNo}\nDate : ${dateStr}\nValidity : ${validStr}`
          }
        ]],
        theme: "grid",
        margin: { left: margin, right: margin }
      })

      currentY = (doc as any).lastAutoTable.finalY + 10

      isFirstPage = false
    }

    ensureSpace(20)

    doc.setFontSize(14)

    doc.setTextColor(0, 82, 156)

    doc.text(
      "Technical & Commercial Offer",
      pageWidth / 2,
      currentY,
      { align: "center" }
    )

    currentY += 8

    doc.setFontSize(12)

    doc.setTextColor(0)

    doc.text(
      `For ${item.name}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    )

    currentY += 10

    doc.setFontSize(10)

    doc.text("Description:", margin, currentY)

    currentY += 6

    const splitDesc = doc.splitTextToSize(
      item.description || "",
      pageWidth - margin * 2
    )

    ensureSpace(splitDesc.length * 5)

    doc.setFontSize(9)

    doc.text(splitDesc, margin, currentY)

    currentY += splitDesc.length * 5 + 8

    const image = itemImages[item.id]

    const format = item.image_format || "wide"

    // FORMAT 1 (WIDE IMAGE)
    if (format === "wide" && image) {

      const maxWidth = pageWidth - margin * 2

      const ratio = maxWidth / image.width

      const w = maxWidth

      const h = image.height * ratio

      ensureSpace(h + 10)

      doc.addImage(image.base64, "JPEG", margin, currentY, w, h)

      currentY += h + 10
    }

    // FEATURES
    const features = item.features || []

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")

    doc.text("FEATURES:", margin, currentY)

    currentY += 6

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    if (format === "tall" && image) {

      const imgWidth = 60
      const ratio = imgWidth / image.width
      const imgHeight = image.height * ratio

      const imgX = pageWidth - margin - imgWidth

      doc.addImage(image.base64, "JPEG", imgX, currentY, imgWidth, imgHeight)

      const featureWidth = pageWidth - margin * 2 - imgWidth - 5

      const startY = currentY

      for (const f of features) {

        const lines = doc.splitTextToSize(f, featureWidth)

        ensureSpace(lines.length * 5)

        doc.text("•", margin, currentY)
        doc.text(lines, margin + 5, currentY)

        currentY += lines.length * 5
      }

      currentY = Math.max(currentY, startY + imgHeight) + 10

    } else {

      for (const f of features) {

        const lines = doc.splitTextToSize(f, pageWidth - margin * 2)

        ensureSpace(lines.length * 5)

        doc.text("•", margin, currentY)
        doc.text(lines, margin + 5, currentY)

        currentY += lines.length * 5
      }

      currentY += 10
    }

    // SPECIFICATIONS FIX
    if (item.specs?.length) {

      ensureSpace(20)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)

      doc.text("Specifications:", margin, currentY)

      currentY += 6

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)

      for (const s of item.specs) {

        const line = `${s.key}: ${s.value}`

        const lines = doc.splitTextToSize(
          line,
          pageWidth - margin * 2
        )

        ensureSpace(lines.length * 5)

        doc.text("•", margin, currentY)

        doc.text(lines, margin + 5, currentY)

        currentY += lines.length * 5
      }

      currentY += 10
    }

  }

  // TERMS PAGE
  doc.addPage()

  pageNumber++

  drawPageBorder()
  drawHeader(logoBase64)
  drawPageNumber()

  currentY = 55

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")

  doc.text("Terms And Conditions:", margin, currentY)

  currentY += 10

  const terms = selectedTerms || []

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")

  for (const t of terms) {

    const line = `${t.title}: ${t.text}`

    const lines = doc.splitTextToSize(
      line,
      pageWidth - margin * 2
    )

    ensureSpace(lines.length * 5)

    doc.text("•", margin, currentY)
    doc.text(lines, margin + 5, currentY)

    currentY += lines.length * 5 + 3
  }

  const pdfName = `${quotation.quotation_number}_Quotation.pdf`

  doc.save(pdfName)

  return doc.output("blob")
}

const getBase64ImageFromURL = (url: string) =>
  new Promise<string>((resolve, reject) => {

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

const getBase64ImageWithDimensions = (url: string) =>
  new Promise<any>((resolve, reject) => {

    const img = new Image()

    img.crossOrigin = "anonymous"

    img.onload = () => {

      const canvas = document.createElement("canvas")

      canvas.width = img.width
      canvas.height = img.height

      canvas.getContext("2d")?.drawImage(img, 0, 0)

      resolve({
        base64: canvas.toDataURL("image/jpeg", 0.85),
        width: img.width,
        height: img.height
      })
    }

    img.onerror = reject

    img.src = url
  })
