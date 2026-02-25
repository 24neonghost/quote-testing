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
    doc.setTextColor(60)

    const address =
      "C-6, B1, Industrial Park, Moula Ali,\nHyderabad, Secunderabad,\nTelangana 500040"

    doc.text(
      address,
      pageWidth - margin,
      24,
      { align: "right", lineHeightFactor: 1.4 }
    )

    doc.setDrawColor(0, 82, 156)
    doc.setLineWidth(0.5)
    doc.line(margin, 42, pageWidth - margin, 42)

    doc.setDrawColor(255, 102, 0)
    doc.setLineWidth(0.3)
    doc.line(margin, 43, pageWidth - margin, 43)
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

  let currentY = 50
  let isFirstPage = true

  items.forEach((item, index) => {

    if (index > 0) {

      doc.addPage()
      pageNumber++
      drawPageBorder()
      drawHeader(logoBase64)
      currentY = 50

    }

    if (isFirstPage) {

      const validityDate = validityData?.validityDate
        ? new Date(validityData.validityDate)
        : new Date()

      const toAddress =
        `To\n\n${quotation.customer_name}\n${quotation.customer_address || ""}`

      autoTable(doc, {
        startY: currentY,
        body: [[
          { content: toAddress },
          {
            content:
              `Quote No : ${quotation.quotation_number}\n` +
              `Date : ${new Date().toLocaleDateString()}\n` +
              `Validity : ${validityDate.toLocaleDateString()}`
          }
        ]],
        theme: "grid",
        margin: { left: margin, right: margin }
      })

      currentY =
        (doc as any).lastAutoTable.finalY + 10

      isFirstPage = false

    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text(
      "Technical & Commercial Offer",
      pageWidth / 2,
      currentY,
      { align: "center" }
    )

    currentY += 7

    doc.setFontSize(12)
    doc.text(
      `For ${item.name}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    )

    currentY += 12

    doc.setFontSize(10)
    doc.text("Description:", margin, currentY)

    currentY += 6

    doc.setFontSize(9)

    const desc =
      doc.splitTextToSize(
        item.description || "",
        pageWidth - margin * 2
      )

    doc.text(desc, margin, currentY)

    currentY += desc.length * 5 + 5

    const imageData = itemImages[item.id]

    doc.setFont("helvetica", "bold")
    doc.text("FEATURES:", margin, currentY)

    currentY += 6

    const featureStartY = currentY

    doc.setFont("helvetica", "normal")

    const featureWidth =
      (pageWidth - margin * 2) * 0.52

    let featureEndY = featureStartY

    item.features?.forEach((f: string) => {

      const split =
        doc.splitTextToSize(
          f,
          featureWidth - 10
        )

      doc.text("•", margin + 3, featureEndY)

      doc.text(split, margin + 8, featureEndY)

      featureEndY += split.length * 4.5

    })

    if (imageData?.base64) {

      const maxW =
        (pageWidth - margin * 2) * 0.42

      const maxH = 80

      const ratio =
        Math.min(
          maxW / imageData.width,
          maxH / imageData.height
        )

      const newW =
        imageData.width * ratio

      const newH =
        imageData.height * ratio

      const imgX =
        pageWidth - margin - newW - 5

      doc.addImage(
        imageData.base64,
        "JPEG",
        imgX,
        featureStartY,
        newW,
        newH
      )

      currentY =
        Math.max(
          featureEndY,
          featureStartY + newH
        ) + 10

    }
    else {
      currentY = featureEndY + 10
    }

    if (item.specs?.length) {

      doc.setFont("helvetica", "bold")
      doc.text("Specifications:", margin, currentY)

      currentY += 6

      doc.setFont("helvetica", "normal")

      item.specs.forEach((s: any) => {

        const txt =
          doc.splitTextToSize(
            `${s.key}: ${s.value}`,
            pageWidth - margin * 2
          )

        doc.text("•", margin + 3, currentY)

        doc.text(txt, margin + 8, currentY)

        currentY += txt.length * 5

      })

      currentY += 5

    }

  })

  doc.addPage()
  pageNumber++

  drawPageBorder()
  drawHeader(logoBase64)

  let y = 60

  doc.setFont("helvetica", "bold")
  doc.text("Terms And Conditions:", margin, y)

  y += 10

  selectedTerms?.forEach(t => {

    const split =
      doc.splitTextToSize(
        `${t.title}: ${t.text}`,
        pageWidth - margin * 2
      )

    doc.text("•", margin, y)

    doc.text(split, margin + 5, y)

    y += split.length * 5 + 3

  })

  const totalPages = doc.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {

    doc.setPage(i)

    doc.setFontSize(8)

    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    )

  }

  doc.save(`${quotation.quotation_number}_Quotation.pdf`)

  return doc.output("blob")
}


// image helpers remain same

const getBase64ImageFromURL = async (url: string) => {
  const img = new Image()
  img.crossOrigin = "anonymous"
  img.src = url

  await new Promise(res => img.onload = res)

  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext("2d")
  ctx?.drawImage(img, 0, 0)

  return canvas.toDataURL("image/jpeg", 0.85)
}

const getBase64ImageWithDimensions = async (url: string) => {

  const img = new Image()
  img.crossOrigin = "anonymous"
  img.src = url

  await new Promise(res => img.onload = res)

  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext("2d")
  ctx?.drawImage(img, 0, 0)

  return {
    base64: canvas.toDataURL("image/jpeg", 0.85),
    width: img.width,
    height: img.height
  }
}
